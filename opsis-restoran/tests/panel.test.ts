import { describe, expect, it } from 'vitest';
import { setup } from './helpers.js';
import { buildApp } from '../src/server.js';
import type { StripeEvent } from '../src/deps.js';

const owner = { authorization: 'Bearer admin-key' };
const book = (partySize: number, phone: string, extra: any = {}) => ({
  method: 'POST' as const, url: '/api/r/konoba-test/reservations',
  payload: { name: 'Gost', phone, partySize, date: '2026-07-11', time: '20:00', ...extra },
});

async function tableIds(app: any) {
  const list = (await app.inject({ url: '/api/admin/konoba-test/tables', headers: owner })).json();
  return Object.fromEntries(list.map((t: any) => [t.label, t.id])) as Record<string, number>;
}

describe('spajanje stolova', () => {
  it('kad nema slobodnog stola, grupa dobiva spojene stolove; spojeni stolovi su zauzeti', async () => {
    const { db, deps } = await setup();
    const app = await buildApp(db, deps);
    const t = await tableIds(app);

    // stolovi iz različitih zona se ne spajaju
    const bad = await app.inject({ method: 'POST', url: '/api/admin/konoba-test/table-combos', headers: owner, payload: { table_ids: [t['3'], t['T1']] } });
    expect(bad.statusCode).toBe(400);

    const combo = await app.inject({ method: 'POST', url: '/api/admin/konoba-test/table-combos', headers: owner, payload: { table_ids: [t['1'], t['2']] } });
    expect(combo.statusCode).toBe(201);
    expect(combo.json()).toMatchObject({ min_capacity: 3, max_capacity: 4 }); // zadano: veće od najvećeg stola, do zbroja
    const dup = await app.inject({ method: 'POST', url: '/api/admin/konoba-test/table-combos', headers: owner, payload: { table_ids: [t['2'], t['1']] } });
    expect(dup.statusCode).toBe(409);

    expect((await app.inject(book(4, '0911000001', { zone: 'unutra' }))).statusCode).toBe(201); // stol 3
    expect((await app.inject(book(4, '0911000002', { zone: 'unutra' }))).statusCode).toBe(201); // 1+2
    const full = await app.inject(book(4, '0911000003', { zone: 'unutra' }));
    expect(full.json().error).toBe('no_table');
    // stolovi 1 i 2 su zauzeti spojem → ni par ne može unutra
    expect((await app.inject(book(2, '0911000004', { zone: 'unutra' }))).json().error).toBe('no_table');

    const list = (await app.inject({ url: '/api/admin/konoba-test/reservations?date=2026-07-11', headers: owner })).json().reservations;
    expect(list.map((r: any) => r.table_label).sort()).toEqual(['1+2', '3']);

    // spoj se može isključiti
    const id = combo.json().id;
    await app.inject({ method: 'PUT', url: `/api/admin/konoba-test/table-combos/${id}`, headers: owner, payload: { active: false } });
    const combos = (await app.inject({ url: '/api/admin/konoba-test/table-combos', headers: owner })).json();
    expect(combos[0]).toMatchObject({ label: '1+2', zone: 'unutra', active: false });
    expect((await app.inject({ method: 'DELETE', url: `/api/admin/konoba-test/table-combos/${id}`, headers: owner })).json()).toEqual({ deleted: true });
  });

  it('grupa veća od najvećeg stola: termini se pojave tek kad postoji spoj', async () => {
    const { db, deps } = await setup();
    const app = await buildApp(db, deps);
    const t = await tableIds(app);
    const before = await app.inject({ url: '/api/r/konoba-test/availability?date=2026-07-11&party=8' });
    expect(before.json().slots).toEqual([]);

    await app.inject({ method: 'POST', url: '/api/admin/konoba-test/table-combos', headers: owner, payload: { table_ids: [t['1'], t['2'], t['3']] } });
    const after = await app.inject({ url: '/api/r/konoba-test/availability?date=2026-07-11&party=8' });
    expect(after.json().slots.length).toBeGreaterThan(5);
    expect(after.json().slots[0].zones).toEqual(['unutra']);

    const res = await app.inject(book(8, '0911000005'));
    expect(res.statusCode).toBe(201);
    // izmjena na manji broj osoba prebacuje na jedan stol i oslobađa ostale
    const mod = await app.inject({ method: 'POST', url: `/api/admin/konoba-test/reservations/${res.json().code}/modify`, headers: owner, payload: { partySize: 2 } });
    expect(mod.json().extra_table_ids).toEqual([]);
    expect((await app.inject(book(2, '0911000006', { zone: 'unutra' }))).statusCode).toBe(201);
  });
});

