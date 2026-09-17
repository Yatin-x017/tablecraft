-- ════════════════════════════════════════════════════════════════════
-- TableCraft — RLS + schema completion (Phase 3.5)
--
-- Closes the gaps between 05-Backend-Schema.md and migrations 0001–0003:
--   1. reservations: authenticated customers may UPDATE their own rows
--      (doc §4 promised SELECT/UPDATE; only SELECT was ever created),
--   2. realtime: the reservations table joins the supabase_realtime
--      publication so the admin floor/reservations screens get live
--      INSERT/UPDATE/DELETE events (doc §8),
--   3. reservations.updated_at now auto-refreshes on every UPDATE
--      (doc §2 lists the column; nothing maintained it),
--   4. site_settings gets the same singleton guard reservation_settings
--      already has, matching the "one row per deployment" contract.
-- Purely additive — safe on a database that already ran 0001–0003.
-- ════════════════════════════════════════════════════════════════════

-- ── 1) reservations: authenticated customers update own rows ────────
-- Matches the existing "reservations own select" policy (auth.uid() =
-- user_id). Admin full CRUD is untouched ("reservations admin all").
-- Guests without an account still go through the security-definer RPCs
-- (book_reservation / cancel_reservation), which bypass RLS by design.
create policy "reservations own update" on public.reservations
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 2) Realtime — live reservations for the admin CMS ────────────────
-- Idempotent: only adds the table if the supabase_realtime publication
-- exists (a plain Postgres predating Supabase won't have it) and the
-- table isn't already a member.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'reservations'
     ) then
    alter publication supabase_realtime add table public.reservations;
  end if;
end $$;

-- ── 3) updated_at auto-maintenance on reservations ───────────────────
-- Keeps doc §2's updated_at honest without every caller (adminApi,
-- cancel_reservation, status changes) having to set it by hand.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_reservations_updated_at on public.reservations;
create trigger trg_reservations_updated_at
  before update on public.reservations
  for each row execute function public.set_updated_at();

-- ── 4) site_settings singleton guard ─────────────────────────────────
-- Same pattern as uq_reservation_settings_singleton: at most one row.
-- (The 0001 seed inserts the first row with `on conflict do nothing`,
-- so applying this after seeding is safe on a fresh database.)
create unique index if not exists uq_site_settings_singleton
  on public.site_settings ((true));
