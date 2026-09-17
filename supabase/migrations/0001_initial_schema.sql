-- ════════════════════════════════════════════════════════════════════
-- TableCraft — Initial schema (single-tenant per deployment)
-- Source: 05-Backend-Schema.md v1.0
-- Applies to a fresh Supabase project. Run this once at setup.
-- ════════════════════════════════════════════════════════════════════

-- ── Extensions ────────────────────────────────────────────────────────
create extension if not exists btree_gist;   -- exclusion constraint support
create extension if not exists pgcrypto;      -- gen_random_uuid()

-- ── site_settings (singleton) ─────────────────────────────────────────
create table if not exists public.site_settings (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  tagline     text,
  logo_url    text,
  description text,
  phone       text,
  email       text,
  address     text,
  city        text,
  country     text,
  timezone    text not null default 'America/New_York',
  currency    text not null default 'USD',
  social_links jsonb not null default '{}'::jsonb
);

-- ── admins ─────────────────────────────────────────────────────────────
-- NOTE: the first admin row MUST be inserted with the service-role key or
-- from the Supabase dashboard (RLS on this table requires is_admin(), which
-- needs an existing row — a deliberate chicken-and-egg so admin grants are
-- always provisioned manually by Yatin during handoff, never self-service).
create table if not exists public.admins (
  id        uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role      text not null default 'owner' check (role in ('owner', 'staff'))
);

-- ── customer_profiles (optional accounts) ──────────────────────────────
create table if not exists public.customer_profiles (
  id        uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone     text
);

-- ── menu_categories ────────────────────────────────────────────────────
create table if not exists public.menu_categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  display_order int  not null default 0,
  is_active     boolean not null default true
);

-- ── menu_items ─────────────────────────────────────────────────────────
create table if not exists public.menu_items (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references public.menu_categories (id) on delete cascade,
  name          text not null,
  description   text,
  price         numeric(10, 2) not null check (price >= 0),
  image_url     text,
  dietary_tags  text[] not null default '{}',
  is_featured   boolean not null default false,
  is_available  boolean not null default true,
  display_order int  not null default 0,
  unique (name)
);

-- ── gallery_images ─────────────────────────────────────────────────────
create table if not exists public.gallery_images (
  id            uuid primary key default gen_random_uuid(),
  image_url     text not null,
  alt_text      text not null,           -- required at upload (CMS enforces)
  caption       text,
  display_order int  not null default 0,
  is_active     boolean not null default true
);

-- ── restaurant_tables ──────────────────────────────────────────────────
create table if not exists public.restaurant_tables (
  id           uuid primary key default gen_random_uuid(),
  table_number text not null unique,
  section      text not null default 'Main Hall',
  capacity_min int  not null default 1,
  capacity_max int  not null default 2,
  is_active    boolean not null default true
);

-- ── business_hours ─────────────────────────────────────────────────────
create table if not exists public.business_hours (
  id          uuid primary key default gen_random_uuid(),
  day_of_week int  not null unique check (day_of_week between 0 and 6),
  open_time   time not null,
  close_time  time not null,
  is_closed   boolean not null default false
);

-- ── holiday_closures ───────────────────────────────────────────────────
create table if not exists public.holiday_closures (
  id           uuid primary key default gen_random_uuid(),
  closure_date date not null,
  reason       text,
  is_full_day  boolean not null default true,
  closed_from  time,
  closed_to    time
);

-- ── reservations (the core table) ──────────────────────────────────────
create table if not exists public.reservations (
  id                uuid primary key default gen_random_uuid(),
  table_id          uuid not null references public.restaurant_tables (id),
  user_id           uuid references auth.users (id) on delete set null,
  guest_name        text not null,
  guest_email       text not null,
  guest_phone       text not null,
  party_size        int  not null check (party_size > 0),
  start_time        timestamptz not null,
  end_time          timestamptz not null check (end_time > start_time),
  status            text not null default 'confirmed'
                    check (status in ('confirmed', 'cancelled', 'completed', 'no_show')),
  confirmation_code text not null unique,
  special_requests  text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  cancelled_at      timestamptz
);

