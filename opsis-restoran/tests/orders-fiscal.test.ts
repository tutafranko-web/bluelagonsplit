import { describe, expect, it } from 'vitest';
import forge from 'node-forge';
import { SignedXml } from 'xml-crypto';
import { createHash, createSign } from 'node:crypto';
import { DOMParser } from '@xmldom/xmldom';
import { setup } from './helpers.js';
import { buildApp } from '../src/server.js';
import { certFromForge, computeZki, fiscalDates, parseCisResponse, signXml, buildRacunZahtjev, vatBreakdown } from '../src/fiscal/cis.js';
import { isValidOib } from '../src/fiscal/invoices.js';

async function seedMenu(app: any) {
  const h = { authorization: 'Bearer admin-key' };
  const a = await app.inject({ method: 'POST', url: '/api/admin/konoba-test/menu', headers: h,
    payload: { category: 'Glavna jela', name: { hr: 'Crni rižot', en: 'Black risotto' }, price_cents: 1800, allergens: ['mekušci', 'mlijeko'] } });
  const b = await app.inject({ method: 'POST', url: '/api/admin/konoba-test/menu', headers: h,
    payload: { category: 'Pića', name: { hr: 'Domaće vino 0,5 l' }, price_cents: 1200, vat_rate: 25 } });
  return { a: a.json(), b: b.json(), h };
}

describe('faza 2: QR meni i narudžbe', () => {
  it('meni po QR kodu, narudžba, poziv konobara, panel', async () => {
    const { db, deps } = await setup();
    const app = await buildApp(db, deps);
    const { a, b, h } = await seedMenu(app);
    const badAllergen = await app.inject({ method: 'POST', url: '/api/admin/konoba-test/menu', headers: h,
      payload: { category: 'X', name: { hr: 'Y' }, price_cents: 100, allergens: ['ljuto'] } });
    expect(badAllergen.statusCode).toBe(400);

    const menu = await app.inject({ url: '/api/qr/qr3' });
    expect(menu.json()).toMatchObject({ restaurant: 'Konoba Test', table: '3' });
    expect(menu.json().menu).toHaveLength(2);

    const o = await app.inject({ method: 'POST', url: '/api/qr/qr3/orders', payload: { items: [{ menu_item_id: a.id, qty: 2 }, { menu_item_id: b.id, qty: 1 }], notes: 'bez luka' } });
    expect(o.statusCode).toBe(201);
    expect(o.json().total_cents).toBe(4800);
    await app.inject({ method: 'POST', url: '/api/qr/qr3/orders', payload: { kind: 'call_waiter' } });

    expect((await app.inject({ method: 'POST', url: '/api/qr/qr3/orders', payload: { items: [] } })).statusCode).toBe(400);
    expect((await app.inject({ url: '/api/qr/nepostoji' })).statusCode).toBe(404);

    const open = await app.inject({ url: '/api/admin/konoba-test/orders', headers: h });
    expect(open.json()).toHaveLength(2);
    expect(open.json()[0].items).toEqual([
      { name: 'Crni rižot', qty: 2, unit_price_cents: 1800 },
      { name: 'Domaće vino 0,5 l', qty: 1, unit_price_cents: 1200 },
    ]);
    await app.inject({ method: 'PUT', url: `/api/admin/konoba-test/menu/${a.id}`, headers: h,
      payload: { category: 'Glavna jela', name: { hr: 'Crni rižot' }, price_cents: 1800, available: false } });
    const unavailable = await app.inject({ method: 'POST', url: '/api/qr/qr3/orders', payload: { items: [{ menu_item_id: a.id, qty: 1 }] } });
    expect(unavailable.json().error).toBe('item_unavailable');
  });
});

function testCert() {
  const keys = forge.pki.rsa.generateKeyPair(1024);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '0a1b';
  cert.validity.notBefore = new Date('2026-01-01');
  cert.validity.notAfter = new Date('2028-01-01');
  const attrs = [{ shortName: 'CN', value: 'Test Konoba' }, { shortName: 'O', value: 'Test' }, { shortName: 'C', value: 'HR' }];
  cert.setSubject(attrs);
  cert.setIssuer([{ shortName: 'CN', value: 'Fina Demo CA 2020' }, { shortName: 'O', value: 'Financijska agencija' }, { shortName: 'C', value: 'HR' }]);
  cert.sign(keys.privateKey, forge.md.sha256.create());
  return certFromForge(keys.privateKey, cert);
}

