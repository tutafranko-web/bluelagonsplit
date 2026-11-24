import type { Db } from '../db.js';
import type { Deps } from '../deps.js';
import { AppError, type Restaurant } from './types.js';

const SETTINGS = ['name', 'phone', 'email', 'address', 'default_language', 'opening_hours', 'closed_dates', 'slot_minutes',
  'default_duration_minutes', 'max_party_size', 'guarantee_mode', 'guarantee_min_party', 'no_show_fee_cents',
  'google_review_url', 'review_mode', 'info_text', 'whatsapp_phone_number_id', 'instagram_account_id'] as const;
const JSON_SETTINGS = new Set(['opening_hours', 'closed_dates']);
/** Meta ID-jevi su brojevi; prazno = odspoji kanal. */
const META_IDS = new Set(['whatsapp_phone_number_id', 'instagram_account_id']);

export type StripeStatus = 'none' | 'pending' | 'ready';

export function stripeStatus(r: Restaurant): StripeStatus {
  return !r.stripe_account_id ? 'none' : r.stripe_charges_enabled ? 'ready' : 'pending';
}

export function getSettings(r: Restaurant) {
  const out: any = {};
  for (const k of SETTINGS) out[k] = (r as any)[k];
  out.slug = r.slug;
  out.stripe_status = stripeStatus(r);
  out.stripe_connected = out.stripe_status === 'ready';
  out.whatsapp_connected = !!r.whatsapp_phone_number_id;
  out.instagram_connected = !!r.instagram_account_id;
  out.fiscal_enabled = !!(r.fiscal_config as any)?.enabled;
  return out;
}

export async function updateSettings(db: Db, r: Restaurant, b: Record<string, any>) {
  const sets: string[] = [], vals: unknown[] = [r.id];
  for (const k of SETTINGS) {
    if (!(k in b)) continue;
    let v = b[k];
    if (k === 'guarantee_mode' && !['none', 'card'].includes(v)) throw new AppError(400, 'bad_value', 'guarantee_mode: none ili card');
    if (k === 'review_mode' && !['approval', 'auto', 'off'].includes(v)) throw new AppError(400, 'bad_value', 'review_mode: approval, auto ili off');
    if (k === 'opening_hours' && (!Array.isArray(v) || v.some((p: any) => !(p.weekday >= 1 && p.weekday <= 7) || !/^\d{2}:\d{2}$/.test(p.open) || !/^\d{2}:\d{2}$/.test(p.close))))
      throw new AppError(400, 'bad_value', 'Neispravno radno vrijeme');
    if (META_IDS.has(k)) {
      v = v == null ? null : String(v).trim() || null;
      if (v && !/^\d{5,25}$/.test(v)) throw new AppError(400, 'bad_value', k === 'whatsapp_phone_number_id'
        ? 'WhatsApp Phone number ID je broj iz Meta → WhatsApp → API Setup'
        : 'Instagram ID je broj (Instagram Business Account ID)');
    }
    vals.push(JSON_SETTINGS.has(k) ? JSON.stringify(v) : v);
    sets.push(`${k} = $${vals.length}`);
  }
  if (!sets.length) return { updated: 0 };
  try {
    await db.query(`update restaurants set ${sets.join(', ')} where id = $1`, vals);
  } catch (e: any) {
    const m = String(e?.message);
    if (m.includes('restaurants_whatsapp_uniq')) throw new AppError(409, 'channel_taken', 'Taj WhatsApp broj je već spojen na drugi restoran');
    if (m.includes('restaurants_instagram_uniq')) throw new AppError(409, 'channel_taken', 'Taj Instagram račun je već spojen na drugi restoran');
    throw e;
  }
  return { updated: sets.length };
}

/**
 * Stripe Connect onboarding: napravi Express račun restorana (ako ga još nema)
 * i vrati Stripeov link na kojem vlasnik upiše podatke tvrtke i IBAN.
 */
export async function startStripeOnboarding(db: Db, deps: Deps, r: Restaurant): Promise<{ url: string; status: StripeStatus }> {
  if (!deps.payments) throw new AppError(503, 'stripe_disabled', 'Stripe nije podešen na serveru');
  let accountId = r.stripe_account_id;
  if (!accountId) {
    accountId = await deps.payments.createConnectAccount({ restaurant: r });
    await db.query('update restaurants set stripe_account_id = $2, stripe_charges_enabled = false where id = $1', [r.id, accountId]);
  }
  const base = `${deps.config.publicBaseUrl}/admin`;
  const url = await deps.payments.createOnboardingLink({ accountId, refreshUrl: `${base}?stripe=refresh`, returnUrl: `${base}?stripe=return` });
  return { url, status: stripeStatus({ ...r, stripe_account_id: accountId }) };
}

/** Pita Stripe je li račun spreman (poziva se kad se vlasnik vrati s onboardinga). */
export async function refreshStripeStatus(db: Db, deps: Deps, r: Restaurant): Promise<{ status: StripeStatus }> {
  if (!r.stripe_account_id) return { status: 'none' };
  if (!deps.payments) throw new AppError(503, 'stripe_disabled', 'Stripe nije podešen na serveru');
  const { chargesEnabled } = await deps.payments.getAccountStatus(r.stripe_account_id);
  await db.query('update restaurants set stripe_charges_enabled = $2 where id = $1', [r.id, chargesEnabled]);
  return { status: chargesEnabled ? 'ready' : 'pending' };
}

/** Stripe webhook account.updated. */
export async function stripeAccountUpdated(db: Db, accountId: string, chargesEnabled: boolean) {
  await db.query('update restaurants set stripe_charges_enabled = $2 where stripe_account_id = $1', [accountId, chargesEnabled]);
}
