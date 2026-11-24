import type { Db } from '../db.js';
import { AppError, type DiningTable, type Restaurant, type TableCombination } from './types.js';

/** Spojevi stolova s oznakama (npr. "1+2") za panel. */
export async function listCombinations(db: Db, r: Restaurant) {
  const tables = (await db.query<DiningTable>('select * from dining_tables where restaurant_id = $1', [r.id])).rows;
  const byId = new Map(tables.map((t) => [t.id, t]));
  const combos = (await db.query<TableCombination>('select * from table_combinations where restaurant_id = $1 order by id', [r.id])).rows;
  return combos.map((c) => ({
    ...c,
    label: c.table_ids.map((id) => byId.get(id)?.label ?? '?').join('+'),
    zone: byId.get(c.table_ids[0])?.zone ?? null,
  }));
}

export interface CombinationInput { table_ids?: unknown; min_capacity?: unknown; max_capacity?: unknown; active?: unknown }

/**
 * Novi spoj stolova. Stolovi moraju biti iz istog restorana i iste zone.
 * Zadano: kapacitet = zbroj stolova; koristi se tek za grupe veće od najvećeg stola u spoju.
 */
export async function createCombination(db: Db, r: Restaurant, b: CombinationInput) {
  const ids = Array.isArray(b.table_ids) ? [...new Set(b.table_ids.map(Number))] : [];
  if (ids.length < 2 || ids.some((n) => !Number.isInteger(n))) throw new AppError(400, 'bad_combo', 'Odaberite barem dva stola');
  const tables = (await db.query<DiningTable>('select * from dining_tables where restaurant_id = $1 and id = any($2)', [r.id, ids])).rows;
  if (tables.length !== ids.length) throw new AppError(400, 'bad_combo', 'Neki stol ne postoji');
  if (new Set(tables.map((t) => t.zone)).size > 1) throw new AppError(400, 'bad_combo', 'Spajaju se samo stolovi iz iste zone');
  const sum = tables.reduce((s, t) => s + t.max_capacity, 0);
  const max = b.max_capacity == null ? sum : Number(b.max_capacity);
  const min = b.min_capacity == null ? Math.max(...tables.map((t) => t.max_capacity)) + 1 : Number(b.min_capacity);
  if (!Number.isInteger(max) || !Number.isInteger(min) || min < 1 || max < min) throw new AppError(400, 'bad_combo', 'Neispravan kapacitet');
  const existing = (await db.query<TableCombination>('select table_ids from table_combinations where restaurant_id = $1', [r.id])).rows;
  const key = [...ids].sort((a, b) => a - b).join(',');
  if (existing.some((c) => [...c.table_ids].sort((a, b) => a - b).join(',') === key)) throw new AppError(409, 'combo_exists', 'Taj spoj već postoji');
  return (
    await db.query<TableCombination>(
      `insert into table_combinations (restaurant_id, table_ids, min_capacity, max_capacity) values ($1,$2,$3,$4) returning *`,
      [r.id, ids, min, max],
    )
  ).rows[0];
}

export async function updateCombination(db: Db, r: Restaurant, id: number, b: CombinationInput) {
  const cur = (await db.query<TableCombination>('select * from table_combinations where id = $1 and restaurant_id = $2', [id, r.id])).rows[0];
  if (!cur) throw new AppError(404, 'combo_not_found', 'Spoj ne postoji');
  const min = b.min_capacity == null ? cur.min_capacity : Number(b.min_capacity);
  const max = b.max_capacity == null ? cur.max_capacity : Number(b.max_capacity);
  if (!Number.isInteger(max) || !Number.isInteger(min) || min < 1 || max < min) throw new AppError(400, 'bad_combo', 'Neispravan kapacitet');
  const active = b.active == null ? cur.active : b.active === true;
  return (
    await db.query<TableCombination>(
      'update table_combinations set min_capacity = $2, max_capacity = $3, active = $4 where id = $1 returning *',
      [id, min, max, active],
    )
  ).rows[0];
}

/** Brisanje spoja ne dira postojeće rezervacije (one zadržavaju svoje stolove). */
export async function deleteCombination(db: Db, r: Restaurant, id: number) {
  const { rows } = await db.query('delete from table_combinations where id = $1 and restaurant_id = $2 returning id', [id, r.id]);
  if (!rows[0]) throw new AppError(404, 'combo_not_found', 'Spoj ne postoji');
  return { deleted: true };
}