describe('faza 3: fiskalizacija', () => {
  const cert = testCert();

  it('OIB kontrolna znamenka', () => {
    expect(isValidOib('69435151530')).toBe(true);
    expect(isValidOib('69435151531')).toBe(false);
    expect(isValidOib('123')).toBe(false);
  });

  it('ZKI = MD5 RSA-SHA1 potpisa točnog niza', () => {
    const issuedAt = new Date('2026-07-11T18:05:09Z'); // 20:05:09 u Zagrebu
    expect(fiscalDates(issuedAt).zki).toBe('11.07.2026 20:05:09');
    const zki = computeZki({ oib: '69435151530', issuedAt, seq: 7, premise: 'PP1', device: '1', totalCents: 4800, privateKeyPem: cert.privateKeyPem });
    expect(zki).toMatch(/^[0-9a-f]{32}$/);
    // isti niz potpisan ručno daje isti ZKI (RSA PKCS#1 v1.5 je deterministički)
    const manual = createHash('md5').update(createSign('RSA-SHA1').update('6943515153011.07.2026 20:05:097PP1148.00').sign(cert.privateKeyPem)).digest('hex');
    expect(zki).toBe(manual);
  });

  it('PDV se rastavlja po stopama', () => {
    expect(vatBreakdown([{ grossCents: 3600, rate: 13 }, { grossCents: 1200, rate: 25 }])).toEqual([
      { rate: 13, baseCents: 3186, taxCents: 414 },
      { rate: 25, baseCents: 960, taxCents: 240 },
    ]);
  });

  it('potpisani XML prolazi provjeru potpisa', () => {
    const xml = buildRacunZahtjev({
      oib: '69435151530', inVatSystem: true, issuedAt: new Date(), seq: 1, premise: 'PP1', device: '1',
      vat: [{ rate: 13, baseCents: 3186, taxCents: 414 }], totalCents: 3600, paymentMethod: 'K', operatorOib: '69435151530', zki: 'a'.repeat(32),
    });
    const signed = signXml(xml, cert);
    expect(signed).toContain('<X509SerialNumber>2587</X509SerialNumber>');
    expect(signed).toContain('rsa-sha1');
    const doc = new DOMParser().parseFromString(signed, 'text/xml');
    const sigNode = doc.getElementsByTagNameNS('http://www.w3.org/2000/09/xmldsig#', 'Signature')[0];
    const v = new SignedXml({ publicCert: cert.certPem });
    v.loadSignature(sigNode as any);
    expect(v.checkSignature(signed)).toBe(true);
  });

  it('čita JIR i greške iz odgovora CIS-a', () => {
    expect(parseCisResponse('<tns:RacunOdgovor><tns:Jir>a1b2-c3</tns:Jir></tns:RacunOdgovor>').jir).toBe('a1b2-c3');
    const e = parseCisResponse('<tns:Greske><tns:Greska><tns:SifraGreske>s004</tns:SifraGreske><tns:PorukaGreske>Neispravan potpis</tns:PorukaGreske></tns:Greska></tns:Greske>');
    expect(e).toEqual({ jir: null, errors: ['s004: Neispravan potpis'] });
  });

  it('izdaje račun za narudžbe stola, numerira redom, pada na naknadnu dostavu', async () => {
    const { db, deps, r } = await setup();
    await db.query(`update restaurants set fiscal_config = $2 where id = $1`, [r.id, JSON.stringify({
      enabled: true, env: 'demo', oib: '69435151530', inVatSystem: true, premise: 'PP1', device: '1',
    })]);
    let fail = false;
    const sentXml: string[] = [];
    const app = await buildApp(db, deps, {
      cisSender: async (url, soap) => {
        sentXml.push(soap);
        expect(url).toContain('cistest');
        if (fail) throw new Error('CIS nedostupan');
        return '<tns:Jir>jir-123</tns:Jir>';
      },
    });
    const { h, a, b } = await seedMenu(app);
    const o1 = (await app.inject({ method: 'POST', url: '/api/qr/qr3/orders', payload: { items: [{ menu_item_id: a.id, qty: 2 }, { menu_item_id: b.id, qty: 1 }] } })).json();

    // ruta koristi cert iz fiscal_config → bez .p12 mora javiti grešku
    const noCert = await app.inject({ method: 'POST', url: '/api/admin/konoba-test/invoices', headers: h, payload: { orderIds: [o1.id], paymentMethod: 'K', operatorOib: '69435151530' } });
    expect(noCert.json().error).toBe('no_cert');

    // učitaj test certifikat kao .p12
    const p12 = forge.pkcs12.toPkcs12Asn1(forge.pki.privateKeyFromPem(cert.privateKeyPem), [forge.pki.certificateFromPem(cert.certPem)], 'lozinka', { algorithm: '3des' });
    const p12b64 = forge.util.encode64(forge.asn1.toDer(p12).getBytes());
    await db.query(`update restaurants set fiscal_config = fiscal_config || $2::jsonb where id = $1`, [r.id, JSON.stringify({ p12Base64: p12b64, p12Password: 'lozinka' })]);

    const ok = await app.inject({ method: 'POST', url: '/api/admin/konoba-test/invoices', headers: h, payload: { orderIds: [o1.id], paymentMethod: 'K', operatorOib: '69435151530' } });
    expect(ok.statusCode).toBe(201);
    expect(ok.json()).toMatchObject({ seq: 1, jir: 'jir-123', fiscal_status: 'fiscalized', total_cents: 4800 });
    expect(sentXml[0]).toContain('<tns:IznosUkupno>48.00</tns:IznosUkupno>');
    expect(sentXml[0]).toContain('<tns:Stopa>25.00</tns:Stopa>');

    const again = await app.inject({ method: 'POST', url: '/api/admin/konoba-test/invoices', headers: h, payload: { orderIds: [o1.id], paymentMethod: 'K', operatorOib: '69435151530' } });
    expect(again.json().error).toBe('nothing_to_invoice');

    fail = true;
    const o2 = (await app.inject({ method: 'POST', url: '/api/qr/qr3/orders', payload: { items: [{ menu_item_id: b.id, qty: 1 }] } })).json();
    const failed = await app.inject({ method: 'POST', url: '/api/admin/konoba-test/invoices', headers: h, payload: { orderIds: [o2.id], paymentMethod: 'G', operatorOib: '69435151530' } });
    expect(failed.json()).toMatchObject({ seq: 2, fiscal_status: 'failed', jir: null });
    expect(failed.json().zki).toMatch(/^[0-9a-f]{32}$/);

    fail = false;
    const { resendFailed } = await import('../src/fiscal/invoices.js');
    expect(await resendFailed(db, { send: async (_u, soap) => { expect(soap).toContain('<tns:NakDost>true</tns:NakDost>'); return '<tns:Jir>jir-456</tns:Jir>'; } })).toBe(1);
  });
});
