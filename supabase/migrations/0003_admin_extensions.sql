-- ════════════════════════════════════════════════════════════════════
-- TableCraft — Admin CMS extensions (Phase 3)
--
-- The admin CMS manages a richer reservation lifecycle than the public
-- booking flow: 'arrived' and 'seated' sit between 'confirmed' and
-- 'completed'. This migration:
--   1. extends the reservations status check constraint,
--   2. keeps the double-booking guard consistent — arrived/seated
--      guests still occupy their table,
--   3. recreates the booking/availability functions so their best-fit
--      availability checks treat arrived/seated as occupied too.
-- ════════════════════════════════════════════════════════════════════

-- ── 1) Extended status check ────────────────────────────────────────
alter table public.reservations
  drop constraint if exists reservations_status_check;

alter table public.reservations
  add constraint reservations_status_check
  check (status in ('confirmed', 'arrived', 'seated', 'cancelled', 'completed', 'no_show'));

-- ── 2) Exclusion constraint — occupied = confirmed | arrived | seated ─
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'no_overlapping_reservations') then
    alter table public.reservations drop constraint no_overlapping_reservations;
  end if;
end $$;

alter table public.reservations
  add constraint no_overlapping_reservations
  exclude using gist (
    table_id with =,
    tstzrange(start_time, end_time) with &&
  )
  where (status in ('confirmed', 'arrived', 'seated'));

-- ── 3) get_admin_profile() — auth helper for the admin login ───────
-- The admins table is locked down under RLS (chicken-and-egg: admins
-- policies require is_admin(), which needs an existing row). This
-- security-definer RPC lets the login page check the caller's own row
-- without tripping RLS.
create or replace function public.get_admin_profile()
returns table (full_name text, role text)
language sql
security definer
stable
set search_path = public
as $$
  select full_name, role from public.admins where id = auth.uid();
$$;

-- ── 4) Recreate book_reservation() with the wider occupancy filter ──
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

  if p_party_size > coalesce(v_settings.max_party_size, 8) then
    raise exception 'parties over % should contact us directly', v_settings.max_party_size
      using errcode = '22023';
  end if;

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

  if exists (
    select 1 from public.holiday_closures
    where closure_date = (p_start_time at time zone v_timezone)::date
      and (is_full_day = true or closed_from is null)
  ) then
    raise exception 'this date is closed for a holiday'
      using errcode = 'P0001';
  end if;

  select t.id into v_table_id
  from public.restaurant_tables t
  where t.is_active = true
    and t.capacity_max >= p_party_size
    and (p_section is null or t.section = p_section)
    and not exists (
      select 1 from public.reservations r
      where r.table_id = t.id
        and r.status in ('confirmed', 'arrived', 'seated')
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
  when exclusion_violation then
    raise exception 'that slot was just taken, please pick another time'
      using errcode = 'RACED';
end;
$$;

-- ── 5) Recreate get_available_times() with the wider occupancy filter ─
create or replace function public.get_available_times(
  p_date date,
  p_party_size int,
  p_section text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings public.reservation_settings;
  v_tz text;
  v_dow int;
  v_duration int;
  v_open time;
  v_close time;
  v_slot timestamptz;
  v_end timestamptz;
  v_ok boolean;
  v_result jsonb := '[]'::jsonb;
begin
  select * into v_settings from public.reservation_settings limit 1;
  select coalesce(timezone, 'America/New_York') into v_tz from public.site_settings limit 1;
  v_duration := coalesce(v_settings.slot_duration_minutes, 90);

  if p_date < current_date
     or p_date > current_date + make_interval(days => coalesce(v_settings.booking_window_days, 30)) then
    return '[]'::jsonb;
  end if;

  if p_party_size > coalesce(v_settings.max_party_size, 8) then
    return '[]'::jsonb;
  end if;

  v_dow := extract(dow from p_date)::int;

  select open_time, close_time into v_open, v_close
  from public.business_hours
  where day_of_week = v_dow and is_closed = false;
  if v_open is null then
    return '[]'::jsonb;
  end if;

  if exists (
    select 1 from public.holiday_closures
    where closure_date = p_date and (is_full_day = true or closed_from is null)
  ) then
    return '[]'::jsonb;
  end if;

  v_slot := (p_date::text || ' ' || v_open::text)::timestamp at time zone v_tz;
  v_end := (p_date::text || ' ' || v_close::text)::timestamp at time zone v_tz;

  while v_slot + make_interval(mins => v_duration) <= v_end loop
    if v_slot > now() + make_interval(hours => coalesce(v_settings.min_notice_hours, 2)) then
      select exists (
        select 1
        from public.restaurant_tables t
        where t.is_active = true
          and t.capacity_max >= p_party_size
          and (p_section is null or t.section = p_section)
          and not exists (
            select 1 from public.reservations r
            where r.table_id = t.id
              and r.status in ('confirmed', 'arrived', 'seated')
              and tstzrange(r.start_time, r.end_time)
                && tstzrange(v_slot, v_slot + make_interval(mins => v_duration))
          )
      ) into v_ok;

      if v_ok then
        v_result := v_result || to_jsonb(to_char(v_slot at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'));
      end if;
    end if;
    v_slot := v_slot + make_interval(mins => v_duration);
  end loop;

  return v_result;
end;
$$;
