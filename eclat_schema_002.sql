-- ============================================================
-- Eclat — migration 002: collections, tags, blog, lookbooks, videos
-- Added after reviewing chandranipearls.in and flawnt.store (12 Sep 2026)
-- Run after 001 (eclat_schema.sql).
-- ============================================================

-- ---------- Curated collections (many-to-many; separate from categories) ----------
-- e.g. "Wedding", "Lotus", "Under ₹1,999", "New harvest", "Best sellers", "Gifts for her"
create type collection_kind as enum ('manual','auto');

create table collections (
  id           uuid primary key default gen_random_uuid(),
  name         varchar(80) not null,
  slug         varchar(100) not null unique,
  kind         collection_kind not null default 'manual',
  rules        jsonb not null default '{}',   -- auto: {"tags":["occasion:wedding"],"max_price":199900,"is_new":true,"min_rating":4}
  image_url    text,
  banner_url   text,
  description  text,
  position     smallint not null default 0,
  show_in_menu boolean not null default true,
  menu_group   varchar(40),                   -- 'category' | 'occasion' | 'collection' | 'most-loved' | 'price'
  status       product_status not null default 'active',
  seo          jsonb not null default '{}'
);
create table collection_products (
  collection_id uuid not null references collections(id) on delete cascade,
  product_id    uuid not null references products(id) on delete cascade,
  position      smallint not null default 0,
  primary key (collection_id, product_id)
);
create index on collection_products(product_id);

-- ---------- Structured tags (occasion, pearl type, style) for filters and mega menu ----------
create table tags (
  id     uuid primary key default gen_random_uuid(),
  kind   varchar(30) not null,                -- 'occasion' | 'pearl_type' | 'style' | 'colour' | 'recipient'
  name   varchar(60) not null,
  slug   varchar(80) not null,
  position smallint not null default 0,
  unique (kind, slug)
);
create table product_tags (
  product_id uuid not null references products(id) on delete cascade,
  tag_id     uuid not null references tags(id) on delete cascade,
  primary key (product_id, tag_id)
);
create index on product_tags(tag_id);

-- ---------- Per-product material / trust badges shown under the CTA (Flawnt pattern) ----------
alter table products add column badges jsonb not null default '[]';
-- e.g. [{"icon":"pearl","label":"Freshwater pearl"},{"icon":"silver","label":"925 silver"},{"icon":"hypo","label":"Hypoallergenic"},{"icon":"farm","label":"Grown on our farm"}]

-- ---------- Gift wrap on PDP + product-level gift eligibility ----------
alter table products add column gift_wrap_eligible boolean not null default true;

