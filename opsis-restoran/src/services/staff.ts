import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { Db } from '../db.js';
import { AppError, type Restaurant, type StaffRole } from './types.js';

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

/** Prijava konobara traje 30 dana (tablet u sali ne treba se stalno prijavljivati). */
export const SESSION_DAYS = 30;
const ROLES: StaffRole[] = ['owner', 'waiter'];

export interface StaffIdentity {
  role: StaffRole;
  userId: number | null;   // null = prijava ključem restorana (admin_api_key)
  name: string;
  username: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 32);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [alg, salt, hash] = stored.split('$');
  if (alg !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const got = await scrypt(password, Buffer.from(salt, 'base64'), expected.length);
  return timingSafeEqual(got, expected);
}

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a), bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

function cleanUsername(u: unknown): string {
  const s = String(u ?? '').trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,32}$/.test(s)) throw new AppError(400, 'bad_username', 'Korisničko ime: 3–32 znaka, mala slova, brojke, . _ -');
  return s;
}

function checkPassword(p: unknown): string {
  const s = String(p ?? '');
  if (s.length < 8) throw new AppError(400, 'weak_password', 'Lozinka mora imati barem 8 znakova');
  if (s.length > 200) throw new AppError(400, 'bad_password', 'Lozinka je predugačka');
  return s;
}

function checkRole(r: unknown): StaffRole {
  if (!ROLES.includes(r as StaffRole)) throw new AppError(400, 'bad_role', 'Uloga: owner (vlasnik) ili waiter (konobar)');
  return r as StaffRole;
}

const DUMMY_HASH = `scrypt$${Buffer.alloc(16).toString('base64')}$${Buffer.alloc(32).toString('base64')}`;
const PUBLIC_COLS = 'id, username, name, role, active, created_at';

export async function listUsers(db: Db, r: Restaurant) {
  return (await db.query(`select ${PUBLIC_COLS} from staff_users where restaurant_id = $1 order by role, name`, [r.id])).rows;
}

export async function createUser(db: Db, r: Restaurant, b: { username?: unknown; name?: unknown; role?: unknown; password?: unknown }) {
  const username = cleanUsername(b.username);
  const name = String(b.name ?? '').trim() || username;
  const role = checkRole(b.role ?? 'waiter');
  const hash = await hashPassword(checkPassword(b.password));
  try {
    return (
      await db.query(
        `insert into staff_users (restaurant_id, username, name, role, password_hash) values ($1,$2,$3,$4,$5) returning ${PUBLIC_COLS}`,
        [r.id, username, name, role, hash],
      )
    ).rows[0];
  } catch (e: any) {
    if (String(e?.message).includes('staff_users_restaurant_id_username_key')) throw new AppError(409, 'username_taken', 'To korisničko ime već postoji');
    throw e;
  }
}

/** Izmjena korisnika. Promjena lozinke, uloge ili deaktivacija odjavljuje korisnika sa svih uređaja. */
export async function updateUser(db: Db, r: Restaurant, id: number, b: { name?: unknown; role?: unknown; password?: unknown; active?: unknown }) {
  const cur = (await db.query('select * from staff_users where id = $1 and restaurant_id = $2', [id, r.id])).rows[0];
  if (!cur) throw new AppError(404, 'user_not_found', 'Korisnik ne postoji');
  const name = b.name == null ? cur.name : String(b.name).trim() || cur.name;
  const role = b.role == null ? cur.role : checkRole(b.role);
  const active = b.active == null ? cur.active : b.active === true;
  const hash = b.password == null || b.password === '' ? cur.password_hash : await hashPassword(checkPassword(b.password));
  const row = (
    await db.query(
      `update staff_users set name = $2, role = $3, active = $4, password_hash = $5 where id = $1 returning ${PUBLIC_COLS}`,
      [id, name, role, active, hash],
    )
  ).rows[0];
  if (!active || role !== cur.role || hash !== cur.password_hash) await db.query('delete from staff_sessions where user_id = $1', [id]);
  return row;
}

/** Prijava korisničkim imenom i lozinkom → token za `Authorization: Bearer`. */
export async function login(db: Db, r: Restaurant, usernameRaw: unknown, password: unknown, now: Date) {
  const username = String(usernameRaw ?? '').trim().toLowerCase();
  const user = (await db.query('select * from staff_users where restaurant_id = $1 and username = $2 and active', [r.id, username])).rows[0];
  // i za nepostojećeg korisnika računamo hash, da se po vremenu odgovora ne vidi koji korisnici postoje
  const ok = await verifyPassword(String(password ?? ''), user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) throw new AppError(401, 'bad_login', 'Neispravno korisničko ime ili lozinka');
  const token = randomBytes(32).toString('base64url');
  const expires = new Date(now.getTime() + SESSION_DAYS * 86400_000);
  await db.query('insert into staff_sessions (token_hash, user_id, expires_at) values ($1,$2,$3)', [sha256(token), user.id, expires]);
  return { token, expires_at: expires, role: user.role as StaffRole, name: user.name as string, username: user.username as string };
}

export async function logout(db: Db, token: string) {
  await db.query('delete from staff_sessions where token_hash = $1', [sha256(token)]);
}

/** Tko šalje zahtjev: ključ restorana (= vlasnik) ili token prijavljenog korisnika. */
export async function authenticate(db: Db, r: Restaurant, bearer: string, now: Date): Promise<StaffIdentity> {
  if (!bearer) throw new AppError(401, 'unauthorized', 'Potrebna je prijava');
  if (safeEqual(bearer, r.admin_api_key)) return { role: 'owner', userId: null, name: 'Vlasnik (ključ)', username: null };
  const row = (
    await db.query(
      `select u.id, u.name, u.username, u.role from staff_sessions s join staff_users u on u.id = s.user_id
        where s.token_hash = $1 and s.expires_at > $2 and u.active and u.restaurant_id = $3`,
      [sha256(bearer), now, r.id],
    )
  ).rows[0];
  if (!row) throw new AppError(401, 'unauthorized', 'Prijava je istekla ili ključ nije ispravan');
  return { role: row.role, userId: row.id, name: row.name, username: row.username };
}

export function requireRole(who: StaffIdentity, role: StaffRole) {
  if (role === 'owner' && who.role !== 'owner') throw new AppError(403, 'forbidden', 'Samo vlasnik može ovo napraviti');
}

export async function purgeExpiredSessions(db: Db, now: Date) {
  await db.query('delete from staff_sessions where expires_at < $1', [now]);
}
