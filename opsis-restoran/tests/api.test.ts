import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { setup } from './helpers.js';
import { buildApp } from '../src/server.js';
import type { LLM } from '../src/deps.js';

/** LLM koji vraća unaprijed zadane odgovore i bilježi što je dobio. */
function scriptedLLM(steps: any[]): LLM & { calls: any[] } {
  const calls: any[] = [];
  return {
    calls,
    async create(params) {
      calls.push(JSON.parse(JSON.stringify(params)));
      const s = steps.shift();
      if (!s) return { content: [{ type: 'text', text: 'kraj' }], stop_reason: 'end_turn' };
      return s;
    },
  };
}
const toolUse = (id: string, name: string, input: any) => ({ content: [{ type: 'tool_use', id, name, input }], stop_reason: 'tool_use' });
const text = (t: string) => ({ content: [{ type: 'text', text: t }], stop_reason: 'end_turn' });

describe('javni API', () => {
  it('dostupnost → rezervacija → pregled → otkaz', async () => {
    const { db, deps } = await setup();
    const app = await buildApp(db, deps);
    const info = await app.inject({ url: '/api/r/konoba-test' });
    expect(info.json().zones.sort()).toEqual(['terasa', 'unutra']);

    const av = await app.inject({ url: '/api/r/konoba-test/availability?date=2026-07-11&party=2' });
    expect(av.json().slots.length).toBeGreaterThan(10);

    const created = await app.inject({
      method: 'POST', url: '/api/r/konoba-test/reservations',
      payload: { name: 'Marko', phone: '0981234567', partySize: 2, date: '2026-07-11', time: '20:00', language: 'en' },
    });
    expect(created.statusCode).toBe(201);
    const code = created.json().code;

    const bad = await app.inject({ url: `/api/r/konoba-test/reservations/${code}?contact=0990000000` });
    expect(bad.statusCode).toBe(403);
    const view = await app.inject({ url: `/api/r/konoba-test/reservations/${code}?contact=0981234567` });
    expect(view.json()).toMatchObject({ time: '20:00', party_size: 2, status: 'confirmed' });

    const c = await app.inject({ method: 'POST', url: `/api/r/konoba-test/reservations/${code}/cancel`, payload: { contact: '+385981234567' } });
    expect(c.json().status).toBe('cancelled');
  });

  it('vraća alternative kad nema stola i 404 za nepoznat restoran', async () => {
    const { db, deps } = await setup();
    const app = await buildApp(db, deps);
    for (const p of ['0911000001', '0911000002']) {
      await app.inject({ method: 'POST', url: '/api/r/konoba-test/reservations', payload: { name: 'X', phone: p, partySize: 5, date: '2026-07-11', time: '20:00' } });
    }
    const full = await app.inject({ method: 'POST', url: '/api/r/konoba-test/reservations', payload: { name: 'Y', phone: '0911000003', partySize: 5, date: '2026-07-11', time: '20:00' } });
    expect(full.statusCode).toBe(409);
    expect(full.json().error).toBe('no_table');
    expect((await app.inject({ url: '/api/r/nema/availability?date=2026-07-11&party=2' })).statusCode).toBe(404);
  });
});

