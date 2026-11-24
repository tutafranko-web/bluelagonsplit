// Faza 3: fiskalizacija računa u krajnjoj potrošnji (Porezna uprava, CIS).
//
// VAŽNO: modul je napisan prema tehničkoj specifikaciji CIS-a (shema f73, RSA-SHA1 potpis, ZKI = MD5 potpisa).
// Pravilnik o fiskalizaciji mijenjan je za 2026. (NN 153/2025, NN 97/26). Prije produkcije:
//   1. preuzmi aktualnu tehničku specifikaciju s porezna.gov.hr/fiskalizacija,
//   2. testiraj na DEMO okolini s FINA demo certifikatom,
//   3. tek onda uključi fiscal_config.enabled za pravog klijenta.
// Dok to nije napravljeno, modul je ISKLJUČEN po defaultu.

import { createHash, createSign, randomUUID } from 'node:crypto';
import https from 'node:https';
import forge from 'node-forge';
import { SignedXml } from 'xml-crypto';

export const CIS_DEMO_URL = 'https://cistest.apis-it.hr:8449/FiskalizacijaServiceTest';
export const CIS_PROD_URL = 'https://cis.porezna-uprava.hr:8449/FiskalizacijaService';

export interface FiscalCert { privateKeyPem: string; certPem: string; certBase64: string; issuerName: string; serialDecimal: string }

/** Učitava FINA .p12 certifikat (base64) i lozinku. */
export function loadP12(p12Base64: string, password: string): FiscalCert {
  const der = forge.util.decode64(p12Base64);
  const p12 = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(der), password);
  const keyBag = (p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag] ?? [])[0]
    ?? (p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag] ?? [])[0];
  const certBag = (p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag] ?? [])[0];
  if (!keyBag?.key || !certBag?.cert) throw new Error('U .p12 nema ključa ili certifikata');
  return certFromForge(keyBag.key as forge.pki.rsa.PrivateKey, certBag.cert);
}

export function certFromForge(key: forge.pki.rsa.PrivateKey, cert: forge.pki.Certificate): FiscalCert {
  const certPem = forge.pki.certificateToPem(cert);
  const certBase64 = certPem.replace(/-----(BEGIN|END) CERTIFICATE-----|\s/g, '');
  const issuerName = cert.issuer.attributes
    .slice().reverse()
    .map((a) => `${a.shortName ?? a.name}=${a.value}`)
    .join(',');
  return {
    privateKeyPem: forge.pki.privateKeyToPem(key),
    certPem, certBase64, issuerName,
    serialDecimal: BigInt('0x' + cert.serialNumber).toString(10),
  };
}

/** dd.MM.yyyy HH:mm:ss (za ZKI) i dd.MM.yyyyTHH:mm:ss (za XML), u lokalnom vremenu. */
export function fiscalDates(d: Date, timeZone = 'Europe/Zagreb') {
  const p = new Intl.DateTimeFormat('en-GB', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)!.value;
  const date = `${g('day')}.${g('month')}.${g('year')}`;
  const time = `${g('hour')}:${g('minute')}:${g('second')}`;
  return { zki: `${date} ${time}`, xml: `${date}T${time}` };
}

