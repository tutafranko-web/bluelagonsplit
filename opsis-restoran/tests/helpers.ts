import { createMemDb, migrate, type Db } from '../src/db.js';
import type { Deps, LLM, Payments, Transport } from '../src/deps.js';
import type { Restaurant } from '../src/services/types.js';

export interface Sent { channel: string; to: string; body: any }

export function fakeTransport(): Transport & { sent: Sent[] } {
  const sent: Sent[] = [];
  return {
    sent,
    async sendEmail(i) { sent.push({ channel: 'email', to: i.to, body: i }); },
    async sendWhatsApp(i) { sent.push({ channel: 'whatsapp', to: i.to, body: i.body }); },
    async sendInstagram(i) { sent.push({ channel: 'instagram', to: i.recipientId, body: i.text }); },
  };
}

export function fakePayments(): Payments & { charges: any[]; sessions: any[] } {
  const charges: any[] = [];
  const sessions: any[] = [];
  return {
    charges, sessions,
    async createGuaranteeSession(i) {
      const s = { id: `cs_test_${sessions.length + 1}`, url: `https://checkout.stripe.test/${sessions.length + 1}` };
      sessions.push({ ...i, ...s });
      return s;
    },
    async chargeNoShow(i) {
      charges.push(i);
      return `pi_test_${charges.length}`;
    },
  };
}

export async function setup(opts: { now?: Date; llm?: LLM | null; guarantee?: boolean } = {}) {
  const db: Db = await createMemDb();
  await migrate(db);
  let now = opts.now ?? new Date('2026-07-10T08:00:00Z'); // petak 10:00 u Zagrebu
  const transport = fakeTransport();
  const payments = fakePayments();
  const deps: Deps = {
    config: {
      publicBaseUrl: 'https://app.test', anthropicModel: 'test-model', voiceSharedSecret: 'voice-secret',
      metaVerifyToken: 'verify-me', metaAppSecret: '', stripeWebhookSecret: '', superAdminKey: 'super',
    },
    payments,
    transport,
    llm: opts.llm ?? null,
    now: () => now,
  };
  const hours = [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({ weekday, open: '12:00', close: '23:00' }));
  const r = (
    await db.query<Restaurant>(
      `insert into restaurants (slug, name, phone, email, address, opening_hours, admin_api_key, guarantee_mode, guarantee_min_party,
         no_show_fee_cents, stripe_account_id, google_review_url, whatsapp_phone_number_id, info_text, closed_dates)
       values ('konoba-test','Konoba Test','+38521000000','konoba@test.hr','Riva 1, Split',$1,'admin-key',$2,4,2000,$3,
               'https://g.page/r/test/review','wa-phone-1','Parking u blizini. Psi dozvoljeni na terasi.', '["2026-07-20"]')
       returning *`,
      [JSON.stringify(hours), opts.guarantee ? 'card' : 'none', opts.guarantee ? 'acct_test' : null],
    )
  ).rows[0];
  // 2 stola za 2, 1 za 4 unutra, 1 za 6 na terasi
  await db.query(
    `insert into dining_tables (restaurant_id, label, zone, min_capacity, max_capacity, qr_token) values
       ($1,'1','unutra',1,2,'qr1'),($1,'2','unutra',1,2,'qr2'),($1,'3','unutra',2,4,'qr3'),($1,'T1','terasa',3,6,'qrt1')`,
    [r.id],
  );
  return {
    db, deps, r, transport, payments,
    setNow: (d: Date) => { now = d; },
  };
}
