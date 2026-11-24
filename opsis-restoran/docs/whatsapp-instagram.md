# WhatsApp i Instagram (Meta)

## Webhook (jedan za oba kanala)

Meta App → Webhooks:
- Callback URL: `https://TVOJA-DOMENA/webhooks/meta`
- Verify token: vrijednost `META_VERIFY_TOKEN`
- Pretplati se na `messages` (WhatsApp Business Account) i `messages` (Instagram).
- `META_APP_SECRET` = App secret (server provjerava potpis `x-hub-signature-256`).

## Spajanje restorana

U tablici `restaurants` upiši:
- `whatsapp_phone_number_id` — Phone number ID iz WhatsApp Managera (ne sam broj!)
- `instagram_account_id` — ID Instagram poslovnog računa

(Za sada SQL-om u Supabaseu; panel to još nema.)

## Predlošci poruka (moraju biti odobreni)

Poruke koje šaljemo sami (potvrda, podsjetnik…) idu kao **utility** predlošci. Napravi ih u WhatsApp Manageru, kategorija *Utility*, na jezicima hr, en, de. Svih 7 varijabli dolazi ovim redom:

`{{1}}` ime gosta · `{{2}}` restoran · `{{3}}` datum · `{{4}}` vrijeme · `{{5}}` broj osoba · `{{6}}` šifra · `{{7}}` link

| Ime predloška | Primjer teksta (hr) |
|---|---|
| `opsis_potvrda` | Poštovani/a {{1}}, rezervacija u {{2}} je potvrđena: {{3}} u {{4}}, {{5}} os. Šifra: {{6}}. Izmjena ili otkaz: {{7}} |
| `opsis_izmjena` | {{1}}, vaša rezervacija u {{2}} je izmijenjena: {{3}} u {{4}}, {{5}} os. Šifra {{6}}. {{7}} |
| `opsis_podsjetnik` | Podsjetnik, {{1}}: {{2}}, {{3}} u {{4}}, {{5}} os. (šifra {{6}}). Ako ne možete doći, otkažite: {{7}} |
| `opsis_otkaz` | {{1}}, rezervacija {{6}} u {{2}} za {{3}} u {{4}} ({{5}} os.) je otkazana. {{7}} |
| `opsis_garancija` | {{1}}, za potvrdu rezervacije u {{2}} ({{3}} u {{4}}, {{5}} os., šifra {{6}}) ostavite karticu kao garanciju: {{7}} |
| `opsis_recenzija` | Hvala na posjetu, {{1}}! Ako vam se svidjelo u {{2}}, ostavite nam recenziju: {{7}} ({{3}} {{4}}, {{5}} os., {{6}}) |

Meta traži da se sve varijable pojave u tekstu, zato su u zadnjim predlošcima "nepotrebne" varijable na kraju. Ako želiš kraće tekstove, promijeni `params` u `src/services/notifications.ts`.

## Troškovi

- Odgovori unutar 24 h od gostove poruke su *service* poruke: 1.000 mjesečno besplatno po broju, nakon toga se naplaćuju (od 1.10.2026.).
- Predlošci (potvrda, podsjetnik) se naplaćuju kao utility.
- Ako gost ima email, šalje se i email (besplatno) — za uštedu možeš u `enqueueGuestMessage` slati WhatsApp samo kad nema emaila.