-- ════════════════════════════════════════════════════════════════════
-- THE critical constraint: no double-bookings at the database level.
-- Two confirmed reservations can never overlap on the same table,
-- even under a race condition between concurrent requests.
-- ════════════════════════════════════════════════════════════════════
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'no_overlapping_reservations'
  ) then
    alter table public.reservations
      add constraint no_overlapping_reservations
      exclude using gist (
        table_id with =,
        tstzrange(start_time, end_time) with &&
      )
      where (status = 'confirmed');
  end if;
end $$;

-- ── blog_posts ─────────────────────────────────────────────────────────
create table if not exists public.blog_posts (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid references public.admins (id) on delete set null,
  title           text not null,
  slug            text not null unique,
  excerpt         text,
  content         text,
  cover_image_url text,
  post_type       text not null default 'blog' check (post_type in ('blog', 'event', 'special')),
  event_date      date,
  is_published    boolean not null default false,
  published_at    timestamptz
);

-- ── testimonials ───────────────────────────────────────────────────────
create table if not exists public.testimonials (
  id                uuid primary key default gen_random_uuid(),
  customer_name     text not null,
  customer_photo_url text,
  rating            int not null default 5 check (rating between 1 and 5),
  quote             text not null,
  is_approved       boolean not null default false,
  is_featured       boolean not null default false,
  display_order     int not null default 0
);

-- ── reservation_settings (singleton config) ────────────────────────────
create table if not exists public.reservation_settings (
  id                    uuid primary key default gen_random_uuid(),
  slot_duration_minutes int not null default 90,
  booking_window_days   int not null default 30,
  min_notice_hours      int not null default 2,
  max_party_size        int not null default 8
);

-- singleton guard: at most one settings row per deployment
create unique index if not exists uq_reservation_settings_singleton
  on public.reservation_settings ((true));

-- ── is_admin() — single source of truth for admin gating ──────────────
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.admins where id = auth.uid()
  );
$$;

-- ── book_reservation() — atomic RPC (TRD §3.2) ─────────────────────────
-- Validates hours/holidays, auto-assigns the best-fit table, inserts
-- atomically and returns a confirmation code. The exclusion constraint
-- is the final correctness guarantee.

-- Helper: end time of a slot in the venue's timezone
create or replace function public.p_end_check(p_start timestamptz, p_minutes int, p_tz text)
returns timestamptz
language sql
immutable
as $$
  select p_start + (p_minutes || ' minutes')::interval
$$;

