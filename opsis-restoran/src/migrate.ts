import { createPgDb, migrate } from './db.js';
const url = process.env.DATABASE_URL;
if (!url) throw new Error('Postavi DATABASE_URL');
const db = createPgDb(url);
await migrate(db);
await db.close();
console.log('Migracije gotove');
