import { randomInt } from 'node:crypto';
import type { Db } from '../db.js';
import type { Deps } from '../deps.js';
import { findAvailability, pickTable } from './availability.js';
import { formatEur, lang, type MessageData, type MessageKind } from './messages.js';
import { enqueueGuestMessage } from './notifications.js';
import { AppError, type Reservation, type ReservationStatus, type Restaurant } from './types.js';
import { isValidDate, isValidTime, utcToLocal } from '../time.js';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bez 0/O/1/I
export function newCode(): string {
  let s = '';
  for (let i = 0; i < 6; i++) s += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return s;
}

/** Normalizira broj na E.164 (hrvatski brojevi bez +385 dobivaju +385). */
export function normalizePhone(p?: string | null): string | null {
  if (!p) return null;
  let s = p.replace(/[\s\-()/.]/g, '');
  if (s.startsWith('00')) s = '+' + s.slice(2);
  if (s.startsWith('0')) s = '+385' + s.slice(1);
  if (!s.startsWith('+')) s = '+' + s;
  return /^\+\d{8,15}$/.test(s) ? s : null;
}

export interface CreateInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  language?: string | null;
  partySize: number;
  date: string;
  time: string;
  zone?: string | null;
  notes?: string | null;
  source: string;
  marketingConsent?: boolean;
  /** admin smije preskočiti garanciju */
  skipGuarantee?: boolean;
}

export interface CreateResult {
  reservation: Reservation;
  guaranteeUrl: string | null;
  alternatives?: { date: string; time: string }[];
}

function manageUrl(deps: Deps, r: Restaurant, code: string) {
  return `${deps.config.publicBaseUrl}/b/${r.slug}?code=${code}`;
}

async function messageData(db: Db, deps: Deps, r: Restaurant, res: Reservation): Promise<{ data: MessageData; guest: any }> {
  const guest = (await db.query('select * from guests where id = $1', [res.guest_id])).rows[0];
  const local = utcToLocal(new Date(res.start_at), r.timezone);
  return {
    guest,
    data: {
      restaurantName: r.name, guestName: guest.name, date: local.date, time: local.time,
      partySize: res.party_size, code: res.code, manageUrl: manageUrl(deps, r, res.code),
      noShowFee: r.no_show_fee_cents ? formatEur(r.no_show_fee_cents) : undefined,
      reviewUrl: r.google_review_url ?? undefined,
    },
  };
}

export async function notify(db: Db, deps: Deps, r: Restaurant, res: Reservation, kind: MessageKind, extra: Partial<MessageData> = {}, sendAfter?: Date) {
  const { data, guest } = await messageData(db, deps, r, res);
  return enqueueGuestMessage(db, r, { reservationId: res.id, guest, kind, data: { ...data, ...extra }, sendAfter });
}

function needsGuarantee(r: Restaurant, deps: Deps, partySize: number) {
  return r.guarantee_mode === 'card' && partySize >= r.guarantee_min_party && !!deps.payments && !!r.stripe_account_id;
}

