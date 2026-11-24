import type { Db } from '../db.js';
import type { Deps } from '../deps.js';
import { renderMessage, WHATSAPP_TEMPLATES, type MessageData, type MessageKind } from './messages.js';
import type { Restaurant } from './types.js';

export interface GuestContact { name: string; phone: string | null; email: string | null; language: string }

/** Upisuje poruke u outbox (šalju se iz schedulera). Kanal: WhatsApp ako ga restoran ima i gost ima mobitel, plus email ako ga gost ima. */
export async function enqueueGuestMessage(
  db: Db, r: Restaurant,
  opts: { reservationId: number | null; guest: GuestContact; kind: MessageKind; data: MessageData; sendAfter?: Date },
): Promise<number> {
  const { guest, kind, data } = opts;
  const sendAfter = opts.sendAfter ?? new Date(0);
  let n = 0;
  const msg = renderMessage(kind, guest.language, data);
  if (guest.phone && r.whatsapp_phone_number_id) {
    const url = data.guaranteeUrl ?? data.reviewUrl ?? data.manageUrl ?? '';
    await db.query(
      `insert into outbox (restaurant_id, reservation_id, channel, recipient, kind, payload, send_after)
       values ($1,$2,'whatsapp',$3,$4,$5,$6)`,
      [r.id, opts.reservationId, guest.phone, kind, JSON.stringify({
        template: WHATSAPP_TEMPLATES[kind],
        language: guest.language,
        params: [data.guestName, data.restaurantName, data.date, data.time, String(data.partySize), data.code, url],
        fallbackText: msg.text,
      }), sendAfter],
    );
    n++;
  }
  if (guest.email) {
    await db.query(
      `insert into outbox (restaurant_id, reservation_id, channel, recipient, kind, payload, send_after)
       values ($1,$2,'email',$3,$4,$5,$6)`,
      [r.id, opts.reservationId, guest.email, kind, JSON.stringify(msg), sendAfter],
    );
    n++;
  }
  return n;
}

/** Šalje dospjele poruke. Vraća broj poslanih. */
export async function processOutbox(db: Db, deps: Deps, limit = 50): Promise<number> {
  const now = deps.now();
  const { rows } = await db.query<any>(
    `select o.*, r.whatsapp_phone_number_id, r.instagram_account_id, r.email as restaurant_email
       from outbox o join restaurants r on r.id = o.restaurant_id
      where o.sent_at is null and o.send_after <= $1 and o.attempts < 5
      order by o.id limit $2`,
    [now, limit],
  );
  let sent = 0;
  for (const m of rows) {
    try {
      const p = m.payload;
      if (m.channel === 'email') {
        await deps.transport.sendEmail({ to: m.recipient, subject: p.subject, text: p.text, replyTo: m.restaurant_email });
      } else if (m.channel === 'whatsapp') {
        await deps.transport.sendWhatsApp({
          phoneNumberId: m.whatsapp_phone_number_id,
          to: m.recipient,
          body: p.template
            ? { type: 'template', name: p.template, language: p.language, params: p.params }
            : { type: 'text', text: p.text },
        });
      } else if (m.channel === 'instagram') {
        await deps.transport.sendInstagram({ igAccountId: m.instagram_account_id, recipientId: m.recipient, text: p.text });
      }
      await db.query('update outbox set sent_at = $2, attempts = attempts + 1 where id = $1', [m.id, now]);
      sent++;
    } catch (e: any) {
      await db.query('update outbox set attempts = attempts + 1, last_error = $2 where id = $1', [m.id, String(e?.message ?? e)]);
    }
  }
  return sent;
}
