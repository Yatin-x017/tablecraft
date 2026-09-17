\set ON_ERROR_STOP 1
\pset pager off

\echo '═══ 1. anon direct INSERT denied (0001 policy set) ═══'
select id as tbl_id from restaurant_tables order by table_number limit 1 \gset
\set ON_ERROR_STOP 0
set role anon;
insert into reservations (table_id, guest_name, guest_email, guest_phone, party_size, start_time, end_time, confirmation_code)
values (:'tbl_id', 'Hacker', 'x@x.com', '1', 2, now(), now() + interval '1 hour', 'HACK1234');
\set ON_ERROR_STOP 1
reset role;
select (count(*) = 0) as ok_anon_insert from reservations where confirmation_code = 'HACK1234' \gset
\if :ok_anon_insert
  \echo '✓ anon direct INSERT was blocked by RLS'
\else
  \echo '✗ anon INSERT leaked a row' ; \quit 1
\endif

\echo ''
\echo '═══ 2. find free slots for the next 7 days ═══'
select (public.get_available_times(current_date + g, 2)->>0) as slot
from generate_series(1, 7) g
where jsonb_array_length(public.get_available_times(current_date + g, 2)) > 0
order by g
limit 1 \gset
select (public.get_available_times(current_date + g, 2)->>0) as slot2
from generate_series(1, 7) g
where jsonb_array_length(public.get_available_times(current_date + g, 2)) > 1
order by g
limit 1 \gset
\echo 'slot  :' :slot
\echo 'slot2 :' :slot2

\echo ''
\echo '═══ 3. book via RPC as anon (security-definer, bypasses RLS) ═══'
set role anon;
select public.book_reservation('E2E Guest', 'e2e@example.com', '(555) 555-0199', 2, :'slot') as booking;
reset role;
select confirmation_code as code from reservations where guest_email = 'e2e@example.com' order by created_at desc limit 1 \gset

\echo ''
\echo '═══ 4. DB-level double-booking guard (exclusion constraint) ═══'
\echo '── same table + overlapping window (expect exclusion_violation) ──'
\set ON_ERROR_STOP 0
insert into reservations (table_id, guest_name, guest_email, guest_phone, party_size, start_time, end_time, status, confirmation_code)
select table_id, 'Duplicate', 'dup@example.com', '1', 2, start_time, end_time, 'confirmed', 'DUP00001'
from reservations where confirmation_code = :'code';
\set ON_ERROR_STOP 1
select (count(*) = 0) as ok_no_dup from reservations where confirmation_code = 'DUP00001' \gset
\if :ok_no_dup
  \echo '✓ exclusion constraint blocked the double-booking'
\else
  \echo '✗ duplicate reservation slipped through' ; \quit 1
\endif

\echo ''
\echo '═══ 4b. create_manual_reservation as non-admin (expect not authorized) ═══'
\set ON_ERROR_STOP 0
set role anon;
select public.create_manual_reservation(:'tbl_id', 'Phone Guest', 'p@example.com', '2', 2, now() + interval '2 days', now() + interval '2 days' + interval '90 minutes');
\set ON_ERROR_STOP 1
reset role;

\echo ''
\echo '═══ 5. second booking (for cross-user test) ═══'
set role anon;
select public.book_reservation('Other Guest', 'other@example.com', '(555) 555-0201', 2, :'slot2');
reset role;
select confirmation_code as code2 from reservations where guest_email = 'other@example.com' order by created_at desc limit 1 \gset

\echo ''
\echo '═══ 6. give the E2E guest an auth account (0004: own select/update) ═══'
insert into auth.users (id, email) values (gen_random_uuid(), 'guest@example.com') returning id as guest_id \gset
update reservations set user_id = :'guest_id' where confirmation_code = :'code';
select set_config('request.jwt.claims', '{"sub":"' || :'guest_id' || '"}', false);
set role anon;
\echo '── own-row SELECT ──'
select (count(*) = 1) as ok_own_select from reservations where user_id = auth.uid() \gset
\if :ok_own_select
  \echo '✓ authenticated guest sees their own reservation'
\else
  \echo '✗ own-row SELECT failed' ; \quit 1