export function amount(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Zaštitni kod izdavatelja: MD5( RSA-SHA1( OIB + datum + broj + prostor + uređaj + iznos ) ). */
export function computeZki(p: {
  oib: string; issuedAt: Date; seq: number; premise: string; device: string; totalCents: number; privateKeyPem: string; timeZone?: string;
}): string {
  const data = `${p.oib}${fiscalDates(p.issuedAt, p.timeZone).zki}${p.seq}${p.premise}${p.device}${amount(p.totalCents)}`;
  const sig = createSign('RSA-SHA1').update(data, 'utf8').sign(p.privateKeyPem);
  return createHash('md5').update(sig).digest('hex');
}

export interface VatLine { rate: number; baseCents: number; taxCents: number }

/** Cijene su s PDV-om: rastavlja ukupno po stopama na osnovicu i porez. */
export function vatBreakdown(lines: { grossCents: number; rate: number }[]): VatLine[] {
  const byRate = new Map<number, number>();
  for (const l of lines) byRate.set(l.rate, (byRate.get(l.rate) ?? 0) + l.grossCents);
  return [...byRate.entries()].sort((a, b) => a[0] - b[0]).map(([rate, gross]) => {
    const base = Math.round(gross / (1 + rate / 100));
    return { rate, baseCents: base, taxCents: gross - base };
  });
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export interface RacunInput {
  oib: string; inVatSystem: boolean; issuedAt: Date; seq: number; premise: string; device: string;
  vat: VatLine[]; totalCents: number; paymentMethod: 'G' | 'K' | 'T' | 'O'; operatorOib: string; zki: string;
  lateDelivery?: boolean; timeZone?: string;
}

export function buildRacunZahtjev(i: RacunInput): string {
  const now = fiscalDates(new Date(), i.timeZone).xml;
  const issued = fiscalDates(i.issuedAt, i.timeZone).xml;
  const pdv = i.vat.length
    ? `<tns:Pdv>${i.vat.map((v) => `<tns:Porez><tns:Stopa>${v.rate.toFixed(2)}</tns:Stopa><tns:Osnovica>${amount(v.baseCents)}</tns:Osnovica><tns:Iznos>${amount(v.taxCents)}</tns:Iznos></tns:Porez>`).join('')}</tns:Pdv>`
    : '';
  return (
    `<tns:RacunZahtjev xmlns:tns="http://www.apis-it.hr/fin/2012/types/f73" Id="RacunZahtjev">` +
    `<tns:Zaglavlje><tns:IdPoruke>${randomUUID()}</tns:IdPoruke><tns:DatumVrijeme>${now}</tns:DatumVrijeme></tns:Zaglavlje>` +
    `<tns:Racun>` +
    `<tns:Oib>${esc(i.oib)}</tns:Oib>` +
    `<tns:USustPdv>${i.inVatSystem}</tns:USustPdv>` +
    `<tns:DatVrijeme>${issued}</tns:DatVrijeme>` +
    `<tns:OznSlijed>N</tns:OznSlijed>` +
    `<tns:BrRac><tns:BrOznRac>${i.seq}</tns:BrOznRac><tns:OznPosPr>${esc(i.premise)}</tns:OznPosPr><tns:OznNapUr>${esc(i.device)}</tns:OznNapUr></tns:BrRac>` +
    pdv +
    `<tns:IznosUkupno>${amount(i.totalCents)}</tns:IznosUkupno>` +
    `<tns:NacinPlac>${i.paymentMethod}</tns:NacinPlac>` +
    `<tns:OibOper>${esc(i.operatorOib)}</tns:OibOper>` +
    `<tns:ZastKod>${i.zki}</tns:ZastKod>` +
    `<tns:NakDost>${!!i.lateDelivery}</tns:NakDost>` +
    `</tns:Racun></tns:RacunZahtjev>`
  );
}

/** XML-DSig potpis (enveloped, exc-c14n, RSA-SHA1) kako ga traži CIS. */
export function signXml(xml: string, cert: FiscalCert): string {
  const sig = new SignedXml({
    privateKey: cert.privateKeyPem,
    publicCert: cert.certPem,
    signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
    canonicalizationAlgorithm: 'http://www.w3.org/2001/10/xml-exc-c14n#',
    getKeyInfoContent: () =>
      `<X509Data><X509Certificate>${cert.certBase64}</X509Certificate>` +
      `<X509IssuerSerial><X509IssuerName>${esc(cert.issuerName)}</X509IssuerName><X509SerialNumber>${cert.serialDecimal}</X509SerialNumber></X509IssuerSerial></X509Data>`,
  });
  sig.addReference({
    xpath: "/*[local-name(.)='RacunZahtjev']",
    transforms: ['http://www.w3.org/2000/09/xmldsig#enveloped-signature', 'http://www.w3.org/2001/10/xml-exc-c14n#'],
    digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
  });
  sig.computeSignature(xml, { location: { reference: "/*[local-name(.)='RacunZahtjev']", action: 'append' } });
  return sig.getSignedXml();
}

export function soapEnvelope(body: string): string {
  return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body>${body}</soapenv:Body></soapenv:Envelope>`;
}

export function parseCisResponse(xml: string): { jir: string | null; errors: string[] } {
  const jir = /<(?:\w+:)?Jir>([^<]+)<\/(?:\w+:)?Jir>/.exec(xml)?.[1] ?? null;
  const errors = [...xml.matchAll(/<(?:\w+:)?SifraGreske>([^<]+)<\/(?:\w+:)?SifraGreske>\s*<(?:\w+:)?PorukaGreske>([^<]*)<\/(?:\w+:)?PorukaGreske>/g)]
    .map((m) => `${m[1]}: ${m[2]}`);
  return { jir, errors };
}

export type CisSender = (url: string, soapXml: string) => Promise<string>;

/** Pravo slanje na CIS. caPem = lanac FINA certifikata ako ga sustav ne prepoznaje. */
export function httpsCisSender(caPem?: string): CisSender {
  return (url, soapXml) =>
    new Promise((resolve, reject) => {
      const req = https.request(url, {
        method: 'POST', ca: caPem, timeout: 10_000,
        headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: 'http://e-porezna.porezna-uprava.hr/fiskalizacija/2012/services/FiskalizacijaService/racuni' },
      }, (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve(body));
      });
      req.on('timeout', () => req.destroy(new Error('CIS timeout')));
      req.on('error', reject);
      req.end(soapXml);
    });
}
