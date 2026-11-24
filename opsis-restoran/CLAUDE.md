# Upute za Claude Code

Projekt: Opsis Restoran — multi-tenant sustav za restorane (rezervacije, AI chatbot, voice agent, QR narudžbe, fiskalizacija). Vlasnik: Franko (Opsis Dalmatia). Komunikacija i tekstovi za korisnike na hrvatskom.

## Pravila
- Node 22 + TypeScript (ESM, `.js` u importima), Fastify, Postgres (Supabase u produkciji, PGlite u testovima).
- Nakon svake promjene: `npm run typecheck && npm test`. Ne commitaj ako testovi padaju.
- Sva poslovna logika ide u `src/services` ili `src/ai/tools.ts`; rute u `src/server.ts` samo čitaju zahtjev i zovu servise.
- Chatbot i voice agent MORAJU koristiti iste alate (`executeTool`), da web/chat/telefon rade isto.
- Vrijeme: u bazi UTC (`timestamptz`), prema gostu lokalno preko `src/time.ts` (Europe/Zagreb).
- Nikad ne spremaj brojeve kartica; samo Stripe tokene.
- Fiskalizacija je isključena dok se ne testira na CIS demo okolini — ne uključuj je bez Frankove potvrde.
- Upit za Google recenziju po defaultu traži odobrenje osoblja (review_mode = 'approval'); nikad ga ne šalji gostu koji nije bio (status seated/completed).
- Admin rute: `admin(req)` = svi prijavljeni (konobar i vlasnik), `admin(req, 'owner')` = samo vlasnik. Nove rute koje mijenjaju postavke, stolove, meni ili korisnike moraju biti 'owner'.
- Ne mijenjaj tekstove poruka gostima bez provjere sva tri jezika (hr/en/de) u `src/services/messages.ts`.

## Sljedeći zadaci (po prioritetu)
1. Deploy na Hostinger VPS (`docker compose up -d --build`), Supabase baza, domena u `Caddyfile`.
2. Spojiti prave ključeve (.env) i proći ručni test: web rezervacija, WhatsApp poruka, Retell poziv.
3. ~~Panel: polja za WhatsApp phone number ID, Instagram ID, Stripe Connect onboarding link.~~ ✅
4. ~~Spajanje stolova za veće grupe.~~ ✅ (spojevi koje definira osoblje)
5. ~~Korisnici panela (vlasnik/konobar) umjesto jednog ključa.~~ ✅ (ključ restorana i dalje radi kao vlasnik)
6. Fiskalizacija: test na CIS demo, PNP, storno, ispis računa.
