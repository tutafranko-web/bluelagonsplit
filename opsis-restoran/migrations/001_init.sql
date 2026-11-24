-- Opsis Restoran — osnovna shema (faza 1 + 2 + 3)

create table if not exists restaurants (
  id              serial primary key,
  slug            text unique not null,
  name            text not null,
  timezone        text not null default 'Europe/Zagreb',
  phone           text,
  email           text,
  address         text,
  default_language text not null default 'hr',
  -- [{ "weekday": 1..7 (1 = ponedjeljak), "open": "12:00", "close": "23:00" }]
  opening_hours   jsonb not null default '[]',
  -- datumi kad je zatvoreno, npr. ["2026-12-25"]
  closed_dates    jsonb not null default '[]',
  slot_minutes    int not null default 30,
  default_duration_minutes int not null default 120,
  max_party_size  int not null default 12,
  -- garancija karticom: 'none' | 'card'
  guarantee_mode  text not null default 'none',
  guarantee_min_party int not null default 1,
  no_show_fee_cents int not null default 0,  -- po osobi
  stripe_account_id text,                     -- Stripe Connect račun restorana
  google_review_url text,
  whatsapp_phone_number_id text,              -- Meta Cloud API
  instagram_account_id text,
  admin_api_key   text not null,              -- za panel
  info_text       text not null default '',   -- slobodan tekst za AI (parking, psi, alergije...)
  fiscal_config   jsonb not null default '{}',-- faza 3
  created_at      timestamptz not null default now()
);

create table if not exists dining_tables (
  id             serial primary key,
  restaurant_id  int not null references restaurants(id) on delete cascade,
  label          text not null,
  zone           text not null default 'unutra',
  min_capacity   int not null default 1,
  max_capacity   int not null,
  active         boolean not null default true,
  qr_token       text unique not null,
  unique (restaurant_id, label)
);

create table if not exists guests (
  id             serial primary key,
  restaurant_id  int not null references restaurants(id) on delete cascade,
  name           text not null,
  phone          text,
  email          text,
  language       text not null default 'hr',
  marketing_consent boolean not null default false,
  stripe_customer_id text,
  visits         int not null default 0,
  no_shows       int not null default 0,
  notes          text not null default '',
  created_at     timestamptz not null default now()
);
create unique index if not exists guests_phone_uniq on guests(restaurant_id, phone) where phone is not null;

create table if not exists reservations (
  id             serial primary key,
  code           text unique not null,
  restaurant_id  int not null references restaurants(id) on delete cascade,
  guest_id       int not null references guests(id),
  table_id       int references dining_tables(id),
  party_size     int not null,
  start_at       timestamptz not null,
  end_at         timestamptz not null,
  -- pending_guarantee | confirmed | seated | completed | cancelled | no_show | expired
  status         text not null,
  source         text not null default 'web',  -- web | chat | whatsapp | instagram | voice | admin
  notes          text not null default '',
  stripe_checkout_session_id text,
  stripe_payment_method_id text,
  no_show_charge_id text,
  guarantee_expires_at timestamptz,
  reminder_sent_at timestamptz,
  review_request_sent_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists reservations_day on reservations(restaurant_id, start_at);

-- izlazne poruke (email / whatsapp / instagram / sms)
create table if not exists outbox (
  id             serial primary key,
  restaurant_id  int not null references restaurants(id) on delete cascade,
  reservation_id int references reservations(id) on delete set null,
  channel        text not null,
  recipient      text not null,
  kind           text not null,          -- confirmation | reminder | cancellation | review_request | guarantee_link | free_text
  payload        jsonb not null,
  send_after     timestamptz not null default now(),
  sent_at        timestamptz,
  attempts       int not null default 0,
  last_error     text
);
create index if not exists outbox_due on outbox(sent_at, send_after);

-- razgovori chatbota (web / whatsapp / instagram)
create table if not exists chat_sessions (
  id             serial primary key,
  restaurant_id  int not null references restaurants(id) on delete cascade,
  channel        text not null,
  external_id    text not null,
  messages       jsonb not null default '[]',
  updated_at     timestamptz not null default now(),
  unique (restaurant_id, channel, external_id)
);

-- ===== Faza 2: meni i narudžbe =====
create table if not exists menu_items (
  id             serial primary key,
  restaurant_id  int not null references restaurants(id) on delete cascade,
  category       text not null,
  name           jsonb not null,          -- {"hr": "...", "en": "...", "de": "..."}
  description    jsonb not null default '{}',
  price_cents    int not null,
  vat_rate       numeric not null default 13,
  allergens      jsonb not null default '[]',  -- EU 14 alergena: ["gluten","mlijeko",...]
  available      boolean not null default true,
  sort           int not null default 0
);

create table if not exists orders (
  id             serial primary key,
  restaurant_id  int not null references restaurants(id) on delete cascade,
  table_id       int not null references dining_tables(id),
  -- new | accepted | served | paid | cancelled
  status         text not null default 'new',
  kind           text not null default 'order',   -- order | call_waiter | request_bill
  notes          text not null default '',
  total_cents    int not null default 0,
  invoice_id     int,
  created_at     timestamptz not null default now()
);

create table if not exists order_items (
  id             serial primary key,
  order_id       int not null references orders(id) on delete cascade,
  menu_item_id   int not null references menu_items(id),
  name           text not null,
  qty            int not null,
  unit_price_cents int not null,
  vat_rate       numeric not null
);

-- ===== Faza 3: fiskalizacija =====
create table if not exists invoices (
  id             serial primary key,
  restaurant_id  int not null references restaurants(id) on delete cascade,
  seq            int not null,
  premise        text not null,       -- oznaka poslovnog prostora
  device         text not null,       -- oznaka naplatnog uređaja
  issued_at      timestamptz not null default now(),
  total_cents    int not null,
  payment_method text not null,       -- G gotovina | K kartica | T transakcijski | O ostalo
  operator_oib   text not null,
  zki            text not null,
  jir            text,
  fiscal_status  text not null default 'pending', -- pending | fiscalized | failed
  fiscal_error   text,
  request_xml    text,
  unique (restaurant_id, premise, device, seq)
);
