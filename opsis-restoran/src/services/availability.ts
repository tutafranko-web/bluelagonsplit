import type { Db } from '../db.js';
import { AppError, BLOCKING_STATUSES, type DiningTable, type Restaurant } from './types.js';
import { fromMinutes, isValidDate, localToUtc, toMinutes, utcToLocal, weekdayOf } from '../time.js';

/** Zadnje primanje gostiju = zatvaranje − 60 min. */
export const LAST_SEATING_BEFORE_CLOSE = 60;

export async function getRestaurantBySlug(db: Db, slug: string): Promise<Restaurant> {
  const { rows } = await db.query<Restaurant>('select * from restaurants where slug = $1', [slug]);
  if (!rows[0]) throw new AppError(404, 'restaurant_not_found', 'Restoran ne postoji');
  return rows[0];
}

/** Prozori rada za datum, u minutama od ponoći tog datuma (kraj može biti > 1440 ako radi iza ponoći). */
export function openingWindows(r: Restaurant, date: string): { start: number; end: number }[] {
  if (r.closed_dates.includes(date)) return [];
  const wd = weekdayOf(date);
  return r.opening_hours
    .filter((p) => p.weekday === wd)
    .map((p) => {
      const start = toMinutes(p.open);
      let end = toMinutes(p.close);
      if (end <= start) end += 1440;
      return { start, end };
    });
}

/** Vrijeme početka (minute od ponoći) → lokalni datum + vrijeme, uz prelazak preko ponoći. */
function slotToLocal(date: string, minutes: number): { date: string; time: string } {
  if (minutes < 1440) return { date, time: fromMinutes(minutes) };
  const [y, m, d] = date.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
  return { date: next, time: fromMinutes(minutes - 1440) };
}

interface BusyInterval { table_id: number; start: number; end: number; reservation_id: number }

async function loadDay(db: Db, r: Restaurant, date: string) {
  const tables = (
    await db.query<DiningTable>(
      'select * from dining_tables where restaurant_id = $1 and active order by max_capacity, id',
      [r.id],
    )
  ).rows;
  // učitaj od 00:00 dana do 12:00 sljedećeg (zbog rada iza ponoći)
  const from = localToUtc(date, '00:00', r.timezone);
  const to = new Date(from.getTime() + 36 * 3600_000);
  const busy = (
    await db.query<{ id: number; table_id: number; start_at: Date; end_at: Date }>(
      `select id, table_id, start_at, end_at from reservations
        where restaurant_id = $1 and table_id is not null
          and status = any($2) and start_at < $4 and end_at > $3`,
      [r.id, BLOCKING_STATUSES, from, to],
    )
  ).rows.map<BusyInterval>((x) => ({
    table_id: x.table_id,
    reservation_id: x.id,
    start: new Date(x.start_at).getTime(),
    end: new Date(x.end_at).getTime(),
  }));
  return { tables, busy };
}

function freeTable(
  tables: DiningTable[], busy: BusyInterval[], partySize: number,
  startMs: number, endMs: number, zone?: string, excludeReservationId?: number,
): DiningTable | null {
  // najmanji stol koji odgovara (tablice su sortirane po kapacitetu)
  for (const t of tables) {
    if (zone && t.zone !== zone) continue;
    if (partySize < t.min_capacity || partySize > t.max_capacity) continue;
    const clash = busy.some(
      (b) => b.table_id === t.id && b.reservation_id !== excludeReservationId && b.start < endMs && b.end > startMs,
    );
    if (!clash) return t;
  }
  return null;
}

export interface Slot { date: string; time: string; zones: string[] }

export async function findAvailability(
  db: Db, r: Restaurant,
  opts: { date: string; partySize: number; zone?: string; now?: Date },
): Promise<Slot[]> {
  if (!isValidDate(opts.date)) throw new AppError(400, 'bad_date', 'Datum mora biti u obliku GGGG-MM-DD');
  if (!(opts.partySize >= 1)) throw new AppError(400, 'bad_party', 'Broj osoba mora biti barem 1');
  if (opts.partySize > r.max_party_size) return [];
  const now = (opts.now ?? new Date()).getTime();
  const { tables, busy } = await loadDay(db, r, opts.date);
  const zones = [...new Set(tables.map((t) => t.zone))];
  const out: Slot[] = [];
  for (const w of openingWindows(r, opts.date)) {
    for (let m = w.start; m <= w.end - LAST_SEATING_BEFORE_CLOSE; m += r.slot_minutes) {
      const local = slotToLocal(opts.date, m);
      const start = localToUtc(local.date, local.time, r.timezone).getTime();
      if (start < now + 30 * 60_000) continue; // najmanje 30 min unaprijed
      const end = start + r.default_duration_minutes * 60_000;
      const okZones = zones.filter((z) => (!opts.zone || z === opts.zone) && freeTable(tables, busy, opts.partySize, start, end, z));
      if (okZones.length) out.push({ ...local, zones: okZones });
    }
  }
  return out;
}

/** Provjerava je li vrijeme unutar radnog vremena i vraća slobodan stol (ili null). */
export async function pickTable(
  db: Db, r: Restaurant,
  opts: { date: string; time: string; partySize: number; zone?: string; excludeReservationId?: number },
): Promise<{ table: DiningTable | null; start: Date; end: Date; withinHours: boolean }> {
  const start = localToUtc(opts.date, opts.time, r.timezone);
  const end = new Date(start.getTime() + r.default_duration_minutes * 60_000);
  const m = toMinutes(opts.time);
  // vrijeme može pripadati današnjem prozoru ili jučerašnjem koji radi iza ponoći
  const [y, mo, d] = opts.date.split('-').map(Number);
  const prev = new Date(Date.UTC(y, mo - 1, d - 1)).toISOString().slice(0, 10);
  const withinHours =
    openingWindows(r, opts.date).some((w) => m >= w.start && m <= w.end - LAST_SEATING_BEFORE_CLOSE) ||
    openingWindows(r, prev).some((w) => m + 1440 >= w.start && m + 1440 <= w.end - LAST_SEATING_BEFORE_CLOSE);
  const { tables, busy } = await loadDay(db, r, utcToLocal(new Date(start.getTime() - 12 * 3600_000), r.timezone).date);
  const table = withinHours
    ? freeTable(tables, busy, opts.partySize, start.getTime(), end.getTime(), opts.zone, opts.excludeReservationId)
    : null;
  return { table, start, end, withinHours };
}
