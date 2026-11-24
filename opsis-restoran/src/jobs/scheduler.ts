import type { Db } from '../db.js';
import type { Deps } from '../deps.js';
import { expirePending, notify } from '../services/reservations.js';
import { processOutbox } from '../services/notifications.js';
import type { Reservation, Restaurant } from '../services/types.js';

/** Jedan krug pozadinskih poslova. Poziva se svake minute. */
export async function tick(db: Db, deps: Deps) {
  const now = deps.now();
  const expired = await expirePending(db, now);

  // automatski završi stolove koji sjede, sat nakon planiranog kraja
  await db.query(
    `update reservations set status = 'completed', updated_at = now() where status = 'seated' and end_at < $1`,
    [new Date(now.getTime() - 3600_000)],
  );

  // podsjetnici: ~24 h prije, samo ako je rezervacija napravljena barem 6 h ranije
  const due = (
    await db.query<Reservation & { r: Restaurant }>(
      `select res.* from reservations res
        where res.status = 'confirmed' and res.reminder_sent_at is null
          and res.start_at <= $1 and res.start_at > $2
          and res.start_at - res.created_at > interval '6 hours'`,
      [new Date(now.getTime() + 24 * 3600_000), new Date(now.getTime() + 2 * 3600_000)],
    )
  ).rows;
  for (const res of due) {
    const r = (await db.query<Restaurant>('select * from restaurants where id = $1', [res.restaurant_id])).rows[0];
    await notify(db, deps, r, res, 'reminder');
    await db.query('update reservations set reminder_sent_at = $2 where id = $1', [res.id, now]);
  }

  // upit za Google recenziju, samo za goste koji su stvarno bili:
  //  - review_mode 'auto': 2 h nakon kraja (unutar 48 h)
  //  - review_mode 'approval': tek kad konobar odobri u panelu; šalje se 2 h nakon kraja ili odmah ako je to već prošlo (unutar 7 dana)
  const reviews = (
    await db.query<Reservation>(
      `select res.* from reservations res join restaurants r on r.id = res.restaurant_id
        where res.status in ('seated','completed') and res.review_request_sent_at is null
          and r.google_review_url is not null and res.end_at <= $1
          and (
            (r.review_mode = 'auto' and res.review_decision is distinct from 'declined' and res.end_at > $2)
            or (r.review_mode = 'approval' and res.review_decision = 'approved' and res.end_at > $3)
          )`,
      [new Date(now.getTime() - 2 * 3600_000), new Date(now.getTime() - 48 * 3600_000), new Date(now.getTime() - 7 * 86400_000)],
    )
  ).rows;
  for (const res of reviews) {
    const r = (await db.query<Restaurant>('select * from restaurants where id = $1', [res.restaurant_id])).rows[0];
    await notify(db, deps, r, res, 'review_request');
    await db.query('update reservations set review_request_sent_at = $2 where id = $1', [res.id, now]);
  }

  const sent = await processOutbox(db, deps);
  return { expired, reminders: due.length, reviews: reviews.length, sent };
}

export function startScheduler(db: Db, deps: Deps, everyMs = 60_000) {
  let running = false;
  const h = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      await tick(db, deps);
    } catch (e) {
      console.error('[scheduler]', e);
    } finally {
      running = false;
    }
  }, everyMs);
  return () => clearInterval(h);
}