create or replace function public.book_reservation(
  p_guest_name        text,
  p_guest_email       text,
  p_guest_phone       text,
  p_party_size        int,
  p_start_time        timestamptz,
  p_special_requests  text default null,
  p_section           text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings    public.reservation_settings;
  v_timezone    text;
  v_dow         int;
  v_duration    int;
  v_end_time    timestamptz;
  v_table_id    uuid;
  v_code        text;
  v_row         public.reservations;
begin
  select * into v_settings from public.reservation_settings limit 1;
  select timezone into v_timezone from public.site_settings limit 1;
  v_timezone := coalesce(v_timezone, 'America/New_York');
  v_duration := coalesce(v_settings.slot_duration_minutes, 90);
  v_end_time := p_start_time + (v_duration || ' minutes')::interval;

  -- Party size guard
  if p_party_size > coalesce(v_settings.max_party_size, 8) then
    raise exception 'parties over % should contact us directly', v_settings.max_party_size
      using errcode = '22023';
  end if;

  -- Business hours guard (local time of the venue)
  v_dow := extract(dow from p_start_time at time zone v_timezone)::int;
  if not exists (
    select 1 from public.business_hours
    where day_of_week = v_dow and is_closed = false
      and open_time <= (p_start_time at time zone v_timezone)::time
      and close_time >= ((p_end_check(p_start_time, v_duration, v_timezone)) at time zone v_timezone)::time
  ) then
    raise exception 'this time falls outside business hours'
      using errcode = 'P0001';
  end if;

  -- Holiday closure guard
  if exists (
    select 1 from public.holiday_closures
    where closure_date = (p_start_time at time zone v_timezone)::date
      and (is_full_day = true or closed_from is null)
  ) then
    raise exception 'this date is closed for a holiday'
      using errcode = 'P0001';
  end if;

  -- Best-fit table: smallest capacity that fits the party, optional section
  select t.id into v_table_id
  from public.restaurant_tables t
  where t.is_active = true
    and t.capacity_max >= p_party_size
    and (p_section is null or t.section = p_section)
    and not exists (
      select 1 from public.reservations r
      where r.table_id = t.id
        and r.status = 'confirmed'
        and tstzrange(r.start_time, r.end_time) && tstzrange(p_start_time, v_end_time)
    )
  order by t.capacity_max asc, t.capacity_min asc
  limit 1;

  if v_table_id is null then
    raise exception 'no table available for that party size at the requested time'
      using errcode = 'P0001';
  end if;

  v_code := upper(substr(md5(gen_random_uuid()::text), 1, 8));

  insert into public.reservations (
    table_id, guest_name, guest_email, guest_phone, party_size,
    start_time, end_time, confirmation_code, special_requests
  ) values (
    v_table_id, p_guest_name, p_guest_email, p_guest_phone, p_party_size,
    p_start_time, v_end_time, v_code, p_special_requests
  )
  returning * into v_row;

  return jsonb_build_object(
    'ok', true,
    'id', v_row.id,
    'table_id', v_row.table_id,
    'confirmation_code', v_row.confirmation_code,
    'start_time', v_row.start_time,
    'end_time', v_row.end_time
  );

exception
  -- Race condition: another guest grabbed the last table in the
  -- milliseconds before this insert. The exclusion constraint fired —
  -- surface a clear, distinguishable error so the optimistic UI can
  -- roll back to a refreshed availability screen (TRD §3.3).
  when exclusion_violation then
    raise exception 'that slot was just taken, please pick another time'
      using errcode = 'RACED';
end;
$$;

-- ── cancel_reservation() — via secure link (confirmation code) ─────────
create or replace function public.cancel_reservation(
  p_confirmation_code text,
  p_guest_email       text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.reservations;
begin
  update public.reservations
     set status = 'cancelled',
         updated_at = now(),
         cancelled_at = now()
   where confirmation_code = upper(p_confirmation_code)
     and status = 'confirmed'
     and (p_guest_email is null or guest_email = p_guest_email)
  returning * into v_row;

  if v_row.id is null then
    return jsonb_build_object('ok', false, 'error', 'reservation not found or already cancelled');
  end if;

  return jsonb_build_object('ok', true, 'id', v_row.id);
end;
$$;

-- ── create_manual_reservation() — admin phone-in booking ───────────────
create or replace function public.create_manual_reservation(
  p_table_id          uuid,
  p_guest_name        text,
  p_guest_email       text,
  p_guest_phone       text,
  p_party_size        int,
  p_start_time        timestamptz,
  p_end_time          timestamptz,
  p_special_requests  text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_row  public.reservations;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  v_code := upper(substr(md5(gen_random_uuid()::text), 1, 8));

  insert into public.reservations (
    table_id, guest_name, guest_email, guest_phone, party_size,
    start_time, end_time, confirmation_code, special_requests, status
  ) values (
    p_table_id, p_guest_name, p_guest_email, p_guest_phone, p_party_size,
    p_start_time, p_end_time, v_code, p_special_requests, 'confirmed'
  )
  returning * into v_row;

  return jsonb_build_object('ok', true, 'id', v_row.id, 'confirmation_code', v_row.confirmation_code);
end;
$$;

-- ── Indexes (Schema §5) ────────────────────────────────────────────────
create index if not exists idx_reservations_slot
  on public.reservations (table_id, start_time, end_time);
create index if not exists idx_reservations_email
  on public.reservations (guest_email);
create index if not exists idx_menu_items_category
  on public.menu_items (category_id, display_order);
create index if not exists idx_blog_posts_public
  on public.blog_posts (post_type, is_published, published_at desc);

-- ════════════════════════════════════════════════════════════════════
-- Row-Level Security — enabled on EVERY table (TRD §7, Schema §4)
-- ════════════════════════════════════════════════════════════════════

alter table public.site_settings enable row level security;
alter table public.admins enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.gallery_images enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.business_hours enable row level security;
alter table public.holiday_closures enable row level security;
alter table public.reservations enable row level security;
alter table public.blog_posts enable row level security;
alter table public.testimonials enable row level security;
alter table public.reservation_settings enable row level security;

-- site_settings: public read, admin write
create policy "site_settings public read" on public.site_settings
  for select using (true);
create policy "site_settings admin all" on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- menu_categories / menu_items / gallery_images / business_hours / holiday_closures
-- public read (active only), admin full CRUD
create policy "menu_categories public read" on public.menu_categories
  for select using (is_active = true);
create policy "menu_categories admin all" on public.menu_categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy "menu_items public read" on public.menu_items
  for select using (is_available = true);
create policy "menu_items admin all" on public.menu_items
  for all using (public.is_admin()) with check (public.is_admin());

create policy "gallery public read" on public.gallery_images
  for select using (is_active = true);
create policy "gallery admin all" on public.gallery_images
  for all using (public.is_admin()) with check (public.is_admin());

create policy "business_hours public read" on public.business_hours
  for select using (true);
create policy "business_hours admin all" on public.business_hours
  for all using (public.is_admin()) with check (public.is_admin());

create policy "holiday_closures public read" on public.holiday_closures
  for select using (true);
create policy "holiday_closures admin all" on public.holiday_closures
  for all using (public.is_admin()) with check (public.is_admin());

-- reservations: RPC-only for guests; own rows for authenticated; admin all
create policy "reservations own select" on public.reservations
  for select using (auth.uid() = user_id);
create policy "reservations admin all" on public.reservations
  for all using (public.is_admin()) with check (public.is_admin());

-- restaurant_tables / reservation_settings: admin only (no public access)
create policy "restaurant_tables admin all" on public.restaurant_tables
  for all using (public.is_admin()) with check (public.is_admin());
create policy "reservation_settings admin all" on public.reservation_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- blog_posts: published only for public, admin all
create policy "blog_posts public read" on public.blog_posts
  for select using (is_published = true);
create policy "blog_posts admin all" on public.blog_posts
  for all using (public.is_admin()) with check (public.is_admin());

-- testimonials: approved only for public, admin all
create policy "testimonials public read" on public.testimonials
  for select using (is_approved = true);
create policy "testimonials admin all" on public.testimonials
  for all using (public.is_admin()) with check (public.is_admin());

-- customer_profiles: own row only; admin read-only
create policy "customer_profiles own select" on public.customer_profiles
  for select using (auth.uid() = id);
create policy "customer_profiles own insert" on public.customer_profiles
  for insert with check (auth.uid() = id);
create policy "customer_profiles own update" on public.customer_profiles
  for update using (auth.uid() = id);
create policy "customer_profiles admin read" on public.customer_profiles
  for select using (public.is_admin());

-- admins: admin-managed (provisioned manually by Yatin during handoff)
create policy "admins admin all" on public.admins
  for all using (public.is_admin()) with check (public.is_admin());

-- ════════════════════════════════════════════════════════════════════
-- Storage buckets (Schema §6)
-- ════════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values
  ('menu-images', 'menu-images', true),
  ('gallery-images', 'gallery-images', true),
  ('blog-covers', 'blog-covers', true),
  ('brand-assets', 'brand-assets', true)
on conflict (id) do nothing;

create policy "menu-images public read" on storage.objects
  for select using (bucket_id = 'menu-images');
create policy "menu-images admin write" on storage.objects
  for insert with check (bucket_id = 'menu-images' and public.is_admin());
create policy "menu-images admin update" on storage.objects
  for update using (bucket_id = 'menu-images' and public.is_admin());
create policy "menu-images admin delete" on storage.objects
  for delete using (bucket_id = 'menu-images' and public.is_admin());

create policy "gallery-images public read" on storage.objects
  for select using (bucket_id = 'gallery-images');
create policy "gallery-images admin write" on storage.objects
  for insert with check (bucket_id = 'gallery-images' and public.is_admin());
create policy "gallery-images admin update" on storage.objects
  for update using (bucket_id = 'gallery-images' and public.is_admin());
create policy "gallery-images admin delete" on storage.objects
  for delete using (bucket_id = 'gallery-images' and public.is_admin());

create policy "blog-covers public read" on storage.objects
  for select using (bucket_id = 'blog-covers');
create policy "blog-covers admin write" on storage.objects
  for insert with check (bucket_id = 'blog-covers' and public.is_admin());
create policy "blog-covers admin update" on storage.objects
  for update using (bucket_id = 'blog-covers' and public.is_admin());
create policy "blog-covers admin delete" on storage.objects
  for delete using (bucket_id = 'blog-covers' and public.is_admin());

create policy "brand-assets public read" on storage.objects
  for select using (bucket_id = 'brand-assets');
create policy "brand-assets admin write" on storage.objects
  for insert with check (bucket_id = 'brand-assets' and public.is_admin());
create policy "brand-assets admin update" on storage.objects
  for update using (bucket_id = 'brand-assets' and public.is_admin());
create policy "brand-assets admin delete" on storage.objects
  for delete using (bucket_id = 'brand-assets' and public.is_admin());

-- ════════════════════════════════════════════════════════════════════
-- Seed data — Crumb & Confetti demo instance
-- ════════════════════════════════════════════════════════════════════

insert into public.site_settings (
  name, tagline, description, phone, email, address, city, country, timezone, currency, social_links
) values (
  'Crumb & Confetti',
  'Baked with Joy',
  'Artisanal pastries, craft coffee, and a daily dose of celebration in every crumb.',
  '(555) 010-2026',
  'hello@crumbandconfetti.example',
  '48 Sprinkle Street',
  'Brooklyn',
  'USA',
  'America/New_York',
  'USD',
  '{"instagram": "https://instagram.com", "facebook": "https://facebook.com"}'::jsonb
) on conflict do nothing;

insert into public.reservation_settings (slot_duration_minutes, booking_window_days, min_notice_hours, max_party_size)
values (90, 30, 2, 8)
on conflict do nothing;

-- Business hours: closed Mondays, 8am–6pm Tue–Sun
insert into public.business_hours (day_of_week, open_time, close_time, is_closed)
select d, '08:00'::time, '18:00'::time, (d = 1)
from generate_series(0, 6) as d
on conflict do nothing;

-- Sample floor: Main Hall (2/4/6 seats) + Patio (2/4 seats) + Window (2 seats)
insert into public.restaurant_tables (table_number, section, capacity_min, capacity_max, is_active)
values
  ('W1', 'Window', 1, 2, true),
  ('W2', 'Window', 1, 2, true),
  ('M1', 'Main Hall', 1, 2, true),
  ('M2', 'Main Hall', 1, 2, true),
  ('M3', 'Main Hall', 2, 4, true),
  ('M4', 'Main Hall', 2, 4, true),
  ('M5', 'Main Hall', 2, 4, true),
  ('M6', 'Main Hall', 4, 6, true),
  ('P1', 'Patio', 1, 2, true),
  ('P2', 'Patio', 2, 4, true),
  ('P3', 'Patio', 2, 4, true)
on conflict (table_number) do nothing;

-- Menu categories + a few seed items so Phase 1 has real content to render
insert into public.menu_categories (name, slug, display_order, is_active)
values
  ('Pastries', 'pastries', 1, true),
  ('Coffee', 'coffee', 2, true),
  ('Custom Cakes', 'custom-cakes', 3, true)
on conflict (slug) do nothing;

insert into public.menu_items (category_id, name, description, price, dietary_tags, is_featured, is_available, display_order)
select c.id, 'Confetti Latte', 'Signature blend with vanilla foam and a dash of edible sparkles.', 6.50, '{vegetarian}', true, true, 1
from public.menu_categories c where c.slug = 'coffee'
on conflict (name) do nothing;

insert into public.menu_items (category_id, name, description, price, dietary_tags, is_featured, is_available, display_order)
select c.id, 'The Salty Sprink', 'Massive dark chocolate chunk cookie with smoked sea salt.', 4.00, '{}', true, true, 2
from public.menu_categories c where c.slug = 'pastries'
on conflict (name) do nothing;