describe('korisnici panela', () => {
  it('vlasnik dodaje konobara; konobar vidi rezervacije, ali ne postavke', async () => {
    const { db, deps } = await setup();
    const app = await buildApp(db, deps);

    const weak = await app.inject({ method: 'POST', url: '/api/admin/konoba-test/users', headers: owner, payload: { username: 'ana', password: '123' } });
    expect(weak.statusCode).toBe(400);
    const u = await app.inject({ method: 'POST', url: '/api/admin/konoba-test/users', headers: owner, payload: { username: 'Ana', name: 'Ana K.', role: 'waiter', password: 'konobar123' } });
    expect(u.statusCode).toBe(201);
    expect(u.json()).toMatchObject({ username: 'ana', role: 'waiter', active: true });
    expect(u.json().password_hash).toBeUndefined();

    const wrong = await app.inject({ method: 'POST', url: '/api/admin/konoba-test/login', payload: { username: 'ana', password: 'krivo-krivo' } });
    expect(wrong.statusCode).toBe(401);
    const nobody = await app.inject({ method: 'POST', url: '/api/admin/konoba-test/login', payload: { username: 'nema', password: 'krivo-krivo' } });
    expect(nobody.statusCode).toBe(401);

    const li = await app.inject({ method: 'POST', url: '/api/admin/konoba-test/login', payload: { username: 'ana', password: 'konobar123' } });
    expect(li.statusCode).toBe(200);
    const w = { authorization: `Bearer ${li.json().token}` };
    expect((await app.inject({ url: '/api/admin/konoba-test/me', headers: w })).json()).toMatchObject({ role: 'waiter', name: 'Ana K.' });
    expect((await app.inject({ url: '/api/admin/konoba-test/reservations?date=2026-07-11', headers: w })).statusCode).toBe(200);
    expect((await app.inject({ url: '/api/admin/konoba-test/orders', headers: w })).statusCode).toBe(200);
    expect((await app.inject({ url: '/api/admin/konoba-test/settings', headers: w })).statusCode).toBe(200);
    expect((await app.inject({ method: 'PUT', url: '/api/admin/konoba-test/settings', headers: w, payload: { name: 'Hak' } })).statusCode).toBe(403);
    expect((await app.inject({ url: '/api/admin/konoba-test/stats', headers: w })).statusCode).toBe(403);
    expect((await app.inject({ url: '/api/admin/konoba-test/users', headers: w })).statusCode).toBe(403);
    expect((await app.inject({ method: 'POST', url: '/api/admin/konoba-test/menu', headers: w, payload: {} })).statusCode).toBe(403);

    // konobar smije označiti jelo nedostupnim
    const item = (await app.inject({ method: 'POST', url: '/api/admin/konoba-test/menu', headers: owner, payload: { category: 'Glavna', name: { hr: 'Riba' }, price_cents: 2000 } })).json();
    const av = await app.inject({ method: 'POST', url: `/api/admin/konoba-test/menu/${item.id}/available`, headers: w, payload: { available: false } });
    expect(av.json()).toMatchObject({ available: false, price_cents: 2000 });

    // token jednog restorana ne vrijedi u drugom
    await app.inject({ method: 'POST', url: '/api/super/restaurants', headers: { 'x-super-key': 'super' }, payload: { slug: 'drugi-restoran' } });
    expect((await app.inject({ url: '/api/admin/drugi-restoran/reservations', headers: w })).statusCode).toBe(401);

    // deaktivacija odjavljuje odmah
    await app.inject({ method: 'PUT', url: `/api/admin/konoba-test/users/${u.json().id}`, headers: owner, payload: { active: false } });
    expect((await app.inject({ url: '/api/admin/konoba-test/reservations', headers: w })).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/api/admin/konoba-test/login', payload: { username: 'ana', password: 'konobar123' } })).statusCode).toBe(401);
  });

  it('novi restoran s vlasnikovim računom; odjava poništava token; prijava istječe', async () => {
    const { db, deps, setNow } = await setup();
    const app = await buildApp(db, deps);
    const c = await app.inject({
      method: 'POST', url: '/api/super/restaurants', headers: { 'x-super-key': 'super' },
      payload: { slug: 'konoba-nova', name: 'Konoba Nova', owner: { username: 'franko', password: 'vlasnik123', name: 'Franko' } },
    });
    expect(c.json().owner).toMatchObject({ username: 'franko', role: 'owner' });
    const li = (await app.inject({ method: 'POST', url: '/api/admin/konoba-nova/login', payload: { username: 'franko', password: 'vlasnik123' } })).json();
    const h = { authorization: `Bearer ${li.token}` };
    expect((await app.inject({ method: 'PUT', url: '/api/admin/konoba-nova/settings', headers: h, payload: { phone: '+38521111111' } })).json()).toEqual({ updated: 1 });

    await app.inject({ method: 'POST', url: '/api/admin/konoba-nova/logout', headers: h });
    expect((await app.inject({ url: '/api/admin/konoba-nova/me', headers: h })).statusCode).toBe(401);

    const li2 = (await app.inject({ method: 'POST', url: '/api/admin/konoba-nova/login', payload: { username: 'franko', password: 'vlasnik123' } })).json();
    setNow(new Date(deps.now().getTime() + 31 * 86400_000));
    expect((await app.inject({ url: '/api/admin/konoba-nova/me', headers: { authorization: `Bearer ${li2.token}` } })).statusCode).toBe(401);
  });
});

describe('kanali i Stripe Connect iz panela', () => {
  it('WhatsApp i Instagram ID se upisuju u postavkama i ne smiju se ponavljati', async () => {
    const { db, deps } = await setup();
    const app = await buildApp(db, deps);
    const bad = await app.inject({ method: 'PUT', url: '/api/admin/konoba-test/settings', headers: owner, payload: { whatsapp_phone_number_id: 'abc' } });
    expect(bad.statusCode).toBe(400);
    const ok = await app.inject({ method: 'PUT', url: '/api/admin/konoba-test/settings', headers: owner, payload: { whatsapp_phone_number_id: ' 106540352242922 ', instagram_account_id: '17841400000000000' } });
    expect(ok.statusCode).toBe(200);
    const s = (await app.inject({ url: '/api/admin/konoba-test/settings', headers: owner })).json();
    expect(s).toMatchObject({ whatsapp_phone_number_id: '106540352242922', instagram_account_id: '17841400000000000', whatsapp_connected: true, instagram_connected: true });

    const other = (await app.inject({ method: 'POST', url: '/api/super/restaurants', headers: { 'x-super-key': 'super' }, payload: { slug: 'drugi-restoran' } })).json();
    const dup = await app.inject({
      method: 'PUT', url: '/api/admin/drugi-restoran/settings', headers: { authorization: `Bearer ${other.admin_api_key}` }, payload: { whatsapp_phone_number_id: '106540352242922' },
    });
    expect(dup.statusCode).toBe(409);

    // prazno polje = odspoji
    await app.inject({ method: 'PUT', url: '/api/admin/konoba-test/settings', headers: owner, payload: { instagram_account_id: '' } });
    expect((await app.inject({ url: '/api/admin/konoba-test/settings', headers: owner })).json().instagram_connected).toBe(false);
  });

  it('Stripe onboarding: garancija se traži tek kad Stripe potvrdi račun', async () => {
    let nextEvent: StripeEvent | null = null;
    const { db, deps, payments } = await setup();
    const app = await buildApp(db, deps, { stripeWebhook: async () => nextEvent });
    await app.inject({ method: 'PUT', url: '/api/admin/konoba-test/settings', headers: owner, payload: { guarantee_mode: 'card', guarantee_min_party: 1, no_show_fee_cents: 1500 } });

    const on = await app.inject({ method: 'POST', url: '/api/admin/konoba-test/stripe/onboarding', headers: owner });
    expect(on.json()).toMatchObject({ status: 'pending' });
    expect(on.json().url).toContain('https://connect.stripe.test/acct_new_1');
    // drugi klik ne radi novi račun
    await app.inject({ method: 'POST', url: '/api/admin/konoba-test/stripe/onboarding', headers: owner });
    expect(payments.accounts).toHaveLength(1);

    // račun još nije spreman → rezervacija bez kartice
    expect((await app.inject(book(2, '0911000010'))).json()).toMatchObject({ status: 'confirmed', guaranteeUrl: null });

    nextEvent = { type: 'account_updated', accountId: 'acct_new_1', chargesEnabled: true };
    await app.inject({ method: 'POST', url: '/webhooks/stripe', payload: {} });
    expect((await app.inject({ url: '/api/admin/konoba-test/settings', headers: owner })).json()).toMatchObject({ stripe_status: 'ready', stripe_connected: true });
    const g = (await app.inject(book(2, '0911000011'))).json();
    expect(g.status).toBe('pending_guarantee');
    expect(g.guaranteeUrl).toContain('checkout.stripe.test');

    // povratak s onboardinga: panel pita Stripe za stanje
    payments.accounts[0].chargesEnabled = false;
    expect((await app.inject({ method: 'POST', url: '/api/admin/konoba-test/stripe/refresh', headers: owner })).json()).toEqual({ status: 'pending' });
  });
});
