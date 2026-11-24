import { createMemDb, createPgDb, migrate } from './db.js';
import { anthropicLLM, consoleTransport, readStripeEvent, realTransport, stripePayments, verifyStripeEvent } from './adapters.js';
import { buildApp } from './server.js';
import { startScheduler } from './jobs/scheduler.js';
import { httpsCisSender } from './fiscal/cis.js';
import { resendFailed } from './fiscal/invoices.js';
import { purgeOldChats } from './ai/chatbot.js';
import type { Deps } from './deps.js';
import { seedDemo } from './demo.js';
import { purgeExpiredSessions } from './services/staff.js';

const env = process.env;

async function main() {
  const db = env.DATABASE_URL ? createPgDb(env.DATABASE_URL) : await createMemDb();
  if (!env.DATABASE_URL) console.warn('⚠ DATABASE_URL nije postavljen — koristi se baza u memoriji (podaci se gube kod restarta)');
  await migrate(db);
  if (!env.DATABASE_URL || env.SEED_DEMO === 'true') await seedDemo(db);

  const deps: Deps = {
    config: {
      publicBaseUrl: (env.PUBLIC_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
      anthropicModel: env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5',
      voiceSharedSecret: env.VOICE_SHARED_SECRET ?? '',
      metaVerifyToken: env.META_VERIFY_TOKEN ?? '',
      metaAppSecret: env.META_APP_SECRET ?? '',
      stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET ?? '',
      superAdminKey: env.SUPER_ADMIN_KEY ?? '',
    },
    payments: env.STRIPE_SECRET_KEY ? stripePayments(env.STRIPE_SECRET_KEY) : null,
    transport: env.SMTP_URL || env.META_ACCESS_TOKEN
      ? realTransport({ smtpUrl: env.SMTP_URL, mailFrom: env.MAIL_FROM, metaAccessToken: env.META_ACCESS_TOKEN, graphVersion: env.META_GRAPH_VERSION })
      : consoleTransport(),
    llm: env.ANTHROPIC_API_KEY ? anthropicLLM(env.ANTHROPIC_API_KEY) : null,
    now: () => new Date(),
  };

  const cisSender = env.FISCAL_ENABLED === 'true' ? httpsCisSender(env.FISCAL_CA_PEM) : null;
  const app = await buildApp(db, deps, {
    logger: true,
    cisSender,
    stripeWebhook: env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET
      ? async (raw, sig) => readStripeEvent(env.STRIPE_SECRET_KEY!, verifyStripeEvent(env.STRIPE_SECRET_KEY!, env.STRIPE_WEBHOOK_SECRET!, raw, sig))
      : null,
  });

  startScheduler(db, deps);
  setInterval(() => purgeExpiredSessions(db, new Date()).catch(console.error), 6 * 3600_000);
  setInterval(() => purgeOldChats(db).catch(console.error), 6 * 3600_000);
  if (cisSender) setInterval(() => resendFailed(db, { send: cisSender }).catch(console.error), 10 * 60_000);

  await app.listen({ port: Number(env.PORT ?? 3000), host: '0.0.0.0' });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
