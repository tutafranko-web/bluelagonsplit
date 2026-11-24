import { describe, expect, it } from 'vitest';
import { setup } from './helpers.js';
import { findAvailability } from '../src/services/availability.js';
import {
  cancelReservation, createReservation, modifyReservation, normalizePhone, setStatus, confirmGuarantee, decideReview,
} from '../src/services/reservations.js';
import { tick } from '../src/jobs/scheduler.js';
import { localToUtc, utcToLocal } from '../src/time.js';

describe('vrijeme', () => {
  it('pretvara Zagreb ljeti (UTC+2) i zimi (UTC+1)', () => {
    expect(localToUtc('2026-07-14', '19:30', 'Europe/Zagreb').toISOString()).toBe('2026-07-14T17:30:00.000Z');
    expect(localToUtc('2026-12-14', '19:30', 'Europe/Zagreb').toISOString()).toBe('2026-12-14T18:30:00.000Z');
    expect(utcToLocal(new Date('2026-07-14T17:30:00Z'), 'Europe/Zagreb')).toMatchObject({ date: '2026-07-14', time: '19:30', weekday: 2 });
  });
  it('normalizira hrvatske brojeve', () => {
    expect(normalizePhone('091 234 5678')).toBe('+385912345678');
    expect(normalizePhone('00385 91 234 5678')).toBe('+385912345678');
    expect(normalizePhone('+49 151 1234567')).toBe('+491511234567');
    expect(normalizePhone('abc')).toBeNull();
  });
});

describe('dostupnost', () => {
  it('vraća termine unutar radnog vremena, zadnji sat prije zatvaranja', async () => {
    const { db, r } = await setup();
    const slots = await findAvailability(db, r, { date: '2026-07-11', partySize: 2, now: new Date('2026-07-10T08:00:00Z') });
    expect(slots[0].time).toBe('12:00');
    expect(slots.at(-1)!.time).toBe('22:00');
  });
  it('nema termina na zatvoren dan ni za prevelike grupe', async () => {
    const { db, r } = await setup();
    expect(await findAvailability(db, r, { date: '2026-07-20', partySize: 2 })).toEqual([]);
    expect(await findAvailability(db, r, { date: '2026-07-11', partySize: 20 })).toEqual([]);
  });
  it('preskače termine koji su prošli ili su za manje od 30 min', async () => {
    const { db, r } = await setup();
    const slots = await findAvailability(db, r, { date: '2026-07-10', partySize: 2, now: new Date('2026-07-10T16:10:00Z') }); // 18:10
    expect(slots[0].time).toBe('19:00');
  });
});