export async function createReservation(db: Db, deps: Deps, r: Restaurant, input: CreateInput): Promise<CreateResult> {
  const name = input.name?.trim();
  if (!name) throw new AppError(400, 'name_required', 'Ime je obavezno');
  const phone = normalizePhone(input.phone);
  if (input.phone && !phone) throw new AppError(400, 'bad_phone', 'Neispravan broj telefona');
  const email = input.email?.trim().toLowerCase() || null;
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new AppError(400, 'bad_email', 'Neispravan email');
  if (!phone && !email) throw new AppError(400, 'contact_required', 'Potreban je broj telefona ili email');
  if (!isValidDate(input.date) || !isValidTime(input.time)) throw new AppError(400, 'bad_datetime', 'Neispravan datum ili vrijeme');
  const partySize = Math.floor(Number(input.partySize));
  if (!(partySize >= 1)) throw new AppError(400, 'bad_party', 'Broj osoba mora biti barem 1');
  if (partySize > r.max_party_size)
    throw new AppError(409, 'party_too_large', `Online primamo do ${r.max_party_size} osoba; za veće grupe nazovite restoran`);

  const guarantee = !input.skipGuarantee && needsGuarantee(r, deps, partySize);

  const created = await db.tx(async (t) => {
    // zaključaj restoran da dvije rezervacije ne dobiju isti stol
    await t.query('select id from restaurants where id = $1 for update', [r.id]);
    const pick = await pickTable(t, r, { date: input.date, time: input.time, partySize, zone: input.zone ?? undefined });
    if (pick.start.getTime() < deps.now().getTime()) throw new AppError(409, 'in_past', 'To vrijeme je već prošlo');
    if (!pick.withinHours) throw new AppError(409, 'closed', 'Restoran tada ne radi ili je to prekasno za dolazak');
    if (!pick.table) return null;

    // gost: po mobitelu, inače po emailu
    let guest = phone
      ? (await t.query('select * from guests where restaurant_id = $1 and phone = $2', [r.id, phone])).rows[0]
      : (await t.query('select * from guests where restaurant_id = $1 and lower(email) = $2 order by id limit 1', [r.id, email])).rows[0];
    if (!guest) {
      guest = (
        await t.query(
          `insert into guests (restaurant_id, name, phone, email, language, marketing_consent)
           values ($1,$2,$3,$4,$5,$6) returning *`,
          [r.id, name, phone, email, lang(input.language ?? r.default_language), !!input.marketingConsent],
        )
      ).rows[0];
    } else {
      guest = (
        await t.query(
          `update guests set name = $2, email = coalesce($3, email), language = $4,
             marketing_consent = marketing_consent or $5 where id = $1 returning *`,
          [guest.id, name, email, lang(input.language ?? guest.language), !!input.marketingConsent],
        )
      ).rows[0];
    }

    const status: ReservationStatus = guarantee ? 'pending_guarantee' : 'confirmed';
    const expires = guarantee ? new Date(deps.now().getTime() + 30 * 60_000) : null;
    let res: Reservation | undefined;
    for (let i = 0; i < 5 && !res; i++) {
      try {
        res = (
          await t.query<Reservation>(
            `insert into reservations (code, restaurant_id, guest_id, table_id, party_size, start_at, end_at, status, source, notes, guarantee_expires_at, created_at)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning *`,
            [newCode(), r.id, guest.id, pick.table.id, partySize, pick.start, pick.end, status, input.source, input.notes ?? '', expires, deps.now()],
          )
        ).rows[0];
      } catch (e: any) {
        if (!String(e?.message).includes('reservations_code_key')) throw e;
      }
    }
    return { res: res!, guest };
  });

  if (!created) {
    const alternatives = (await findAvailability(db, r, { date: input.date, partySize, zone: input.zone ?? undefined, now: deps.now() }))
      .map((s) => ({ date: s.date, time: s.time }));
    throw Object.assign(new AppError(409, 'no_table', 'Nema slobodnog stola u to vrijeme'), { alternatives });
  }

  let { res } = created;
  let guaranteeUrl: string | null = null;
  if (guarantee && deps.payments) {
    const session = await deps.payments.createGuaranteeSession({
      restaurant: r, reservationCode: res.code, guestEmail: created.guest.email, customerId: created.guest.stripe_customer_id,
      successUrl: `${deps.config.publicBaseUrl}/b/${r.slug}?code=${res.code}&guarantee=ok`,
      cancelUrl: `${deps.config.publicBaseUrl}/b/${r.slug}?code=${res.code}&guarantee=cancel`,
    });
    res = (await db.query<Reservation>('update reservations set stripe_checkout_session_id = $2 where id = $1 returning *', [res.id, session.id])).rows[0];
    guaranteeUrl = session.url;
    await notify(db, deps, r, res, 'guarantee_link', { guaranteeUrl });
  } else {
    await notify(db, deps, r, res, 'confirmation');
  }
  return { reservation: res, guaranteeUrl };
}

export async function getByCode(db: Db, r: Restaurant, code: string): Promise<Reservation> {
  const { rows } = await db.query<Reservation>(
    'select * from reservations where restaurant_id = $1 and code = $2', [r.id, code.trim().toUpperCase()],
  );
  if (!rows[0]) throw new AppError(404, 'reservation_not_found', 'Rezervacija nije pronađena');
  return rows[0];
}

