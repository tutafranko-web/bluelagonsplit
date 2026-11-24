-- ===== Kanali i Stripe Connect iz panela =====
-- garancija karticom radi tek kad Stripe javi da je račun restorana spreman za naplatu
alter table restaurants add column if not exists stripe_charges_enabled boolean not null default false;
-- računi upisani ručno (SQL-om) prije ove migracije već rade
update restaurants set stripe_charges_enabled = true where stripe_account_id is not null;
-- webhookovi traže restoran po ovim ID-jevima, pa moraju biti jedinstveni
create unique index if not exists restaurants_whatsapp_uniq on restaurants(whatsapp_phone_number_id) where whatsapp_phone_number_id is not null;
create unique index if not exists restaurants_instagram_uniq on restaurants(instagram_account_id) where instagram_account_id is not null;
create unique index if not exists restaurants_stripe_uniq on restaurants(stripe_account_id) where stripe_account_id is not null;

-- ===== Spajanje stolova za veće grupe =====
-- osoblje određuje koji se stolovi mogu fizički spojiti (npr. 1+2 unutra)
create table if not exists table_combinations (
  id             serial primary key,
  restaurant_id  int not null references restaurants(id) on delete cascade,
  table_ids      int[] not null,
  min_capacity   int not null default 1,
  max_capacity   int not null,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);
-- rezervacija na spojenim stolovima: table_id = prvi stol, ostali ovdje
alter table reservations add column if not exists extra_table_ids int[] not null default '{}';

-- ===== Korisnici panela (vlasnik / konobar) =====
create table if not exists staff_users (
  id             serial primary key,
  restaurant_id  int not null references restaurants(id) on delete cascade,
  username       text not null,
  name           text not null,
  role           text not null check (role in ('owner', 'waiter')),
  password_hash  text not null,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  unique (restaurant_id, username)
);

create table if not exists staff_sessions (
  token_hash     text primary key,            -- sha256 tokena; sam token se ne sprema
  user_id        int not null references staff_users(id) on delete cascade,
  expires_at     timestamptz not null,
  created_at     timestamptz not null default now()
);
create index if not exists staff_sessions_user on staff_sessions(user_id);