describe('rezervacije', () => {
  it('kreira rezervaciju, dodjeljuje najmanji stol i šalje potvrdu', async () => {
    const { db, deps, r } = await setup();
    const { reservation } = await createReservation(db, deps, r, {
      name: 'Ana', phone: '091 111 2222', email: 'ana@test.hr', partySize: 2, date: '2026-07-11', time: '19:00', source: 'web',
    });
    expect(reservation.status).toBe('confirmed');
    expect(reservation.code).toMatch(/^[A-Z2-9]{6}$/);
    const table = (await db.query('select label from dining_tables where id = $1', [reservation.table_id])).rows[0];
    expect(table.label).toBe('1');
    const out = (await db.query('select channel, kind from outbox order by id')).rows;
    expect(out).toEqual([{ channel: 'whatsapp', kind: 'confirmation' }, { channel: 'email', kind: 'confirmation' }]);
  });

  it('ne daje isti stol dvaput i nudi alternative kad je sve puno', async () => {
    const { db, deps, r } = await setup();
    const base = { partySize: 4, date: '2026-07-11', time: '20:00', source: 'web' };
    await createReservation(db, deps, r, { ...base, name: 'A', phone: '0911000001' }); // stol 3
    await createReservation(db, deps, r, { ...base, name: 'B', phone: '0911000002' }); // terasa T1
    const err: any = await createReservation(db, deps, r, { ...base, name: 'C', phone: '0911000003' }).catch((e) => e);
    expect(err.code).toBe('no_table');
    expect(err.alternatives.length).toBeGreaterThan(0);
    expect(err.alternatives.map((a: any) => a.time)).not.toContain('20:00');
    expect(err.alternatives.map((a: any) => a.time)).toContain('22:00');
  });

  it('odbija rezervaciju izvan radnog vremena i bez kontakta', async () => {
    const { db, deps, r } = await setup();
    await expect(createReservation(db, deps, r, { name: 'X', phone: '0911', partySize: 2, date: '2026-07-11', time: '19:00', source: 'web' }))
      .rejects.toMatchObject({ code: 'bad_phone' });
    await expect(createReservation(db, deps, r, { name: 'X', partySize: 2, date: '2026-07-11', time: '19:00', source: 'web' }))
      .rejects.toMatchObject({ code: 'contact_required' });
    await expect(createReservation(db, deps, r, { name: 'X', phone: '0911234567', partySize: 2, date: '2026-07-11', time: '22:30', source: 'web' }))
      .rejects.toMatchObject({ code: 'closed' });
  });

  it('isti gost po broju mobitela se ne duplicira', async () => {
    const { db, deps, r } = await setup();
    await createReservation(db, deps, r, { name: 'Ana', phone: '0911112222', partySize: 2, date: '2026-07-11', time: '13:00', source: 'web' });
    await createReservation(db, deps, r, { name: 'Ana K.', phone: '+385911112222', partySize: 2, date: '2026-07-12', time: '13:00', source: 'voice' });
    expect((await db.query('select count(*)::int as n from guests')).rows[0].n).toBe(1);
  });

  it('otkaz traži kontakt s rezervacije i oslobađa stol', async () => {
    const { db, deps, r } = await setup();
    const { reservation } = await createReservation(db, deps, r, { name: 'Ana', phone: '0911112222', partySize: 6, date: '2026-07-11', time: '20:00', source: 'web' });
    await expect(cancelReservation(db, deps, r, reservation.code, '0999999999')).rejects.toMatchObject({ code: 'contact_mismatch' });
    const c = await cancelReservation(db, deps, r, reservation.code.toLowerCase(), '091 111 2222');
    expect(c.status).toBe('cancelled');
    const slots = await findAvailability(db, r, { date: '2026-07-11', partySize: 6, now: deps.now() });
    expect(slots.map((s) => s.time)).toContain('20:00');
  });

  it('izmjena premješta rezervaciju i zadržava vlastiti stol', async () => {
    const { db, deps, r } = await setup();
    const { reservation } = await createReservation(db, deps, r, { name: 'Ana', phone: '0911112222', partySize: 6, date: '2026-07-11', time: '20:00', source: 'web' });
    const m = await modifyReservation(db, deps, r, reservation.code, '0911112222', { time: '20:30' });
    expect(utcToLocal(new Date(m.start_at), r.timezone).time).toBe('20:30');
    expect(m.table_id).toBe(reservation.table_id);
  });
});

describe('garancija karticom i no-show', () => {
  it('veće grupe dobiju link za karticu, webhook potvrđuje, no-show naplaćuje', async () => {
    const { db, deps, r, payments } = await setup({ guarantee: true });
    const small = await createReservation(db, deps, r, { name: 'Mali', phone: '0911000001', partySize: 2, date: '2026-07-11', time: '19:00', source: 'web' });
    expect(small.guaranteeUrl).toBeNull();
    const big = await createReservation(db, deps, r, { name: 'Veliki', phone: '0911000002', email: 'v@test.hr', partySize: 4, date: '2026-07-11', time: '19:00', source: 'web' });
    expect(big.reservation.status).toBe('pending_guarantee');
    expect(big.guaranteeUrl).toContain('checkout.stripe.test');
    const confirmed = await confirmGuarantee(db, deps, big.reservation.stripe_checkout_session_id!, 'pm_123', 'cus_123');
    expect(confirmed!.status).toBe('confirmed');
    await setStatus(db, deps, r, big.reservation.id, 'no_show');
    expect(payments.charges[0]).toMatchObject({ amountCents: 8000, paymentMethodId: 'pm_123', customerId: 'cus_123' });
  });

  it('nepotvrđena garancija istječe nakon 30 min i oslobađa stol', async () => {
    const { db, deps, r, setNow } = await setup({ guarantee: true });
    const big = await createReservation(db, deps, r, { name: 'V', phone: '0911000002', partySize: 6, date: '2026-07-11', time: '19:00', source: 'web' });
    setNow(new Date('2026-07-10T08:31:00Z'));
    await tick(db, deps);
    const st = (await db.query('select status from reservations where id = $1', [big.reservation.id])).rows[0].status;
    expect(st).toBe('expired');
  });
});