/** Gost mora potvrditi identitet brojem mobitela ili emailom s rezervacije. */
export async function verifyGuest(db: Db, res: Reservation, contact: string | null | undefined): Promise<void> {
  if (!contact) throw new AppError(403, 'contact_required', 'Za izmjenu treba broj mobitela ili email s rezervacije');
  const g = (await db.query('select phone, email from guests where id = $1', [res.guest_id])).rows[0];
  const phone = normalizePhone(contact);
  const ok = (phone && g.phone === phone) || (g.email && g.email.toLowerCase() === contact.trim().toLowerCase());
  if (!ok) throw new AppError(403, 'contact_mismatch', 'Kontakt se ne poklapa s rezervacijom');
}

export async function findUpcomingByPhone(db: Db, r: Restaurant, phoneRaw: string, now: Date): Promise<Reservation[]> {
  const phone = normalizePhone(phoneRaw);
  if (!phone) return [];
  return (
    await db.query<Reservation>(
      `select res.* from reservations res join guests g on g.id = res.guest_id
        where res.restaurant_id = $1 and g.phone = $2 and res.start_at > $3
          and res.status in ('confirmed','pending_guarantee') order by res.start_at`,
      [r.id, phone, now],
    )
  ).rows;
}

export async function cancelReservation(db: Db, deps: Deps, r: Restaurant, code: string, contact: string | null, opts: { admin?: boolean } = {}) {
  const res = await getByCode(db, r, code);
  if (!opts.admin) await verifyGuest(db, res, contact);
  if (!['confirmed', 'pending_guarantee'].includes(res.status))
    throw new AppError(409, 'not_cancellable', 'Ova rezervacija se više ne može otkazati');
  const updated = (
    await db.query<Reservation>(`update reservations set status = 'cancelled', updated_at = now() where id = $1 returning *`, [res.id])
  ).rows[0];
  await notify(db, deps, r, updated, 'cancellation');
  return updated;
}

export async function modifyReservation(
  db: Db, deps: Deps, r: Restaurant, code: string, contact: string | null,
  change: { date?: string; time?: string; partySize?: number }, opts: { admin?: boolean } = {},
) {
  const res = await getByCode(db, r, code);
  if (!opts.admin) await verifyGuest(db, res, contact);
  if (!['confirmed', 'pending_guarantee'].includes(res.status))
    throw new AppError(409, 'not_modifiable', 'Ova rezervacija se više ne može mijenjati');
  const cur = utcToLocal(new Date(res.start_at), r.timezone);
  const date = change.date ?? cur.date;
  const time = change.time ?? cur.time;
  const partySize = change.partySize ?? res.party_size;
  if (!isValidDate(date) || !isValidTime(time)) throw new AppError(400, 'bad_datetime', 'Neispravan datum ili vrijeme');
  if (partySize > r.max_party_size) throw new AppError(409, 'party_too_large', `Online primamo do ${r.max_party_size} osoba`);
  const updated = await db.tx(async (t) => {
    await t.query('select id from restaurants where id = $1 for update', [r.id]);
    const pick = await pickTable(t, r, { date, time, partySize, excludeReservationId: res.id });
    if (!pick.withinHours) throw new AppError(409, 'closed', 'Restoran tada ne radi');
    if (!pick.table) throw new AppError(409, 'no_table', 'Nema slobodnog stola u to vrijeme');
    return (
      await t.query<Reservation>(
        `update reservations set start_at = $2, end_at = $3, party_size = $4, table_id = $5, reminder_sent_at = null, updated_at = now()
          where id = $1 returning *`,
        [res.id, pick.start, pick.end, partySize, pick.table.id],
      )
    ).rows[0];
  });
  await notify(db, deps, r, updated, 'modified');
  return updated;
}

/** Stripe webhook: gost je ostavio karticu → rezervacija potvrđena. */
export async function confirmGuarantee(
  db: Db, deps: Deps, sessionId: string, paymentMethodId: string, customerId: string | null,
): Promise<Reservation | null> {
  const res = (
    await db.query<Reservation>(
      `update reservations set status = 'confirmed', stripe_payment_method_id = $2, guarantee_expires_at = null, updated_at = now()
        where stripe_checkout_session_id = $1 and status = 'pending_guarantee' returning *`,
      [sessionId, paymentMethodId],
    )
  ).rows[0];
  if (!res) return null;
  if (customerId) await db.query('update guests set stripe_customer_id = $2 where id = $1', [res.guest_id, customerId]);
  const r = (await db.query<Restaurant>('select * from restaurants where id = $1', [res.restaurant_id])).rows[0];
  await notify(db, deps, r, res, 'confirmation');
  return res;
}

