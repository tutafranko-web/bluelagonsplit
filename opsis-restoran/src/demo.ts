import type { Db } from './db.js';

/** Demo restoran za lokalno isprobavanje i prezentacije klijentima. */
export async function seedDemo(db: Db) {
  const exists = (await db.query(`select id from restaurants where slug = 'demo-konoba'`)).rows[0];
  if (exists) return;
  const hours = [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({ weekday, open: '12:00', close: '23:00' }));
  const r = (await db.query(
    `insert into restaurants (slug, name, phone, email, address, opening_hours, admin_api_key, info_text, google_review_url)
     values ('demo-konoba','Konoba Demo','+385 21 000 000','demo@opsisdalmatia.com','Obala 1, Split',$1,'demo-key',
       'Parking: javna garaža 200 m. Psi dozvoljeni na terasi. Imamo dječje stolice. Veganske opcije: tjestenina s povrćem.',
       'https://g.page/r/demo/review') returning id`,
    [JSON.stringify(hours)],
  )).rows[0];
  await db.query(
    `insert into dining_tables (restaurant_id, label, zone, min_capacity, max_capacity, qr_token) values
      ($1,'1','unutra',1,2,'demo-qr-1'),($1,'2','unutra',1,2,'demo-qr-2'),($1,'3','unutra',2,4,'demo-qr-3'),
      ($1,'4','unutra',2,4,'demo-qr-4'),($1,'T1','terasa',2,4,'demo-qr-t1'),($1,'T2','terasa',4,8,'demo-qr-t2')`,
    [r.id],
  );
  const items: [string, any, number, number, string[]][] = [
    ['Predjela', { hr: 'Dalmatinski pršut i sir', en: 'Dalmatian prosciutto and cheese', de: 'Dalmatinischer Schinken und Käse' }, 1600, 13, ['mlijeko']],
    ['Glavna jela', { hr: 'Crni rižot', en: 'Black cuttlefish risotto', de: 'Schwarzes Risotto' }, 1800, 13, ['mekušci', 'mlijeko']],
    ['Glavna jela', { hr: 'Pašticada s njokima', en: 'Pašticada with gnocchi', de: 'Pašticada mit Gnocchi' }, 2200, 13, ['gluten', 'jaja', 'celer']],
    ['Glavna jela', { hr: 'Riba s gradela (kg)', en: 'Grilled fish (kg)', de: 'Gegrillter Fisch (kg)' }, 6500, 13, ['riba']],
    ['Deserti', { hr: 'Rožata', en: 'Rožata (custard pudding)', de: 'Rožata (Karamellpudding)' }, 600, 13, ['jaja', 'mlijeko']],
    ['Pića', { hr: 'Domaće crno vino 0,5 l', en: 'House red wine 0.5 l', de: 'Hauswein rot 0,5 l' }, 1200, 25, ['sumpor']],
    ['Pića', { hr: 'Mineralna voda 0,75 l', en: 'Sparkling water 0.75 l', de: 'Mineralwasser 0,75 l' }, 450, 25, []],
  ];
  let sort = 0;
  for (const [category, name, price, vat, allergens] of items) {
    await db.query(
      `insert into menu_items (restaurant_id, category, name, price_cents, vat_rate, allergens, sort) values ($1,$2,$3,$4,$5,$6,$7)`,
      [r.id, category, JSON.stringify(name), price, vat, JSON.stringify(allergens), sort++],
    );
  }
}