describe('scheduler', () => {
  it('šalje potvrde, podsjetnik dan prije i upit za recenziju nakon posjeta', async () => {
    const { db, deps, r, transport, setNow } = await setup();
    const { reservation } = await createReservation(db, deps, r, {
      name: 'Ana', phone: '0911112222', email: 'ana@test.hr', partySize: 2, date: '2026-07-12', time: '19:00', source: 'web',
    });
    await tick(db, deps);
    expect(transport.sent.map((s) => s.channel)).toEqual(['whatsapp', 'email']);
    expect(transport.sent[0].body).toMatchObject({ type: 'template', name: 'opsis_potvrda' });

    setNow(new Date('2026-07-11T18:00:00Z')); // dan prije
    let res = await tick(db, deps);
    expect(res.reminders).toBe(1);
    res = await tick(db, deps);
    expect(res.reminders).toBe(0); // ne šalje dvaput

    await setStatus(db, deps, r, reservation.id, 'seated');
    setNow(new Date('2026-07-12T21:30:00Z')); // 2,5 h nakon kraja
    res = await tick(db, deps);
    expect(res.reviews).toBe(0); // zadano: čeka odobrenje konobara

    await decideReview(db, r, reservation.id, true);
    res = await tick(db, deps);
    expect(res.reviews).toBe(1);
    const last = transport.sent.at(-1)!;
    expect(last.body.text).toContain('https://g.page/r/test/review');
    expect((await tick(db, deps)).reviews).toBe(0); // ne šalje dvaput
    await expect(decideReview(db, r, reservation.id, true)).rejects.toMatchObject({ code: 'already_sent' });
  });
});

describe('upit za recenziju', () => {
  async function visited(mode: string) {
    const ctx = await setup();
    await ctx.db.query('update restaurants set review_mode = $2 where id = $1', [ctx.r.id, mode]);
    ctx.r.review_mode = mode as any;
    const { reservation } = await createReservation(ctx.db, ctx.deps, ctx.r, { name: 'Ana', email: 'ana@test.hr', partySize: 2, date: '2026-07-10', time: '13:00', source: 'web' });
    await setStatus(ctx.db, ctx.deps, ctx.r, reservation.id, 'seated');
    return { ...ctx, reservation };
  }

  it('odobreno prije kraja posjeta šalje se tek 2 h nakon kraja', async () => {
    const { db, deps, r, reservation, setNow } = await visited('approval');
    await decideReview(db, r, reservation.id, true);
    setNow(new Date('2026-07-10T13:30:00Z')); // 30 min nakon kraja
    expect((await tick(db, deps)).reviews).toBe(0);
    setNow(new Date('2026-07-10T15:10:00Z'));
    expect((await tick(db, deps)).reviews).toBe(1);
  });

  it('odbijeno se ne šalje, ni u automatskom načinu', async () => {
    const { db, deps, r, reservation, setNow } = await visited('auto');
    await decideReview(db, r, reservation.id, false);
    setNow(new Date('2026-07-10T16:00:00Z'));
    expect((await tick(db, deps)).reviews).toBe(0);
  });

  it('automatski način šalje bez odobrenja, isključen ne šalje nikad', async () => {
    const a = await visited('auto');
    a.setNow(new Date('2026-07-10T16:00:00Z'));
    expect((await tick(a.db, a.deps)).reviews).toBe(1);
    const off = await visited('off');
    await off.db.query(`update reservations set review_decision = 'approved' where id = $1`, [off.reservation.id]);
    off.setNow(new Date('2026-07-10T16:00:00Z'));
    expect((await tick(off.db, off.deps)).reviews).toBe(0);
  });

  it('ne traži recenziju od gosta koji nije došao', async () => {
    const { db, deps, r } = await setup();
    const { reservation } = await createReservation(db, deps, r, { name: 'B', email: 'b@test.hr', partySize: 2, date: '2026-07-11', time: '13:00', source: 'web' });
    await expect(decideReview(db, r, reservation.id, true)).rejects.toMatchObject({ code: 'not_visited' });
    await setStatus(db, deps, r, reservation.id, 'no_show');
    await expect(decideReview(db, r, reservation.id, true)).rejects.toMatchObject({ code: 'not_visited' });
  });
});
