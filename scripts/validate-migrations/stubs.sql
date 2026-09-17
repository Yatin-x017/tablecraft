-- ════════════════════════════════════════════════════════════════════
-- Minimal Supabase stubs — lets TableCraft's migrations (0001–0004) run
-- on a plain Postgres instance for local validation only.
-- Mirrors just enough of Supabase's auth/storage/realtime surface:
--   auth.users + auth.uid()   → reservations/admins FKs + RLS policies
--   storage.buckets/objects   → 0001 storage bucket inserts + policies
--   supabase_realtime pub     → 0004 realtime publication membership
--   anon/authenticated roles  → RLS behavior spot-checks
-- ════════════════════════════════════════════════════════════════════

-- ── auth ──────────────────────────────────────────────────────────────
create schema if not exists auth;

create table if not exists auth.users (
  id         uuid primary key,
  email      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- auth.uid() reads the JWT "sub" claim from request.jwt.claims, exactly
-- like Supabase's PostgREST does. Returns NULL for anonymous requests.
-- security definer + empty search_path mirror Supabase's real definition,
-- so anon/authenticated can call it from RLS policies without USAGE on
-- the auth schema.
create or replace function auth.uid()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select nullif(
    coalesce(current_setting('request.jwt.claims', true), '{}')::jsonb ->> 'sub',
    ''
  )::uuid
$$;

-- ── storage ───────────────────────────────────────────────────────────
create schema if not exists storage;

create table if not exists storage.buckets (
  id     text primary key,
  name   text not null,
  public boolean not null default false
);

create table if not exists storage.objects (
  id         uuid primary key default gen_random_uuid(),
  bucket_id  text references storage.buckets (id),
  name       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table storage.buckets enable row level security;
alter table storage.objects enable row level security;

-- ── realtime publication (0004 adds public.reservations to it) ────────
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

-- ── roles + grants (mirror Supabase defaults so RLS — not missing
--    grants — is what gates access in the spot-checks) ─────────────────
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end $$;

grant usage on schema public, storage, auth to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all tables in schema storage to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;

-- tables created by the migrations after this file run
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant execute on functions to anon, authenticated, service_role;
