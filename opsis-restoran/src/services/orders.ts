// Faza 2: QR meni po stolu, narudžbe, poziv konobara, zahtjev za račun.
import type { Db } from '../db.js';
import { AppError, type DiningTable } from './types.js';

export const EU_ALLERGENS = [
  'gluten', 'rakovi', 'jaja', 'riba', 'kikiriki', 'soja', 'mlijeko', 'orašasti plodovi',
  'celer', 'gorušica', 'sezam', 'sumpor', 'lupina', 'mekušci',
] as const;

export interface MenuItemInput {
  category: string;
  name: Record<string, string>;
  description?: Record<string, string>;
  price_cents: number;
  vat_rate?: number;
  allergens?: string[];
  available?: boolean;
  sort?: number;
}

export function validateMenuItem(m: MenuItemInput) {
  if (!m.category?.trim()) throw new AppError(400, 'category_required', 'Kategorija je obavezna');
  if (!m.name?.hr && !m.name?.en) throw new AppError(400, 'name_required', 'Naziv (hr ili en) je obavezan');
  if (!Number.isInteger(m.price_cents) || m.price_cents < 0) throw new AppError(400, 'bad_price', 'Cijena mora biti u centima');
  const bad = (m.allergens ?? []).filter((a) => !EU_ALLERGENS.includes(a as any));
  if (bad.length) throw new AppError(400, 'bad_allergen', `Nepoznati alergeni: ${bad.join(', ')}`);
}

export async function upsertMenuItem(db: Db, restaurantId: number, m: MenuItemInput, id?: number) {
  validateMenuItem(m);
  const vals = [
    restaurantId, m.category.trim(), JSON.stringify(m.name), JSON.stringify(m.description ?? {}), m.price_cents,
    m.vat_rate ?? 13, JSON.stringify(m.allergens ?? []), m.available ?? true, m.sort ?? 0,
  ];
  if (id) {
    const { rows } = await db.query(
      `update menu_items set category=$2, name=$3, description=$4, price_cents=$5, vat_rate=$6, allergens=$7, available=$8, sort=$9
        where id = $10 and restaurant_id = $1 returning *`, [...vals, id]);
    if (!rows[0]) throw new AppError(404, 'item_not_found', 'Stavka ne postoji');
    return rows[0];
  }
  return (
    await db.query(
      `insert into menu_items (restaurant_id, category, name, description, price_cents, vat_rate, allergens, available, sort)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *`, vals)
  ).rows[0];
}

/** Samo dostupnost ("nema više ribe") — smije i konobar, bez mijenjanja cijena. */
export async function setMenuItemAvailable(db: Db, restaurantId: number, id: number, available: boolean) {
  const { rows } = await db.query('update menu_items set available = $3 where id = $1 and restaurant_id = $2 returning *', [id, restaurantId, available]);
  if (!rows[0]) throw new AppError(404, 'item_not_found', 'Stavka ne postoji');
  return rows[0];
}

export async function publicMenu(db: Db, restaurantId: number) {
  return (
    await db.query(
      `select id, category, name, description, price_cents, allergens from menu_items
        where restaurant_id = $1 and available order by sort, category, id`, [restaurantId])
  ).rows;
}

export async function tableByQr(db: Db, qrToken: string): Promise<DiningTable & { slug: string; restaurant_name: string }> {
  const { rows } = await db.query(
    `select t.*, r.slug, r.name as restaurant_name from dining_tables t join restaurants r on r.id = t.restaurant_id
      where t.qr_token = $1 and t.active`, [qrToken]);
  if (!rows[0]) throw new AppError(404, 'table_not_found', 'Nepoznat QR kod');
  return rows[0];
}

export async function placeOrder(
  db: Db, qrToken: string,
  input: { kind?: 'order' | 'call_waiter' | 'request_bill'; items?: { menu_item_id: number; qty: number }[]; notes?: string },
) {
  const table = await tableByQr(db, qrToken);
  const kind = input.kind ?? 'order';
  if (!['order', 'call_waiter', 'request_bill'].includes(kind)) throw new AppError(400, 'bad_kind', 'Nepoznata vrsta zahtjeva');
  const items = kind === 'order' ? input.items ?? [] : [];
  if (kind === 'order') {
    if (!items.length) throw new AppError(400, 'empty_order', 'Narudžba je prazna');
    if (items.length > 50 || items.some((i) => !Number.isInteger(i.qty) || i.qty < 1 || i.qty > 50))
      throw new AppError(400, 'bad_qty', 'Neispravna količina');
  }
  return db.tx(async (t) => {
    // spam zaštita: najviše 10 zahtjeva po stolu u 10 minuta
    const recent = (await t.query(
      `select count(*)::int as n from orders where table_id = $1 and created_at > now() - interval '10 minutes'`, [table.id],
    )).rows[0].n;
    if (recent >= 10) throw new AppError(429, 'too_many', 'Previše zahtjeva, pozovite konobara');
    const ids = items.map((i) => i.menu_item_id);
    const menu = ids.length
      ? (await t.query(`select * from menu_items where restaurant_id = $1 and available and id = any($2)`, [table.restaurant_id, ids])).rows
      : [];
    const byId = new Map(menu.map((m: any) => [m.id, m]));
    const missing = ids.filter((id) => !byId.has(id));
    if (missing.length) throw new AppError(409, 'item_unavailable', 'Neka jela više nisu dostupna');
    const total = items.reduce((s, i) => s + (byId.get(i.menu_item_id) as any).price_cents * i.qty, 0);
    const order = (await t.query(
      `insert into orders (restaurant_id, table_id, kind, notes, total_cents) values ($1,$2,$3,$4,$5) returning *`,
      [table.restaurant_id, table.id, kind, (input.notes ?? '').slice(0, 500), total],
    )).rows[0];
    for (const i of items) {
      const m: any = byId.get(i.menu_item_id);
      await t.query(
        `insert into order_items (order_id, menu_item_id, name, qty, unit_price_cents, vat_rate) values ($1,$2,$3,$4,$5,$6)`,
        [order.id, m.id, m.name.hr ?? m.name.en, i.qty, m.price_cents, m.vat_rate],
      );
    }
    return { ...order, table_label: table.label };
  });
}

export async function openOrders(db: Db, restaurantId: number) {
  const orders = (await db.query(
    `select o.*, t.label as table_label from orders o join dining_tables t on t.id = o.table_id
      where o.restaurant_id = $1 and o.status in ('new','accepted') order by o.created_at`, [restaurantId])).rows;
  for (const o of orders) {
    o.items = (await db.query('select name, qty, unit_price_cents from order_items where order_id = $1 order by id', [o.id])).rows;
  }
  return orders;
}

export async function setOrderStatus(db: Db, restaurantId: number, id: number, status: string) {
  if (!['accepted', 'served', 'paid', 'cancelled'].includes(status)) throw new AppError(400, 'bad_status', 'Nedozvoljen status');
  const { rows } = await db.query('update orders set status = $3 where id = $1 and restaurant_id = $2 returning *', [id, restaurantId, status]);
  if (!rows[0]) throw new AppError(404, 'order_not_found', 'Narudžba ne postoji');
  return rows[0];
}