/** Rezervacije bez garancije nakon 30 min se oslobađaju. */
export async function expirePending(db: Db, now: Date): Promise<number> {
  const { rows } = await db.query(
    `update reservations set status = 'expired', updated_at = now()
      where status = 'pending_guarantee' and guarantee_expires_at < $1 returning id`,
    [now],
  );
  return rows.length;
}

/** Admin: promjena statusa (seated / completed / no_show / confirmed). No-show naplaćuje garanciju ako postoji. */
export async function setStatus(db: Db, deps: Deps, r: Restaurant, id: number, status: ReservationStatus) {
  const allowed: ReservationStatus[] = ['confirmed', 'seated', 'completed', 'no_show', 'cancelled'];
  if (!allowed.includes(status)) throw new AppError(400, 'bad_status', 'Nedozvoljen status');
  const res = (await db.query<Reservation>('select * from reservations where id = $1 and restaurant_id = $2', [id, r.id])).rows[0];
  if (!res) throw new AppError(404, 'reservation_not_found', 'Rezervacija nije pronađena');
  let chargeId: string | null = null;
  if (status === 'no_show' && res.status !== 'no_show') {
    await db.query('update guests set no_shows = no_shows + 1 where id = $1', [res.guest_id]);
    if (res.stripe_payment_method_id && r.no_show_fee_cents > 0 && deps.payments) {
      const g = (await db.query('select stripe_customer_id from guests where id = $1', [res.guest_id])).rows[0];
      if (g?.stripe_customer_id) {
        chargeId = await deps.payments.chargeNoShow({
          restaurant: r, paymentMethodId: res.stripe_payment_method_id, customerId: g.stripe_customer_id,
          amountCents: r.no_show_fee_cents * res.party_size, reservationCode: res.code,
        });
      }
    }
  }
  if (status === 'completed' && res.status !== 'completed') {
    await db.query('update guests set visits = visits + 1 where id = $1', [res.guest_id]);
  }
  return (
    await db.query<Reservation>(
      'update reservations set status = $2, no_show_charge_id = coalesce($3, no_show_charge_id), updated_at = now() where id = $1 returning *',
      [id, status, chargeId],
    )
  ).rows[0];
}

export async function listForDay(db: Db, r: Restaurant, date: string) {
  if (!isValidDate(date)) throw new AppError(400, 'bad_date', 'Neispravan datum');
  const { localToUtc } = await import('../time.js');
  const from = localToUtc(date, '00:00', r.timezone);
  const to = new Date(from.getTime() + 30 * 3600_000);
  return (
    await db.query(
      `select res.*, g.name as guest_name, g.phone as guest_phone, g.email as guest_email, g.visits, g.no_shows,
              t.label as table_label, t.zone
         from reservations res join guests g on g.id = res.guest_id left join dining_tables t on t.id = res.table_id
        where res.restaurant_id = $1 and res.start_at >= $2 and res.start_at < $3
        order by res.start_at`,
      [r.id, from, to],
    )
  ).rows;
}

/** Konobar odobrava ili odbija slanje upita za Google recenziju (samo za goste koji su bili). */
export async function decideReview(db: Db, r: Restaurant, id: number, approve: boolean) {
  const res = (await db.query<Reservation>('select * from reservations where id = $1 and restaurant_id = $2', [id, r.id])).rows[0];
  if (!res) throw new AppError(404, 'reservation_not_found', 'Rezervacija nije pronađena');
  if (!['seated', 'completed'].includes(res.status)) throw new AppError(409, 'not_visited', 'Recenzija se traži samo od gostiju koji su bili');
  if (res.review_request_sent_at) throw new AppError(409, 'already_sent', 'Upit za recenziju je već poslan');
  if (approve && !r.google_review_url) throw new AppError(409, 'no_review_url', 'U postavkama nedostaje link za Google recenziju');
  return (
    await db.query<Reservation>(
      `update reservations set review_decision = $2, review_decided_at = now(), updated_at = now() where id = $1 returning *`,
      [id, approve ? 'approved' : 'declined'],
    )
  ).rows[0];
}
