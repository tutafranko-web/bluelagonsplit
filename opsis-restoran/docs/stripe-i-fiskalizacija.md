# Stripe (garancija karticom) i fiskalizacija

## Stripe Connect

Novac od no-show naknada ide **izravno restoranu**, ne tebi. Zato koristimo Stripe Connect:

1. Na svom Stripe računu uključi Connect (platforma) i u Connect postavkama uključi Express račune (zemlja: Hrvatska).
2. Vlasnik restorana u panelu: *Postavke → Kanali i plaćanje → Spoji Stripe*. Server napravi Express račun (`acct_...`),
   vlasnik na Stripeu upiše podatke tvrtke i IBAN i vrati se u panel (panel sam provjeri stanje).
   Stanje: *nije spojen* → *čeka podatke na Stripeu* → *spojen, naplata radi*.
3. U panelu uključi "Garancija karticom". Garancija se traži tek kad je stanje *spojen, naplata radi*
   (do tada rezervacije prolaze bez kartice).
4. Webhook: Stripe → Developers → Webhooks → endpoint `https://TVOJA-DOMENA/webhooks/stripe`,
   događaji `checkout.session.completed` i `account.updated`, **"Listen to events on Connected accounts"**. Secret u `STRIPE_WEBHOOK_SECRET`.

Postojeći račun (npr. Standard) i dalje se može upisati ručno: `update restaurants set stripe_account_id = 'acct_...', stripe_charges_enabled = true where slug = '...'`.

Tok: gost rezervira → dobije link (Stripe Checkout, setup mode) → ostavi karticu → rezervacija `confirmed`.
Ako ne ostavi karticu u 30 min → `expired`, stol se oslobađa. Osoblje u panelu klikne "Nije došao" → naplata `no_show_fee_cents × broj osoba`.

Bez kartica se nikad ne spremaju brojevi — samo Stripe tokeni.

> Uvjete garancije (iznos, rok otkaza) restoran mora jasno navesti gostu prije rezervacije. Tekst je u `src/services/messages.ts`.

## Fiskalizacija (faza 3) — STATUS: napisano i testirano lokalno, NIJE testirano na CIS-u

Što radi:
- ZKI (MD5 RSA-SHA1 potpisa), XML `RacunZahtjev` (shema f73), XML-DSig potpis, slanje na CIS, čitanje JIR-a.
- Numeracija po prostoru i uređaju, kreće od 1 svake godine.
- Ako CIS ne odgovori: račun se izdaje sa ZKI-jem i kasnije šalje kao naknadna dostava (svakih 10 min).

Što mora proći prije prvog pravog računa:
1. Preuzmi aktualnu tehničku specifikaciju s porezna.gov.hr (pravilnik je mijenjan za 2026.).
2. Nabavi **FINA demo certifikat** i postavi `fiscal_config` s `"env": "demo"`.
3. Pošalji 20+ testnih računa na `cistest.apis-it.hr` i provjeri JIR-ove.
4. Nedostaje: porez na potrošnju (PNP) za alkohol, storno računa, ispis računa (printer/PDF), prijava poslovnog prostora.
5. Tek onda `env: "prod"` i `FISCAL_ENABLED=true`.

Iskreno: do 20+ klijenata isplativije je ostaviti restoranu postojeću blagajnu (Remaris, EasyLazy…).
