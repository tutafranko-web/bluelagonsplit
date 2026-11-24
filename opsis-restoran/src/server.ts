import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import fastifyStatic from '@fastify/static';
import type { Db } from './db.js';
import type { Deps, StripeEvent } from './deps.js';
import { findAvailability, getRestaurantBySlug } from './services/availability.js';
import {
  cancelReservation, createReservation, getByCode, listForDay, modifyReservation, setStatus, verifyGuest, confirmGuarantee, decideReview,
} from './services/reservations.js';
import { AppError, type Restaurant } from './services/types.js';
import { utcToLocal } from './time.js';
import { runChat } from './ai/chatbot.js';
import { executeTool } from './ai/tools.js';
import { openOrders, placeOrder, publicMenu, setMenuItemAvailable, setOrderStatus, tableByQr, upsertMenuItem } from './services/orders.js';
import { authenticate, createUser, listUsers, login, logout, requireRole, updateUser, type StaffIdentity } from './services/staff.js';
import { getSettings, refreshStripeStatus, startStripeOnboarding, stripeAccountUpdated, updateSettings } from './services/settings.js';
import { createCombination, deleteCombination, listCombinations, updateCombination } from './services/tables.js';
import { issueInvoice } from './fiscal/invoices.js';
import type { CisSender } from './fiscal/cis.js';

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

declare module 'fastify' {
  interface FastifyRequest { rawBody?: string }
}

export interface AppOptions {
  /** Stripe: provjera potpisa i čitanje setup sessiona (null = webhook isključen). */
  stripeWebhook?: ((rawBody: string, signature: string) => Promise<StripeEvent | null>) | null;
  cisSender?: CisSender | null;
  logger?: boolean;
}