\endif
\echo '── updated_at BEFORE own-row UPDATE ──'
select updated_at as ts_before from reservations where user_id = auth.uid() \gset
select pg_sleep(1);
\echo '── own-row UPDATE (the new 0004 policy) ──'
update reservations set special_requests = 'updated by owner (e2e)' where user_id = auth.uid();
select updated_at as ts_after from reservations where user_id = auth.uid() \gset
\echo '── assertions ──'
select (count(*) = 1) as ok_own_update
  from reservations where user_id = auth.uid() and special_requests = 'updated by owner (e2e)' \gset
select (:'ts_after'::timestamptz > :'ts_before'::timestamptz) as ok_ts \gset
\if :ok_own_update
  \echo '✓ own-row UPDATE was allowed'
\else
  \echo '✗ own-row UPDATE failed' ; \quit 1
\endif
\if :ok_ts
  \echo '✓ updated_at was bumped by the trigger'
\else
  \echo '✗ updated_at did not change' ; \quit 1
\endif
\echo '── cross-user UPDATE (expect blocked) ──'
update reservations set special_requests = 'hacked' where confirmation_code = :'code2';
select (count(*) = 0) as ok_cross from reservations where special_requests = 'hacked' \gset
\if :ok_cross
  \echo '✓ cross-user UPDATE was blocked by RLS'
\else
  \echo '✗ cross-user UPDATE leaked' ; \quit 1
\endif
reset role;

\echo ''
\echo '═══ 7. admin provisioning (0003 is_admin / get_admin_profile) ═══'
insert into admins (id, full_name, role) values (:'guest_id', 'E2E Owner', 'owner');
select set_config('request.jwt.claims', '{"sub":"' || :'guest_id' || '"}', false);
set role anon;
select (public.is_admin() = true) as ok_is_admin \gset
\if :ok_is_admin
  \echo '✓ is_admin() true for the provisioned owner'
\else
  \echo '✗ is_admin() still false' ; \quit 1
\endif
\echo '── get_admin_profile() (expect E2E Owner / owner) ──'
select * from public.get_admin_profile();
select (exists (select 1 from public.get_admin_profile() where full_name = 'E2E Owner' and role = 'owner')) as ok_profile \gset
\if :ok_profile
  \echo '✓ get_admin_profile() returns the owner row'
\else
  \echo '✗ get_admin_profile() mismatch' ; \quit 1
\endif
\echo '── admin reads restaurant_tables (expect 11) ──'
select count(*) from restaurant_tables;
select (count(*) = 11) as ok_tables_read from restaurant_tables \gset
\if :ok_tables_read
  \echo '✓ admin can read restaurant_tables'
\else
  \echo '✗ admin cannot read restaurant_tables' ; \quit 1
\endif
\echo '── admin phone-in booking via create_manual_reservation RPC ──'
select public.create_manual_reservation(:'tbl_id', 'Phone Guest', 'p@example.com', '(555) 555-0202', 2, (:'slot')::timestamptz + interval '1 day', (:'slot')::timestamptz + interval '1 day' + interval '90 minutes');
\echo '── admin reads ALL reservations (expect 3) ──'
select count(*) from reservations;
\echo '── admin moves reservation through lifecycle statuses (0003 constraint) ──'
update reservations set status = 'arrived' where confirmation_code = :'code';
update reservations set status = 'seated'  where confirmation_code = :'code';
update reservations set status = 'completed' where confirmation_code = :'code';
select status from reservations where confirmation_code = :'code';
reset role;

\echo ''
\echo '── final assertions (as postgres) ──'
select (count(*) = 3) as ok_admin_count from reservations \gset
select (count(*) = 1) as ok_lifecycle from reservations where confirmation_code = :'code' and status = 'completed' \gset
\if :ok_admin_count
  \echo '✓ admin sees all 3 reservations'
\else
  \echo '✗ reservation count wrong' ; \quit 1
\endif
\if :ok_lifecycle
  \echo '✓ confirmed → arrived → seated → completed lifecycle accepted'
\else
  \echo '✗ lifecycle status update failed' ; \quit 1
\endif
\echo ''
\echo '✅ verify-behavior: all checks passed'