-- ---------- Blog ----------
create table blog_posts (
  id            uuid primary key default gen_random_uuid(),
  title         varchar(200) not null,
  slug          varchar(220) not null unique,
  excerpt       varchar(400),
  body          text not null,                -- markdown/html
  cover_url     text,
  author        varchar(80),
  tags          text[] not null default '{}',
  related_product_ids uuid[] not null default '{}',
  seo           jsonb not null default '{}',
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on blog_posts(published_at desc);

-- ---------- Shop the look / lookbooks ----------
create table lookbooks (
  id         uuid primary key default gen_random_uuid(),
  title      varchar(120) not null,
  image_url  text not null,
  position   smallint not null default 0,
  active     boolean not null default true
);
create table lookbook_products (
  lookbook_id uuid not null references lookbooks(id) on delete cascade,
  product_id  uuid not null references products(id) on delete cascade,
  x_pct       numeric(5,2),                   -- optional hotspot position on the image
  y_pct       numeric(5,2),
  position    smallint not null default 0,
  primary key (lookbook_id, product_id)
);

-- ---------- Shoppable videos ("Watch & shop") ----------
create table videos (
  id          uuid primary key default gen_random_uuid(),
  title       varchar(120),
  video_url   text not null,                  -- S3 mp4 or Instagram reel URL
  poster_url  text,
  product_ids uuid[] not null default '{}',
  position    smallint not null default 0,
  placement   varchar(30) not null default 'home',   -- 'home' | 'pdp' | 'collection'
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- FAQ (site-wide and per product) ----------
create table faqs (
  id          uuid primary key default gen_random_uuid(),
  question    varchar(200) not null,
  answer      text not null,
  scope       varchar(20) not null default 'global',   -- 'global' | 'pdp' | 'shipping' | 'returns'
  product_id  uuid references products(id) on delete cascade,  -- null = all products
  position    smallint not null default 0,
  active      boolean not null default true
);

-- ---------- Marketing consent + newsletter ----------
alter table customers add column sms_opt_in boolean not null default false;
alter table customers add column email_opt_in boolean not null default false;
alter table customers add column consent_at timestamptz;
create table subscribers (                    -- popup / footer signups before an account exists
  id         bigserial primary key,
  phone      varchar(15),
  email      citext,
  source     varchar(30) not null default 'footer',    -- 'popup' | 'footer' | 'checkout'
  consent    boolean not null default true,
  created_at timestamptz not null default now(),
  unique (phone), unique (email)
);

-- ---------- Returns: video proof + cancellation window ----------
alter table returns add column video_url text;
alter table orders add column cancel_allowed_until timestamptz;   -- placed_at + settings.returns.cancel_hours (default 24) or until shipped, whichever first

-- ---------- Store credit wallet [P2] ----------
create table store_credits (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references customers(id) on delete cascade,
  amount       integer not null,              -- +credit / -debit, paise
  reason       varchar(40) not null,          -- 'refund' | 'goodwill' | 'redeem' | 'expiry'
  ref_order_id uuid references orders(id),
  expires_at   timestamptz,
  created_at   timestamptz not null default now()
);
create index on store_credits(customer_id, created_at desc);

-- ---------- Loyalty points [P2] ----------
create table loyalty_ledger (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references customers(id) on delete cascade,
  points       integer not null,              -- +earn / -redeem
  reason       varchar(40) not null,          -- 'signup' | 'order' | 'review' | 'birthday' | 'follow' | 'redeem' | 'expiry'
  ref_id       uuid,
  created_at   timestamptz not null default now()
);
create index on loyalty_ledger(customer_id, created_at desc);

-- ---------- Gift cards [P2] ----------
create table gift_cards (
  id            uuid primary key default gen_random_uuid(),
  code          varchar(24) not null unique,
  initial_value integer not null,
  balance       integer not null,
  purchaser_customer_id uuid references customers(id),
  recipient_email citext,
  recipient_phone varchar(15),
  message       varchar(300),
  order_id      uuid references orders(id),
  expires_at    timestamptz,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ---------- Bundles / packs [P2] ----------
create table bundles (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,   -- the bundle is itself a product
  items       jsonb not null,                 -- [{"variant_id":"...","qty":1}]
  created_at  timestamptz not null default now()
);

-- ---------- Sale countdown / campaigns [P2] ----------
create table campaigns (
  id          uuid primary key default gen_random_uuid(),
  name        varchar(120) not null,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  banner      jsonb not null default '{}',    -- {image, headline, cta, link}
  collection_id uuid references collections(id),
  discount_id uuid references discounts(id),
  show_countdown boolean not null default true,
  active      boolean not null default true
);

-- ---------- Seed: menu groups and common tags ----------
insert into tags(kind,name,slug,position) values
('occasion','Everyday','everyday',1),('occasion','Work','work',2),('occasion','Wedding guest','wedding-guest',3),('occasion','Festive','festive',4),('occasion','Party','party',5),('occasion','Gifting','gifting',6),
('pearl_type','Round','round',1),('pearl_type','Baroque','baroque',2),('pearl_type','Designer / image','designer',3),('pearl_type','Coin','coin',4),
('recipient','For her','for-her',1),('recipient','For him','for-him',2),('recipient','For mom','for-mom',3),('recipient','For the bride','for-the-bride',4);
