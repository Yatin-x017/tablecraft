-- ════════════════════════════════════════════════════════════════════
-- TableCraft — Phase 2 booking availability functions
-- Guests cannot read reservations (RLS), so availability is exposed via
-- security-definer RPCs that mirror the book_reservation() validation.
-- ════════════════════════════════════════════════════════════════════

-- ── Booking config (reservation_settings is admin-only under RLS) ────
create or replace function public.get_reservation_config()
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select jsonb_build_object(
    'slot_duration_minutes', slot_duration_minutes,
    'booking_window_days', booking_window_days,
    'min_notice_hours', min_notice_hours,
    'max_party_size', max_party_size
  )
  from public.reservation_settings
  limit 1;
$$;

-- ── Available start times for a date + party size ────────────────────
-- Returns a JSON array of UTC ISO strings ("2026-08-12T08:00:00Z").
-- Reuses the same guards as book_reservation(): business hours,
-- holidays, booking window, min-notice, and best-fit table availability.
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

  -- Booking window guard
  if p_date < current_date
     or p_date > current_date + make_interval(days => coalesce(v_settings.booking_window_days, 30)) then
    return '[]'::jsonb;
  end if;

  -- Party size guard
  if p_party_size > coalesce(v_settings.max_party_size, 8) then
    return '[]'::jsonb;
  end if;

  v_dow := extract(dow from p_date)::int;

  -- Closed day?
  select open_time, close_time into v_open, v_close
  from public.business_hours
  where day_of_week = v_dow and is_closed = false;
  if v_open is null then
    return '[]'::jsonb;
  end if;

  -- Full-day holiday?
  if exists (
    select 1 from public.holiday_closures
    where closure_date = p_date and (is_full_day = true or closed_from is null)
  ) then
    return '[]'::jsonb;
  end if;

  -- Walk slots from open until the last one that fits before close
  v_slot := (p_date::text || ' ' || v_open::text)::timestamp at time zone v_tz;
  v_end := (p_date::text || ' ' || v_close::text)::timestamp at time zone v_tz;

  while v_slot + make_interval(mins => v_duration) <= v_end loop
    -- Skip slots already in the past or inside the min-notice window
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
              and r.status = 'confirmed'
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

-- ── Per-day availability counts for a calendar month ─────────────────
-- Returns {"2026-08-01": 5, "2026-08-02": 0, ...} so the calendar can
-- paint availability dots with a single call.
create or replace function public.get_month_availability(
  p_month_start date,
  p_party_size int,
  p_section text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date;
  v_times jsonb;
  v_result jsonb := '{}'::jsonb;
begin
  v_day := date_trunc('month', p_month_start)::date;
  while v_day < (date_trunc('month', p_month_start) + interval '1 month')::date loop
    v_times := public.get_available_times(v_day, p_party_size, p_section);
    v_result := v_result || jsonb_build_object(to_char(v_day, 'YYYY-MM-DD'), jsonb_array_length(v_times));
    v_day := v_day + 1;
  end loop;
  return v_result;
end;
$$;