/** Jednostavno ograničenje zahtjeva po IP-u. */
function rateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, { n: number; reset: number }>();
  return (key: string) => {
    const now = Date.now();
    const h = hits.get(key);
    if (!h || h.reset < now) {
      hits.set(key, { n: 1, reset: now + windowMs });
      if (hits.size > 10_000) hits.clear();
      return;
    }
    if (++h.n > limit) throw new AppError(429, 'rate_limited', 'Previše zahtjeva, pokušajte malo kasnije');
  };
}

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a), bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export async function buildApp(db: Db, deps: Deps, opts: AppOptions = {}): Promise<FastifyInstance & { pending: Set<Promise<unknown>> }> {
  const app = Fastify({ logger: opts.logger ?? false, bodyLimit: 256 * 1024, trustProxy: true }) as any;
  app.pending = new Set<Promise<unknown>>();
  const track = (p: Promise<unknown>) => {
    app.pending.add(p);
    p.catch((e) => app.log.error(e)).finally(() => app.pending.delete(p));
  };

  app.addContentTypeParser('application/json', { parseAs: 'string' }, (req: FastifyRequest, body: string, done: any) => {
    req.rawBody = body;
    try {
      done(null, body ? JSON.parse(body) : {});
    } catch {
      done(new AppError(400, 'bad_json', 'Neispravan JSON'), undefined);
    }
  });

  app.setErrorHandler((err: any, _req: FastifyRequest, reply: FastifyReply) => {
    if (err instanceof AppError) {
      return reply.status(err.status).send({ error: err.code, message: err.message, ...(err as any).alternatives ? { alternatives: (err as any).alternatives } : {} });
    }
    if (err.validation) return reply.status(400).send({ error: 'validation', message: err.message });
    app.log.error(err);
    return reply.status(500).send({ error: 'internal', message: 'Greška na serveru' });
  });

  await app.register(fastifyStatic, { root: PUBLIC_DIR, prefix: '/static/' });

  const chatLimit = rateLimiter(20, 60_000);
  const bookLimit = rateLimiter(10, 60_000);
  const orderLimit = rateLimiter(20, 60_000);
  const loginLimit = rateLimiter(10, 60_000);

  // ---------- stranice ----------
  app.get('/health', async () => ({ ok: true }));
  app.get('/b/:slug', (_req: any, reply: any) => reply.sendFile('book.html'));
  app.get('/m/:token', (_req: any, reply: any) => reply.sendFile('menu.html'));
  app.get('/admin', (_req: any, reply: any) => reply.sendFile('admin.html'));
  app.get('/widget.js', (_req: any, reply: any) => reply.type('application/javascript').sendFile('widget.js'));
  app.get('/chat.js', (_req: any, reply: any) => reply.type('application/javascript').sendFile('chat.js'));

  // ---------- javni API ----------
  app.get('/api/r/:slug', async (req: any) => {
    const r = await getRestaurantBySlug(db, req.params.slug);
    const zones = (await db.query('select distinct zone from dining_tables where restaurant_id = $1 and active', [r.id])).rows.map((z: any) => z.zone);
    return {
      name: r.name, address: r.address, phone: r.phone, zones, max_party_size: r.max_party_size,
      guarantee: r.guarantee_mode === 'card' ? { min_party: r.guarantee_min_party, fee_cents: r.no_show_fee_cents } : null,
      opening_hours: r.opening_hours, closed_dates: r.closed_dates, chat_enabled: !!deps.llm,
    };
  });

  app.get('/api/r/:slug/availability', async (req: any) => {
    const r = await getRestaurantBySlug(db, req.params.slug);
    const slots = await findAvailability(db, r, {
      date: String(req.query.date ?? ''), partySize: Number(req.query.party ?? 2), zone: req.query.zone || undefined, now: deps.now(),
    });
    return { slots };
  });

  app.post('/api/r/:slug/reservations', async (req: any, reply: any) => {
    bookLimit(req.ip);
    const r = await getRestaurantBySlug(db, req.params.slug);
    const b = req.body ?? {};
    if (b.website) throw new AppError(400, 'spam', 'Odbijeno'); // honeypot polje
    const { reservation, guaranteeUrl } = await createReservation(db, deps, r, {
      name: b.name, phone: b.phone, email: b.email, language: b.language, partySize: Number(b.partySize),
      date: b.date, time: b.time, zone: b.zone, notes: b.notes, source: 'web', marketingConsent: !!b.marketingConsent,
    });
    return reply.status(201).send({ code: reservation.code, status: reservation.status, guaranteeUrl, ...utcToLocal(new Date(reservation.start_at), r.timezone) });
  });

  app.get('/api/r/:slug/reservations/:code', async (req: any) => {
    const r = await getRestaurantBySlug(db, req.params.slug);
    const res = await getByCode(db, r, req.params.code);
    await verifyGuest(db, res, req.query.contact);
    return { code: res.code, status: res.status, party_size: res.party_size, ...utcToLocal(new Date(res.start_at), r.timezone) };
  });

  app.post('/api/r/:slug/reservations/:code/cancel', async (req: any) => {
    bookLimit(req.ip);
    const r = await getRestaurantBySlug(db, req.params.slug);
    const res = await cancelReservation(db, deps, r, req.params.code, req.body?.contact);
    return { code: res.code, status: res.status };
  });

  app.post('/api/r/:slug/reservations/:code/modify', async (req: any) => {
    bookLimit(req.ip);
    const r = await getRestaurantBySlug(db, req.params.slug);
    const b = req.body ?? {};
    const res = await modifyReservation(db, deps, r, req.params.code, b.contact, {
      date: b.date, time: b.time, partySize: b.partySize ? Number(b.partySize) : undefined,
    });
    return { code: res.code, status: res.status, party_size: res.party_size, ...utcToLocal(new Date(res.start_at), r.timezone) };
  });

  app.post('/api/r/:slug/chat', async (req: any) => {
    chatLimit(req.ip);
    const r = await getRestaurantBySlug(db, req.params.slug);
    const sessionId = String(req.body?.sessionId ?? '');
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(sessionId)) throw new AppError(400, 'bad_session', 'Neispravan sessionId');
    const { reply } = await runChat(db, deps, r, { channel: 'chat', externalId: sessionId, text: String(req.body?.message ?? '') });
    return { reply };
  });

  // ---------- faza 2: QR meni ----------
  app.get('/api/qr/:token', async (req: any) => {
    const t = await tableByQr(db, req.params.token);
    return { restaurant: t.restaurant_name, table: t.label, menu: await publicMenu(db, t.restaurant_id) };
  });

  app.post('/api/qr/:token/orders', async (req: any, reply: any) => {
    orderLimit(req.ip);
    const o = await placeOrder(db, req.params.token, req.body ?? {});
    return reply.status(201).send({ id: o.id, kind: o.kind, total_cents: o.total_cents });
  });

  // ---------- admin (panel restorana) ----------
  // vlasnik (owner): sve; konobar (waiter): rezervacije, narudžbe, dostupnost jela, računi
  const bearer = (req: any) => String(req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
  async function admin(req: any, role: 'owner' | 'waiter' = 'waiter'): Promise<Restaurant> {
    const r = await getRestaurantBySlug(db, req.params.slug);
    const who: StaffIdentity = await authenticate(db, r, bearer(req), deps.now());
    requireRole(who, role);
    req.staff = who;
    return r;
  }

  app.post('/api/admin/:slug/login', async (req: any) => {
    loginLimit(`${req.ip}:${req.params.slug}`);
    const r = await getRestaurantBySlug(db, req.params.slug);
    return login(db, r, req.body?.username, req.body?.password, deps.now());
  });

  app.post('/api/admin/:slug/logout', async (req: any) => {
    await admin(req);
    if (req.staff.userId) await logout(db, bearer(req));
    return { ok: true };
  });

  app.get('/api/admin/:slug/me', async (req: any) => {
    const r = await admin(req);
    return { ...req.staff, restaurant: r.name };
  });

  app.get('/api/admin/:slug/users', async (req: any) => listUsers(db, await admin(req, 'owner')));
  app.post('/api/admin/:slug/users', async (req: any, reply: any) => {
    const r = await admin(req, 'owner');
    return reply.status(201).send(await createUser(db, r, req.body ?? {}));
  });
  app.put('/api/admin/:slug/users/:id', async (req: any) => {
    const r = await admin(req, 'owner');
    return updateUser(db, r, Number(req.params.id), req.body ?? {});
  });

  app.get('/api/admin/:slug/reservations', async (req: any) => {
    const r = await admin(req);
    const date = String(req.query.date ?? utcToLocal(deps.now(), r.timezone).date);
    return { date, reservations: await listForDay(db, r, date) };
  });

  app.post('/api/admin/:slug/reservations', async (req: any, reply: any) => {
    const r = await admin(req);
    const b = req.body ?? {};
    const { reservation } = await createReservation(db, deps, r, {
      name: b.name, phone: b.phone, email: b.email, language: b.language, partySize: Number(b.partySize),
      date: b.date, time: b.time, zone: b.zone, notes: b.notes, source: b.source ?? 'admin', skipGuarantee: b.skipGuarantee !== false,
    });
    return reply.status(201).send(reservation);
  });

  app.post('/api/admin/:slug/reservations/:id/status', async (req: any) => {
    const r = await admin(req);
    return setStatus(db, deps, r, Number(req.params.id), req.body?.status);
  });

  // konobar: { "approve": true } = pošalji gostu upit za Google recenziju, false = ne šalji
  app.post('/api/admin/:slug/reservations/:id/review', async (req: any) => {
    const r = await admin(req);
    return decideReview(db, r, Number(req.params.id), req.body?.approve === true);
  });

  app.post('/api/admin/:slug/reservations/:code/cancel', async (req: any) => {
    const r = await admin(req);
    return cancelReservation(db, deps, r, req.params.code, null, { admin: true });
  });

  app.post('/api/admin/:slug/reservations/:code/modify', async (req: any) => {
    const r = await admin(req);
    const b = req.body ?? {};
    return modifyReservation(db, deps, r, req.params.code, null, { date: b.date, time: b.time, partySize: b.partySize ? Number(b.partySize) : undefined }, { admin: true });
  });

  app.get('/api/admin/:slug/settings', async (req: any) => getSettings(await admin(req)));
  app.put('/api/admin/:slug/settings', async (req: any) => updateSettings(db, await admin(req, 'owner'), req.body ?? {}));

  // Stripe Connect: vlasnik otvara link, upiše podatke tvrtke i vraća se u panel
  app.post('/api/admin/:slug/stripe/onboarding', async (req: any) => startStripeOnboarding(db, deps, await admin(req, 'owner')));
  app.post('/api/admin/:slug/stripe/refresh', async (req: any) => refreshStripeStatus(db, deps, await admin(req, 'owner')));

  app.get('/api/admin/:slug/tables', async (req: any) => {
    const r = await admin(req, 'owner');
    return (await db.query('select * from dining_tables where restaurant_id = $1 order by zone, label', [r.id])).rows;
  });

  app.post('/api/admin/:slug/tables', async (req: any, reply: any) => {
    const r = await admin(req, 'owner');
    const b = req.body ?? {};
    if (!b.label || !(b.max_capacity >= 1)) throw new AppError(400, 'bad_table', 'Treba oznaka i kapacitet');
    const row = (await db.query(
      `insert into dining_tables (restaurant_id, label, zone, min_capacity, max_capacity, qr_token) values ($1,$2,$3,$4,$5,$6) returning *`,
      [r.id, String(b.label), b.zone ?? 'unutra', b.min_capacity ?? 1, b.max_capacity, randomBytes(9).toString('base64url')],
    )).rows[0];
    return reply.status(201).send(row);
  });

  app.put('/api/admin/:slug/tables/:id', async (req: any) => {
    const r = await admin(req, 'owner');
    const b = req.body ?? {};
    const row = (await db.query(
      `update dining_tables set label = coalesce($3, label), zone = coalesce($4, zone), min_capacity = coalesce($5, min_capacity),
         max_capacity = coalesce($6, max_capacity), active = coalesce($7, active) where id = $1 and restaurant_id = $2 returning *`,
      [Number(req.params.id), r.id, b.label ?? null, b.zone ?? null, b.min_capacity ?? null, b.max_capacity ?? null, b.active ?? null],
    )).rows[0];
    if (!row) throw new AppError(404, 'table_not_found', 'Stol ne postoji');
    return row;
  });

  app.get('/api/admin/:slug/table-combos', async (req: any) => listCombinations(db, await admin(req, 'owner')));
  app.post('/api/admin/:slug/table-combos', async (req: any, reply: any) => {
    const r = await admin(req, 'owner');
    return reply.status(201).send(await createCombination(db, r, req.body ?? {}));
  });
  app.put('/api/admin/:slug/table-combos/:id', async (req: any) => updateCombination(db, await admin(req, 'owner'), Number(req.params.id), req.body ?? {}));
  app.delete('/api/admin/:slug/table-combos/:id', async (req: any) => deleteCombination(db, await admin(req, 'owner'), Number(req.params.id)));

  app.post('/api/admin/:slug/menu/:id/available', async (req: any) => {
    const r = await admin(req);
    return setMenuItemAvailable(db, r.id, Number(req.params.id), req.body?.available === true);
  });

  app.get('/api/admin/:slug/menu', async (req: any) => {
    const r = await admin(req);
    return (await db.query('select * from menu_items where restaurant_id = $1 order by sort, category, id', [r.id])).rows;
  });
  app.post('/api/admin/:slug/menu', async (req: any, reply: any) => {
    const r = await admin(req, 'owner');
    return reply.status(201).send(await upsertMenuItem(db, r.id, req.body ?? {}));
  });
  app.put('/api/admin/:slug/menu/:id', async (req: any) => {
    const r = await admin(req, 'owner');
    return upsertMenuItem(db, r.id, req.body ?? {}, Number(req.params.id));
  });

  app.get('/api/admin/:slug/orders', async (req: any) => {
    const r = await admin(req);
    return openOrders(db, r.id);
  });
  app.post('/api/admin/:slug/orders/:id/status', async (req: any) => {
    const r = await admin(req);
    return setOrderStatus(db, r.id, Number(req.params.id), req.body?.status);
  });

  app.post('/api/admin/:slug/invoices', async (req: any, reply: any) => {
    const r = await admin(req);
    if (!opts.cisSender) throw new AppError(503, 'fiscal_unavailable', 'Fiskalizacija nije podešena na serveru');
    const b = req.body ?? {};
    if (!['G', 'K', 'T', 'O'].includes(b.paymentMethod)) throw new AppError(400, 'bad_payment', 'Način plaćanja: G, K, T ili O');
    const inv = await issueInvoice(db, r, {
      orderIds: (b.orderIds ?? []).map(Number), paymentMethod: b.paymentMethod, operatorOib: String(b.operatorOib ?? ''), now: deps.now(),
    }, { send: opts.cisSender });
    return reply.status(201).send(inv);
  });

  app.get('/api/admin/:slug/stats', async (req: any) => {
    const r = await admin(req, 'owner');
    const from = req.query.from ? new Date(req.query.from) : new Date(deps.now().getTime() - 30 * 86400_000);
    const to = req.query.to ? new Date(req.query.to) : deps.now();
    const rows = (await db.query(
      `select source, status, count(*)::int as n, sum(party_size)::int as covers from reservations
        where restaurant_id = $1 and start_at >= $2 and start_at < $3 group by source, status order by source, status`,
      [r.id, from, to],
    )).rows;
    return { from, to, rows };
  });

  // ---------- super admin (ti) ----------
  app.post('/api/super/restaurants', async (req: any, reply: any) => {
    const key = String(req.headers['x-super-key'] ?? '');
    if (!deps.config.superAdminKey || !safeEqual(key, deps.config.superAdminKey)) throw new AppError(401, 'unauthorized', 'Neispravan ključ');
    const b = req.body ?? {};
    if (!/^[a-z0-9-]{3,40}$/.test(b.slug ?? '')) throw new AppError(400, 'bad_slug', 'slug: mala slova, brojke i crtice');
    const adminKey = randomBytes(24).toString('base64url');
    const r = (await db.query(
      `insert into restaurants (slug, name, phone, email, address, opening_hours, admin_api_key)
       values ($1,$2,$3,$4,$5,$6,$7) returning id, slug, name`,
      [b.slug, b.name ?? b.slug, b.phone ?? null, b.email ?? null, b.address ?? null, JSON.stringify(b.opening_hours ?? []), adminKey],
    )).rows[0];
    // po želji odmah i vlasnikov račun za panel: { "owner": { "username": "...", "password": "..." } }
    const owner = b.owner ? await createUser(db, await getRestaurantBySlug(db, r.slug), { ...b.owner, role: 'owner' }) : null;
    return reply.status(201).send({ ...r, admin_api_key: adminKey, owner });
  });

  // ---------- Stripe webhook ----------
  app.post('/webhooks/stripe', async (req: any) => {
    if (!opts.stripeWebhook) throw new AppError(503, 'stripe_disabled', 'Stripe nije podešen');
    const sig = String(req.headers['stripe-signature'] ?? '');
    const ev = await opts.stripeWebhook(req.rawBody ?? '', sig);
    if (ev?.type === 'setup_completed') await confirmGuarantee(db, deps, ev.sessionId, ev.paymentMethodId, ev.customerId);
    if (ev?.type === 'account_updated') await stripeAccountUpdated(db, ev.accountId, ev.chargesEnabled);
    return { received: true };
  });

  // ---------- Meta webhook (WhatsApp + Instagram) ----------
  app.get('/webhooks/meta', async (req: any, reply: any) => {
    const q = req.query ?? {};
    if (q['hub.mode'] === 'subscribe' && q['hub.verify_token'] === deps.config.metaVerifyToken) return reply.type('text/plain').send(q['hub.challenge']);
    return reply.status(403).send('forbidden');
  });

  app.post('/webhooks/meta', async (req: any) => {
    if (deps.config.metaAppSecret) {
      const sig = String(req.headers['x-hub-signature-256'] ?? '');
      const expected = 'sha256=' + createHmac('sha256', deps.config.metaAppSecret).update(req.rawBody ?? '').digest('hex');
      if (!safeEqual(sig, expected)) throw new AppError(401, 'bad_signature', 'Neispravan potpis');
    }
    const body = req.body ?? {};
    // odgovaramo odmah (Meta inače ponavlja), poruke obrađujemo u pozadini
    track(handleMeta(body));
    return { received: true };
  });

  async function handleMeta(body: any) {
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry ?? []) {
        for (const ch of entry.changes ?? []) {
          const v = ch.value ?? {};
          const phoneNumberId = v.metadata?.phone_number_id;
          if (!phoneNumberId || !v.messages) continue;
          const r = (await db.query<Restaurant>('select * from restaurants where whatsapp_phone_number_id = $1', [phoneNumberId])).rows[0];
          if (!r) continue;
          for (const m of v.messages) {
            const from = '+' + String(m.from);
            const text = m.type === 'text' ? m.text?.body
              : m.type === 'button' ? m.button?.text
              : m.type === 'interactive' ? (m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title)
              : null;
            const reply = text
              ? (await runChat(db, deps, r, { channel: 'whatsapp', externalId: from, text, callerPhone: from })).reply
              : 'Za sada razumijem samo tekstualne poruke. Napišite nam što trebate.';
            await deps.transport.sendWhatsApp({ phoneNumberId, to: from, body: { type: 'text', text: reply } });
          }
        }
      }
    } else if (body.object === 'instagram' || body.object === 'page') {
      for (const entry of body.entry ?? []) {
        const r = (await db.query<Restaurant>('select * from restaurants where instagram_account_id = $1', [String(entry.id)])).rows[0];
        if (!r) continue;
        for (const ev of entry.messaging ?? []) {
          if (ev.message?.is_echo || !ev.message?.text) continue;
          const sender = String(ev.sender?.id);
          const { reply } = await runChat(db, deps, r, { channel: 'instagram', externalId: sender, text: ev.message.text });
          await deps.transport.sendInstagram({ igAccountId: r.instagram_account_id!, recipientId: sender, text: reply });
        }
      }
    }
  }

  // ---------- Voice agent (Retell custom functions) ----------
  function voiceAuth(req: any) {
    const s = String(req.headers['x-opsis-secret'] ?? req.query?.secret ?? '');
    if (!deps.config.voiceSharedSecret || !safeEqual(s, deps.config.voiceSharedSecret)) throw new AppError(401, 'unauthorized', 'Neispravan ključ');
  }

  // Retell šalje { name, args, call: { from_number, ... } } na URL funkcije
  app.post('/voice/retell/:slug', async (req: any) => {
    voiceAuth(req);
    const r = await getRestaurantBySlug(db, req.params.slug);
    const b = req.body ?? {};
    const name = String(b.name ?? req.query.fn ?? '');
    const callerPhone = b.call?.from_number ?? null;
    return executeTool(db, deps, r, name, b.args ?? {}, { source: 'voice', callerPhone });
  });

  // Retell inbound webhook: dinamičke varijable za prompt (današnji datum, radno vrijeme...)
  app.post('/voice/retell/:slug/inbound', async (req: any) => {
    voiceAuth(req);
    const r = await getRestaurantBySlug(db, req.params.slug);
    const local = utcToLocal(deps.now(), r.timezone);
    const DAYS = ['', 'ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota', 'nedjelja'];
    return {
      call_inbound: {
        dynamic_variables: {
          restaurant_name: r.name,
          today: `${DAYS[local.weekday]}, ${local.date}`,
          now_time: local.time,
          restaurant_phone: r.phone ?? '',
          max_party_size: String(r.max_party_size),
        },
      },
    };
  });

  return app;
}
