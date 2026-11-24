# Voice agent (Retell) — postavljanje

Voice agent koristi **iste alate** kao chatbot. Retell vodi razgovor (govor ↔ tekst, LLM), a za svaku radnju zove tvoj server.

## 1. Broj telefona

Preporuka: restoran **zadrži svoj broj** i uključi preusmjeravanje kod operatera (A1/Telemach/HT):
- "preusmjeri kad je zauzeto" i "kad se ne javi nakon 20 s" → na Retell broj.
- Tako osoblje i dalje prima pozive, a AI uskače samo kad oni ne stignu. Ako klijent ode, samo isključi preusmjeravanje.

Hrvatski broj (+385) u Retellu ide preko Twilija ili vlastitog SIP trunka. Twilio za HR broj traži izvadak iz sudskog registra i dokaz adrese na području pozivnog broja.

## 2. Agent u Retellu

- **Jezik:** Multilingual (hr + en + de). Prije prodaje testiraj 20 poziva s hrvatskim imenima i datumima.
- **Glas:** neki ElevenLabs glas koji dobro izgovara hrvatski.
- **Inbound webhook** (Phone number → Inbound call webhook):
  `POST https://TVOJA-DOMENA/voice/retell/SLUG/inbound?secret=VOICE_SHARED_SECRET`
  Vraća varijable `{{restaurant_name}}`, `{{today}}`, `{{now_time}}`, `{{restaurant_phone}}`, `{{max_party_size}}`.

## 3. Prompt agenta (zalijepi u Retell → Prompt)

```
Ti si AI asistent restorana {{restaurant_name}}. Danas je {{today}}, sada je {{now_time}}.
Na početku reci: "Dobar dan, {{restaurant_name}}, ovdje AI asistent. Kako vam mogu pomoći?"
Govori kratko, jednom do dvije rečenice. Ako gost govori engleski ili njemački, prebaci se na taj jezik.

Pravila:
- Nikad ne izmišljaj slobodne termine — uvijek pozovi check_availability.
- Za rezervaciju trebaš datum, vrijeme, broj osoba i ime. Broj mobitela već imaš od poziva — pitaj samo
  "Da vam potvrdu pošaljemo na ovaj broj?". Ako gost želi drugi broj, uzmi ga i pošalji u polju phone.
- Prije create_reservation ponovi: dan, vrijeme, broj osoba i ime, i pričekaj "da".
- Ako termin nije slobodan, ponudi dva-tri najbliža iz rezultata alata.
- Šifru rezervacije sriči slovo po slovo.
- Za otkaz ili izmjenu: pozovi find_reservations (broj pozivatelja se koristi automatski).
- Za grupe veće od {{max_party_size}}, događaje, pritužbe ili ako gost traži osobu: reci da će ih
  nazvati osoblje ili da nazovu {{restaurant_phone}} (ili koristi transfer_call ako je podešen).
- Za alergije: navedi alergene iz menija (get_restaurant_info), ali reci da obavezno upozore konobara.
```

## 4. Funkcije (Retell → Functions → Custom function)

Za **svaku** funkciju:
- URL: `https://TVOJA-DOMENA/voice/retell/SLUG`
- Header: `x-opsis-secret: VOICE_SHARED_SECRET`
- Ime funkcije mora biti točno kao dolje (server ga čita iz polja `name`).

| Ime | Parametri (JSON schema) |
|---|---|
| `get_restaurant_info` | `{}` |
| `check_availability` | `date` (GGGG-MM-DD), `party_size` (integer), `preferred_time` (HH:MM, opcionalno), `zone` (opcionalno) |
| `create_reservation` | `name`, `party_size`, `date`, `time`, `phone` (opc.), `notes` (opc.), `language` (hr/en/de) |
| `find_reservations` | `phone` (opcionalno — inače broj pozivatelja) |
| `cancel_reservation` | `code`, `phone_or_email` (opcionalno) |
| `modify_reservation` | `code`, `date`, `time`, `party_size` (sve opcionalno osim code) |

Točne opise parametara kopiraj iz `src/ai/tools.ts` (`TOOL_DEFINITIONS`).

> Provjeri u Retell dokumentaciji format tijela zahtjeva za custom funkcije (`name`, `args`, `call.from_number`). Server to očekuje; ako Retell promijeni format, prilagodi rutu `/voice/retell/:slug` u `src/server.ts`.

## 5. Test

1. Nazovi broj, rezerviraj stol za sutra.
2. Provjeri da se pojavio u panelu (`/admin`, izvor "telefon AI").
3. Nazovi ponovno i otkaži — agent mora pronaći rezervaciju po tvom broju.
4. Zapiši trajanje poziva u Retellu → to je tvoj trošak po rezervaciji.
