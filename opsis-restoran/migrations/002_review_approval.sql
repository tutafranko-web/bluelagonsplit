-- Upit za Google recenziju: konobar odobrava prije slanja
-- review_mode: 'approval' (zadano, osoblje odobrava) | 'auto' (šalje se samo) | 'off'
alter table restaurants add column if not exists review_mode text not null default 'approval';
-- null = nije odlučeno | approved | declined
alter table reservations add column if not exists review_decision text;
alter table reservations add column if not exists review_decided_at timestamptz;
