// Prave implementacije vanjskih servisa: Stripe, SMTP, Meta (WhatsApp/Instagram), Anthropic.
import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import Anthropic from '@anthropic-ai/sdk';
import type { LLM, Payments, StripeEvent, Transport } from './deps.js';

/**
 * Stripe Connect: novac ide izravno restoranu (restaurant.stripe_account_id),
 * ti si platforma. Restoran se spaja preko Stripe Connect onboardinga (vidi docs/stripe.md).
 */
export function stripePayments(secretKey: string): Payments {
  const stripe = new Stripe(secretKey);
  return {
    async createGuaranteeSession({ restaurant, reservationCode, guestEmail, successUrl, cancelUrl, customerId }) {
      const opts = { stripeAccount: restaurant.stripe_account_id! };
      const customer = customerId ?? (await stripe.customers.create({ email: guestEmail ?? undefined, metadata: { reservationCode } }, opts)).id;
      const s = await stripe.checkout.sessions.create(
        {
          mode: 'setup',
          currency: 'eur',
          customer,
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: { reservationCode },
          expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
        },
        opts,
      );
      return { id: s.id, url: s.url! };
    },
    async chargeNoShow({ restaurant, paymentMethodId, customerId, amountCents, reservationCode }) {
      const pi = await stripe.paymentIntents.create(
        {
          amount: amountCents,
          currency: 'eur',
          customer: customerId,
          payment_method: paymentMethodId,
          off_session: true,
          confirm: true,
          description: `No-show ${reservationCode}`,
          metadata: { reservationCode },
        },
        { stripeAccount: restaurant.stripe_account_id! },
      );
      return pi.id;
    },
    async createConnectAccount({ restaurant }) {
      const a = await stripe.accounts.create({
        type: 'express',
        country: 'HR',
        email: restaurant.email ?? undefined,
        business_profile: { name: restaurant.name, mcc: '5812' }, // 5812 = restorani
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        metadata: { restaurantSlug: restaurant.slug },
      });
      return a.id;
    },
    async createOnboardingLink({ accountId, refreshUrl, returnUrl }) {
      const l = await stripe.accountLinks.create({ account: accountId, refresh_url: refreshUrl, return_url: returnUrl, type: 'account_onboarding' });
      return l.url;
    },
    async getAccountStatus(accountId) {
      const a = await stripe.accounts.retrieve(accountId);
      return { chargesEnabled: !!a.charges_enabled, detailsSubmitted: !!a.details_submitted };
    },
  };
}

/**
 * Iz Stripe webhook eventa izvuče ono što nas zanima:
 *  - checkout.session.completed (setup mode): gost ostavio karticu
 *  - account.updated: restoran završio Connect onboarding
 */
export async function readStripeEvent(secretKey: string, event: any): Promise<StripeEvent | null> {
  if (event.type === 'account.updated') {
    const a = event.data.object;
    return { type: 'account_updated', accountId: String(a.id), chargesEnabled: !!a.charges_enabled };
  }
  if (event.type !== 'checkout.session.completed') return null;
  const session = event.data.object;
  if (session.mode !== 'setup' || !session.setup_intent) return null;
  const stripe = new Stripe(secretKey);
  const si = await stripe.setupIntents.retrieve(session.setup_intent, {}, event.account ? { stripeAccount: event.account } : undefined);
  return { type: 'setup_completed', sessionId: session.id, paymentMethodId: String(si.payment_method), customerId: session.customer ?? null };
}

export function verifyStripeEvent(secretKey: string, webhookSecret: string, rawBody: string | Buffer, signature: string) {
  return new Stripe(secretKey).webhooks.constructEvent(rawBody, signature, webhookSecret);
}

export function realTransport(env: {
  smtpUrl?: string; mailFrom?: string; metaAccessToken?: string; graphVersion?: string;
}): Transport {
  const mailer = env.smtpUrl ? nodemailer.createTransport(env.smtpUrl) : null;
  const graph = `https://graph.facebook.com/${env.graphVersion ?? 'v21.0'}`;
  async function graphPost(path: string, body: unknown) {
    if (!env.metaAccessToken) throw new Error('META_ACCESS_TOKEN nije postavljen');
    const res = await fetch(`${graph}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.metaAccessToken}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Meta ${res.status}: ${await res.text()}`);
  }
  return {
    async sendEmail({ to, subject, text, replyTo }) {
      if (!mailer) throw new Error('SMTP_URL nije postavljen');
      await mailer.sendMail({ from: env.mailFrom, to, subject, text, replyTo: replyTo ?? undefined });
    },
    async sendWhatsApp({ phoneNumberId, to, body }) {
      const payload =
        body.type === 'text'
          ? { messaging_product: 'whatsapp', to: to.replace('+', ''), type: 'text', text: { body: body.text } }
          : {
              messaging_product: 'whatsapp',
              to: to.replace('+', ''),
              type: 'template',
              template: {
                name: body.name,
                language: { code: body.language },
                components: [{ type: 'body', parameters: body.params.map((t) => ({ type: 'text', text: t })) }],
              },
            };
      await graphPost(`${phoneNumberId}/messages`, payload);
    },
    async sendInstagram({ igAccountId, recipientId, text }) {
      await graphPost(`${igAccountId}/messages`, { recipient: { id: recipientId }, message: { text } });
    },
  };
}

export function anthropicLLM(apiKey: string): LLM {
  const client = new Anthropic({ apiKey });
  return {
    async create(params) {
      const res = await client.messages.create(params as any);
      return { content: res.content as any[], stop_reason: res.stop_reason };
    },
  };
}

/** Za razvoj: ispisuje poruke u konzolu umjesto slanja. */
export function consoleTransport(): Transport {
  return {
    async sendEmail(i) { console.log('[email]', i.to, i.subject); },
    async sendWhatsApp(i) { console.log('[whatsapp]', i.to, JSON.stringify(i.body)); },
    async sendInstagram(i) { console.log('[instagram]', i.recipientId, i.text); },
  };
}
