// Alati koje koriste i chatbot (Claude) i voice agent (Retell custom functions). Ista logika za sve kanale.
import type { Db } from '../db.js';
import type { Deps } from '../deps.js';
import { findAvailability } from '../services/availability.js';
import {
  cancelReservation, createReservation, findUpcomingByPhone, modifyReservation, getByCode, verifyGuest,
} from '../services/reservations.js';
import { AppError, type Restaurant } from '../services/types.js';
import { toMinutes, utcToLocal } from '../time.js';
import { formatEur } from '../services/messages.js';

const DAYS_HR = ['', 'ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota', 'nedjelja'];

export const TOOL_DEFINITIONS = [
  {
    name: 'get_restaurant_info',
    description: 'Vraća adresu, telefon, radno vrijeme, napomene (parking, ljubimci...) i meni s cijenama i alergenima. Pozovi prije odgovora na pitanja o restoranu.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'check_availability',
    description: 'Provjerava slobodne termine za datum i broj osoba. Uvijek pozovi prije nego gostu kažeš da je nešto slobodno.',
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Datum GGGG-MM-DD' },
        party_size: { type: 'integer', description: 'Broj osoba' },
        preferred_time: { type: 'string', description: 'Željeno vrijeme HH:MM (opcionalno)' },
        zone: { type: 'string', description: 'Zona, npr. "terasa" ili "unutra" (opcionalno)' },
      },
      required: ['date', 'party_size'],
    },
  },
  {
    name: 'create_reservation',
    description: 'Kreira rezervaciju. Pozovi tek kad je gost potvrdio datum, vrijeme, broj osoba, ime i kontakt.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        phone: { type: 'string', description: 'Mobitel gosta (preporučeno, za WhatsApp potvrdu)' },
        email: { type: 'string' },
        party_size: { type: 'integer' },
        date: { type: 'string', description: 'GGGG-MM-DD' },
        time: { type: 'string', description: 'HH:MM' },
        zone: { type: 'string' },
        notes: { type: 'string', description: 'Posebne želje: alergije, rođendan, dječja stolica...' },
        language: { type: 'string', enum: ['hr', 'en', 'de'], description: 'Jezik na kojem gost razgovara' },
      },
      required: ['name', 'party_size', 'date', 'time'],
    },
  },
  {
    name: 'find_reservations',
    description: 'Pronalazi buduće rezervacije gosta po broju mobitela.',
    input_schema: { type: 'object', properties: { phone: { type: 'string' } }, required: [] },
  },
  {
    name: 'cancel_reservation',
    description: 'Otkazuje rezervaciju. Treba šifra rezervacije i mobitel ili email s kojim je napravljena.',
    input_schema: {
      type: 'object',
      properties: { code: { type: 'string' }, phone_or_email: { type: 'string' } },
      required: ['code'],
    },
  },
  {
    name: 'modify_reservation',
    description: 'Mijenja datum, vrijeme ili broj osoba postojeće rezervacije.',
    input_schema: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        phone_or_email: { type: 'string' },
        date: { type: 'string' },
        time: { type: 'string' },
        party_size: { type: 'integer' },
      },
      required: ['code'],
    },
  },
] as const;

export interface ToolContext {
  source: 'chat' | 'whatsapp' | 'instagram' | 'voice';
  /** Broj s kojeg gost zove ili piše (WhatsApp / voice) — koristi se kao kontakt i za provjeru identiteta. */
  callerPhone?: string | null;
}

function hoursText(r: Restaurant): string {
  const byDay = new Map<number, string[]>();
  for (const p of r.opening_hours) byDay.set(p.weekday, [...(byDay.get(p.weekday) ?? []), `${p.open}–${p.close}`]);
  return [1, 2, 3, 4, 5, 6, 7].map((d) => `${DAYS_HR[d]}: ${byDay.get(d)?.join(', ') ?? 'zatvoreno'}`).join('; ');
}

async function restaurantInfo(db: Db, r: Restaurant) {
  const menu = (
    await db.query(`select category, name, price_cents, allergens from menu_items where restaurant_id = $1 and available order by sort, id`, [r.id])
  ).rows.map((m: any) => ({
    category: m.category, name: m.name.hr ?? Object.values(m.name)[0], name_en: m.name.en, price: formatEur(m.price_cents), allergens: m.allergens,
  }));
  return {
    name: r.name, address: r.address, phone: r.phone, opening_hours: hoursText(r),
    closed_dates: r.closed_dates, max_party_size_online: r.max_party_size, notes: r.info_text, menu,
    no_show_policy: r.guarantee_mode === 'card'
      ? `Za ${r.guarantee_min_party}+ osoba traži se kartica kao garancija; nedolazak se naplaćuje ${formatEur(r.no_show_fee_cents)} po osobi.`
      : 'Nema garancije karticom.',
  };
}

