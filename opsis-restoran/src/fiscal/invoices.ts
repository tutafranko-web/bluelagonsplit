import type { Db } from '../db.js';
import { AppError, type Restaurant } from '../services/types.js';
import {
  buildRacunZahtjev, CIS_DEMO_URL, CIS_PROD_URL, computeZki, loadP12, parseCisResponse, signXml, soapEnvelope,
  vatBreakdown, type CisSender, type FiscalCert,
} from './cis.js';

/**
 * fiscal_config u tablici restaurants:
 * { "enabled": false, "env": "demo" | "prod", "oib": "12345678901", "inVatSystem": true,
 *   "premise": "PP1", "device": "1", "p12Base64": "...", "p12Password": "..." }
 * Certifikat u produkciji drži u tajnom spremištu (npr. Supabase Vault), ne u običnom stupcu.
 */
export interface FiscalConfig {
  enabled: boolean; env: 'demo' | 'prod'; oib: string; inVatSystem: boolean; premise: string; device: string;
  p12Base64?: string; p12Password?: string;
}

const certCache = new Map<number, FiscalCert>();

export function getCert(r: Restaurant, override?: FiscalCert): FiscalCert {
  if (override) return override;
  const cached = certCache.get(r.id);
  if (cached) return cached;
  const fc = r.fiscal_config as FiscalConfig;
  if (!fc.p12Base64 || !fc.p12Password) throw new AppError(400, 'no_cert', 'Restoran nema učitan FINA certifikat');
  const cert = loadP12(fc.p12Base64, fc.p12Password);
  certCache.set(r.id, cert);
  return cert;
}

export function isValidOib(oib: string): boolean {
  if (!/^\d{11}$/.test(oib)) return false;
  let a = 10;
  for (let i = 0; i < 10; i++) {
    a = (a + Number(oib[i])) % 10;
    if (a === 0) a = 10;
    a = (a * 2) % 11;
  }
  const check = (11 - a) % 10;
  return check === Number(oib[10]);
}

/**
 * Izdaje fiskalni račun za jednu ili više narudžbi istog stola.
 * Račun se izdaje i ako CIS ne odgovori (sa ZKI-jem); takav se ponovno šalje kao naknadna dostava (resendFailed).
 */
export async function issueInvoice(
  db: Db, r: Restaurant,
  input: { orderIds: number[]; paymentMethod: 'G' | 'K' | 'T' | 'O'; operatorOib: string; now: Date },
  io: { send: CisSender; cert?: FiscalCert },
) {
  const fc = r.fiscal_config as FiscalConfig;
  if (!fc?.enabled) throw new AppError(409, 'fiscal_disabled', 'Fiskalizacija nije uključena za ovaj restoran');
  if (!isValidOib(fc.oib) || !isValidOib(input.operatorOib)) throw new AppError(400, 'bad_oib', 'Neispravan OIB');
  if (!input.orderIds.length) throw new AppError(400, 'no_orders', 'Nema narudžbi za račun');
  const cert = getCert(r, io.cert);

  const inv = await db.tx(async (t) => {
    const items = (await t.query(
      `select oi.qty, oi.unit_price_cents, oi.vat_rate from order_items oi join orders o on o.id = oi.order_id
        where o.restaurant_id = $1 and o.id = any($2) and o.invoice_id is null and o.status <> 'cancelled'`,
      [r.id, input.orderIds],
    )).rows;
    if (!items.length) throw new AppError(409, 'nothing_to_invoice', 'Narudžbe su već naplaćene ili prazne');
    const lines = items.map((i: any) => ({ grossCents: i.qty * i.unit_price_cents, rate: Number(i.vat_rate) }));
    const total = lines.reduce((s, l) => s + l.grossCents, 0);
    await t.query('select id from restaurants where id = $1 for update', [r.id]);
    // brojevi računa kreću od 1 svake godine
    const year = input.now.getUTCFullYear();
    const seq = (await t.query(
      `select coalesce(max(seq), 0) + 1 as next from invoices
        where restaurant_id = $1 and premise = $2 and device = $3 and extract(year from issued_at) = $4`,
      [r.id, fc.premise, fc.device, year],
    )).rows[0].next as number;
    const zki = computeZki({
      oib: fc.oib, issuedAt: input.now, seq, premise: fc.premise, device: fc.device, totalCents: total,
      privateKeyPem: cert.privateKeyPem, timeZone: r.timezone,
    });
    const vat = fc.inVatSystem ? vatBreakdown(lines) : [];
    const xml = buildRacunZahtjev({
      oib: fc.oib, inVatSystem: fc.inVatSystem, issuedAt: input.now, seq, premise: fc.premise, device: fc.device,
      vat, totalCents: total, paymentMethod: input.paymentMethod, operatorOib: input.operatorOib, zki, timeZone: r.timezone,
    });
    const invoice = (await t.query(
      `insert into invoices (restaurant_id, seq, premise, device, issued_at, total_cents, payment_method, operator_oib, zki, request_xml)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`,
      [r.id, seq, fc.premise, fc.device, input.now, total, input.paymentMethod, input.operatorOib, zki, xml],
    )).rows[0];
    await t.query(`update orders set invoice_id = $1, status = 'paid' where restaurant_id = $2 and id = any($3)`, [invoice.id, r.id, input.orderIds]);
    return { invoice, vat };
  });

  return { ...(await sendInvoice(db, r, inv.invoice.id, io, false)), vat: inv.vat };
}

export async function sendInvoice(db: Db, r: Restaurant, invoiceId: number, io: { send: CisSender; cert?: FiscalCert }, late: boolean) {
  const fc = r.fiscal_config as FiscalConfig;
  const cert = getCert(r, io.cert);
  const inv = (await db.query('select * from invoices where id = $1 and restaurant_id = $2', [invoiceId, r.id])).rows[0];
  let xml: string = inv.request_xml;
  if (late) xml = xml.replace('<tns:NakDost>false</tns:NakDost>', '<tns:NakDost>true</tns:NakDost>');
  try {
    const signed = signXml(xml, cert);
    const resp = await io.send(fc.env === 'prod' ? CIS_PROD_URL : CIS_DEMO_URL, soapEnvelope(signed));
    const { jir, errors } = parseCisResponse(resp);
    if (!jir) throw new Error(errors.join('; ') || 'CIS nije vratio JIR');
    return (await db.query(
      `update invoices set jir = $2, fiscal_status = 'fiscalized', fiscal_error = null where id = $1 returning *`, [invoiceId, jir],
    )).rows[0];
  } catch (e: any) {
    return (await db.query(
      `update invoices set fiscal_status = 'failed', fiscal_error = $2 where id = $1 returning *`, [invoiceId, String(e?.message ?? e)],
    )).rows[0];
  }
}

/** Naknadna dostava računa koji nisu prošli (zakonski rok je 2 radna dana — provjeri aktualni pravilnik). */
export async function resendFailed(db: Db, io: { send: CisSender }) {
  const rows = (await db.query(
    `select id, restaurant_id from invoices where fiscal_status = 'failed' order by id limit 50`,
  )).rows;
  let ok = 0;
  for (const row of rows) {
    const r = (await db.query<Restaurant>('select * from restaurants where id = $1', [row.restaurant_id])).rows[0];
    if (!(r.fiscal_config as FiscalConfig)?.enabled) continue;
    const res = await sendInvoice(db, r, row.id, io, true);
    if (res.fiscal_status === 'fiscalized') ok++;
  }
  return ok;
}