describe('admin API', () => {
  it('traži ključ, lista dan, mijenja status i postavke', async () => {
    const { db, deps } = await setup();
    const app = await buildApp(db, deps);
    expect((await app.inject({ url: '/api/admin/konoba-test/reservations' })).statusCode).toBe(401);
    const h = { authorization: 'Bearer admin-key' };
    const res = await app.inject({ method: 'POST', url: '/api/admin/konoba-test/reservations', headers: h,
      payload: { name: 'Telefonski gost', phone: '0915555555', partySize: 3, date: '2026-07-11', time: '13:00' } });
    expect(res.statusCode).toBe(201);
    const list = await app.inject({ url: '/api/admin/konoba-test/reservations?date=2026-07-11', headers: h });
    expect(list.json().reservations).toHaveLength(1);
    expect(list.json().reservations[0]).toMatchObject({ guest_name: 'Telefonski gost', table_label: '3', source: 'admin' });
    const st = await app.inject({ method: 'POST', url: `/api/admin/konoba-test/reservations/${res.json().id}/status`, headers: h, payload: { status: 'seated' } });
    expect(st.json().status).toBe('seated');
    const rv = await app.inject({ method: 'POST', url: `/api/admin/konoba-test/reservations/${res.json().id}/review`, headers: h, payload: { approve: true } });
    expect(rv.json().review_decision).toBe('approved');
    const badMode = await app.inject({ method: 'PUT', url: '/api/admin/konoba-test/settings', headers: h, payload: { review_mode: 'uvijek' } });
    expect(badMode.statusCode).toBe(400);
    const put = await app.inject({ method: 'PUT', url: '/api/admin/konoba-test/settings', headers: h, payload: { max_party_size: 8, slug: 'hack' } });
    expect(put.json().updated).toBe(1);
    const s = await app.inject({ url: '/api/admin/konoba-test/settings', headers: h });
    expect(s.json()).toMatchObject({ max_party_size: 8, slug: 'konoba-test', review_mode: 'approval' });
  });

  it('super admin kreira novi restoran s vlastitim ključem', async () => {
    const { db, deps } = await setup();
    const app = await buildApp(db, deps);
    const bad = await app.inject({ method: 'POST', url: '/api/super/restaurants', headers: { 'x-super-key': 'krivo' }, payload: { slug: 'novi' } });
    expect(bad.statusCode).toBe(401);
    const ok = await app.inject({ method: 'POST', url: '/api/super/restaurants', headers: { 'x-super-key': 'super' }, payload: { slug: 'bistro-x', name: 'Bistro X' } });
    expect(ok.statusCode).toBe(201);
    expect(ok.json().admin_api_key.length).toBeGreaterThan(20);
  });
});

describe('chatbot', () => {
  it('provjeri termin, kreira rezervaciju preko alata i vrati odgovor', async () => {
    const llm = scriptedLLM([
      toolUse('t1', 'check_availability', { date: '2026-07-11', party_size: 2, preferred_time: '20:00' }),
      text('U subotu u 20:00 imamo slobodan stol. Na koje ime i broj mobitela?'),
      toolUse('t2', 'create_reservation', { name: 'Ivana', phone: '0951112233', party_size: 2, date: '2026-07-11', time: '20:00', language: 'hr' }),
      text('Rezervirano! Šifra je XXXXXX.'),
    ]);
    const { db, deps } = await setup({ llm });
    const app = await buildApp(db, deps);
    const r1 = await app.inject({ method: 'POST', url: '/api/r/konoba-test/chat', payload: { sessionId: 'sess-12345678', message: 'Stol za 2 u subotu u 8 navečer?' } });
    expect(r1.json().reply).toContain('20:00');
    // rezultat alata je vratio da je 20:00 slobodno
    const toolResult = JSON.parse(llm.calls[1].messages.at(-1).content[0].content);
    expect(toolResult.preferred_time_available).toBe(true);
    // sistemski prompt sadrži današnji datum
    expect(llm.calls[0].system).toContain('2026-07-10');

    const r2 = await app.inject({ method: 'POST', url: '/api/r/konoba-test/chat', payload: { sessionId: 'sess-12345678', message: 'Ivana, 095 111 2233. Potvrđujem.' } });
    expect(r2.statusCode).toBe(200);
    // povijest razgovora je sačuvana između poruka
    expect(llm.calls[2].messages.length).toBeGreaterThan(3);
    const res = (await db.query(`select source, status from reservations`)).rows;
    expect(res).toEqual([{ source: 'chat', status: 'confirmed' }]);
  });

  it('greška alata (zatvoreno) ide natrag modelu, ne ruši razgovor', async () => {
    const llm = scriptedLLM([
      toolUse('t1', 'create_reservation', { name: 'A', phone: '0951112233', party_size: 2, date: '2026-07-20', time: '20:00' }),
      text('Nažalost taj dan ne radimo.'),
    ]);
    const { db, deps } = await setup({ llm });
    const app = await buildApp(db, deps);
    const r = await app.inject({ method: 'POST', url: '/api/r/konoba-test/chat', payload: { sessionId: 'sess-abcdefgh', message: 'Stol 20.7.' } });
    expect(r.statusCode).toBe(200);
    const tr = JSON.parse(llm.calls[1].messages.at(-1).content[0].content);
    expect(tr.error).toBe('closed');
  });

  it('bez API ključa chat vraća 503', async () => {
    const { db, deps } = await setup();
    const app = await buildApp(db, deps);
    const r = await app.inject({ method: 'POST', url: '/api/r/konoba-test/chat', payload: { sessionId: 'sess-12345678', message: 'bok' } });
    expect(r.statusCode).toBe(503);
  });
});