export async function executeTool(
  db: Db, deps: Deps, r: Restaurant, name: string, input: any, ctx: ToolContext,
): Promise<Record<string, unknown>> {
  try {
    switch (name) {
      case 'get_restaurant_info':
        return await restaurantInfo(db, r);

      case 'check_availability': {
        const slots = await findAvailability(db, r, {
          date: input.date, partySize: Number(input.party_size), zone: input.zone || undefined, now: deps.now(),
        });
        let times = slots.map((s) => ({ time: s.time, date: s.date, zones: s.zones }));
        if (input.preferred_time && /^\d{2}:\d{2}$/.test(input.preferred_time)) {
          const p = toMinutes(input.preferred_time);
          times = times.sort((a, b) => Math.abs(toMinutes(a.time) - p) - Math.abs(toMinutes(b.time) - p)).slice(0, 6)
            .sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
        }
        const exact = input.preferred_time ? times.some((t) => t.time === input.preferred_time) : undefined;
        return { date: input.date, party_size: input.party_size, preferred_time_available: exact, available_times: times.slice(0, 12), total_available: slots.length };
      }

      case 'create_reservation': {
        const { reservation, guaranteeUrl } = await createReservation(db, deps, r, {
          name: input.name, phone: input.phone || ctx.callerPhone || null, email: input.email || null,
          partySize: Number(input.party_size), date: input.date, time: input.time, zone: input.zone || null,
          notes: input.notes || null, language: input.language || null, source: ctx.source,
        });
        const local = utcToLocal(new Date(reservation.start_at), r.timezone);
        return {
          ok: true, code: reservation.code, status: reservation.status, date: local.date, time: local.time, party_size: reservation.party_size,
          guarantee_required: !!guaranteeUrl,
          guarantee_url: guaranteeUrl,
          note: guaranteeUrl
            ? 'Rezervacija čeka garanciju karticom. Link je poslan gostu porukom i vrijedi 30 minuta.'
            : 'Potvrda je poslana gostu porukom.',
        };
      }

      case 'find_reservations': {
        const phone = input.phone || ctx.callerPhone;
        if (!phone) return { error: 'phone_required', message: 'Treba broj mobitela s kojim je rezervacija napravljena.' };
        const list = await findUpcomingByPhone(db, r, phone, deps.now());
        return {
          reservations: list.map((x) => ({ code: x.code, ...utcToLocal(new Date(x.start_at), r.timezone), party_size: x.party_size, status: x.status })),
        };
      }

      case 'cancel_reservation': {
        const contact = input.phone_or_email || ctx.callerPhone;
        const res = await cancelReservation(db, deps, r, input.code, contact);
        return { ok: true, code: res.code, status: res.status };
      }

      case 'modify_reservation': {
        const contact = input.phone_or_email || ctx.callerPhone;
        // provjera prije izmjene, da greška bude jasna
        await verifyGuest(db, await getByCode(db, r, input.code), contact);
        const res = await modifyReservation(db, deps, r, input.code, contact, {
          date: input.date || undefined, time: input.time || undefined, partySize: input.party_size ? Number(input.party_size) : undefined,
        });
        const local = utcToLocal(new Date(res.start_at), r.timezone);
        return { ok: true, code: res.code, date: local.date, time: local.time, party_size: res.party_size };
      }

      default:
        return { error: 'unknown_tool', message: `Nepoznat alat ${name}` };
    }
  } catch (e: any) {
    if (e instanceof AppError) {
      return { error: e.code, message: e.message, ...(e as any).alternatives ? { alternatives: (e as any).alternatives.slice(0, 8) } : {} };
    }
    throw e;
  }
}

export function buildSystemPrompt(r: Restaurant, now: Date, channel: ToolContext['source']): string {
  const local = utcToLocal(now, r.timezone);
  const voice = channel === 'voice';
  return [
    `Ti si AI asistent restorana "${r.name}"${r.address ? ` (${r.address})` : ''}. Primaš rezervacije i odgovaraš na pitanja gostiju.`,
    `Danas je ${DAYS_HR[local.weekday]}, ${local.date}, ${local.time} po lokalnom vremenu (${r.timezone}). "Sutra", "u subotu" i sl. preračunaj u točan datum.`,
    'Odgovaraj na jeziku na kojem ti gost piše ili govori (hrvatski, engleski, njemački ili drugi).',
    'Pravila:',
    '- Na početku razgovora reci da si AI asistent (osim ako si to već rekao).',
    '- Nikad ne izmišljaj slobodne termine, cijene ni jela: uvijek koristi alate.',
    '- Za rezervaciju trebaš: datum, vrijeme, broj osoba, ime i broj mobitela (ili email). Prije kreiranja ukratko ponovi podatke i pitaj gosta da potvrdi.',
    '- Ako termin nije slobodan, ponudi najbliže slobodne termine iz alata.',
    `- Za grupe veće od ${r.max_party_size} osoba, događaje ili pritužbe uputi gosta na telefon restorana ${r.phone ?? ''}.`,
    '- Za alergije: navedi alergene iz menija, ali reci da gost obavezno upozori konobara.',
    '- Za otkaz ili izmjenu treba šifra rezervacije i mobitel/email s kojim je napravljena; ako gost nema šifru, potraži rezervacije po mobitelu.',
    '- Ne odgovaraj na pitanja koja nemaju veze s restoranom.',
    voice
      ? '- Ovo je telefonski poziv: govori kratko (1–2 rečenice), datume i vremena izgovaraj prirodno ("u subotu u pola osam"), šifru rezervacije sriči slovo po slovo. Broj s kojeg gost zove već imaš — pitaj samo želi li da potvrdu pošaljemo na taj broj.'
      : '- Piši kratko i jasno, bez dugih lista. Šifru rezervacije uvijek napiši.',
  ].join('\n');
}
