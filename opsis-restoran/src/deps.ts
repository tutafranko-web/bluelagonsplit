import type { Restaurant } from './services/types.js';

export interface Config {
  publicBaseUrl: string;            // npr. https://app.opsisdalmatia.com
  anthropicModel: string;
  voiceSharedSecret: string;        // tajni ključ za Retell funkcije
  metaVerifyToken: string;          // WhatsApp/Instagram webhook verify token
  metaAppSecret: string;            // za provjeru potpisa webhooka
  stripeWebhookSecret: string;
  superAdminKey: string;            // za tebe: kreiranje restorana
}

export interface Payments {
  /** Stripe Checkout u "setup" modu: gost ostavi karticu kao garanciju. */
  createGuaranteeSession(input: {
    restaurant: Restaurant; reservationCode: string; guestEmail?: string | null;
    successUrl: string; cancelUrl: string; customerId?: string | null;
  }): Promise<{ id: string; url: string }>;
  /** Naplata no-showa sa spremljene kartice. Vraća ID naplate. */
  chargeNoShow(input: {
    restaurant: Restaurant; paymentMethodId: string; customerId: string;
    amountCents: number; reservationCode: string;
  }): Promise<string>;
}

export interface Transport {
  sendEmail(input: { to: string; subject: string; text: string; replyTo?: string | null }): Promise<void>;
  sendWhatsApp(input: { phoneNumberId: string; to: string; body: WhatsAppBody }): Promise<void>;
  sendInstagram(input: { igAccountId: string; recipientId: string; text: string }): Promise<void>;
}

export type WhatsAppBody =
  | { type: 'text'; text: string }
  | { type: 'template'; name: string; language: string; params: string[] };

/** Minimalno sučelje prema Claude Messages API-ju (lako za mockati u testovima). */
export interface LLM {
  create(params: {
    model: string; max_tokens: number; system: string; messages: any[]; tools: any[];
  }): Promise<{ content: any[]; stop_reason: string | null }>;
}

export interface Deps {
  config: Config;
  payments: Payments | null;   // null = Stripe nije podešen
  transport: Transport;
  llm: LLM | null;             // null = chatbot isključen
  now: () => Date;
}