describe('WhatsApp i Instagram webhook', () => {
  it('verifikacija i odgovor na WhatsApp poruku (s provjerom potpisa)', async () => {
    const llm = scriptedLLM([text('Radimo svaki dan od 12 do 23.')]);
    const { db, deps, transport } = await setup({ llm });
    deps.config.metaAppSecret = 'app-secret';
    const app = await buildApp(db, deps);
    const v = await app.inject({ url: '/webhooks/meta?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=42' });
    expect(v.body).toBe('42');

    const payload = JSON.stringify({
      object: 'whatsapp_business_account',
      entry: [{ changes: [{ value: { metadata: { phone_number_id: 'wa-phone-1' }, messages: [{ from: '385911234567', type: 'text', text: { body: 'Kad radite?' } }] } }] }],
    });
    const badSig = await app.inject({ method: 'POST', url: '/webhooks/meta', headers: { 'content-type': 'application/json', 'x-hub-signature-256': 'sha256=00' }, payload });
    expect(badSig.statusCode).toBe(401);
    const sig = 'sha256=' + createHmac('sha256', 'app-secret').update(payload).digest('hex');
    const ok = await app.inject({ method: 'POST', url: '/webhooks/meta', headers: { 'content-type': 'application/json', 'x-hub-signature-256': sig }, payload });
    expect(ok.statusCode).toBe(200);
    await Promise.all([...app.pending]);
    expect(transport.sent.at(-1)).toMatchObject({ channel: 'whatsapp', to: '+385911234567', body: { type: 'text', text: 'Radimo svaki dan od 12 do 23.' } });
  });

  it('Instagram DM dobiva odgovor, echo poruke se ignoriraju', async () => {
    const llm = scriptedLLM([text('Bok! Kako mogu pomoći?')]);
    const { db, deps, r, transport } = await setup({ llm });
    await db.query(`update restaurants set instagram_account_id = 'ig-1' where id = $1`, [r.id]);
    const app = await buildApp(db, deps);
    await app.inject({ method: 'POST', url: '/webhooks/meta', payload: {
      object: 'instagram', entry: [{ id: 'ig-1', messaging: [{ sender: { id: 'u1' }, message: { text: 'bok', is_echo: true } }, { sender: { id: 'u2' }, message: { text: 'bok' } }] }],
    } });
    await Promise.all([...app.pending]);
    expect(transport.sent).toEqual([{ channel: 'instagram', to: 'u2', body: 'Bok! Kako mogu pomoći?' }]);
  });
});

describe('voice agent (Retell funkcije)', () => {
  it('traži tajni ključ i koristi broj pozivatelja kao kontakt', async () => {
    const { db, deps } = await setup();
    const app = await buildApp(db, deps);
    const no = await app.inject({ method: 'POST', url: '/voice/retell/konoba-test', payload: { name: 'check_availability', args: {} } });
    expect(no.statusCode).toBe(401);
    const h = { 'x-opsis-secret': 'voice-secret' };
    const av = await app.inject({ method: 'POST', url: '/voice/retell/konoba-test', headers: h,
      payload: { name: 'check_availability', args: { date: '2026-07-11', party_size: 4, preferred_time: '19:30' }, call: { from_number: '+385917776655' } } });
    expect(av.json().available_times.length).toBeGreaterThan(0);
    const cr = await app.inject({ method: 'POST', url: '/voice/retell/konoba-test', headers: h,
      payload: { name: 'create_reservation', args: { name: 'Petar', party_size: 4, date: '2026-07-11', time: '19:30' }, call: { from_number: '+385917776655' } } });
    expect(cr.json()).toMatchObject({ ok: true, status: 'confirmed', time: '19:30' });
    const find = await app.inject({ method: 'POST', url: '/voice/retell/konoba-test', headers: h,
      payload: { name: 'find_reservations', args: {}, call: { from_number: '+385917776655' } } });
    expect(find.json().reservations).toHaveLength(1);
    const cancel = await app.inject({ method: 'POST', url: '/voice/retell/konoba-test', headers: h,
      payload: { name: 'cancel_reservation', args: { code: cr.json().code }, call: { from_number: '+385917776655' } } });
    expect(cancel.json()).toMatchObject({ ok: true, status: 'cancelled' });
    const inbound = await app.inject({ method: 'POST', url: '/voice/retell/konoba-test/inbound', headers: h, payload: {} });
    expect(inbound.json().call_inbound.dynamic_variables.today).toBe('petak, 2026-07-10');
  });
});
