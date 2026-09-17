\set ON_ERROR_STOP 1
\pset pager off

\echo '── tables with RLS enabled (expect 13) ──'
select count(*) as tables_with_rls from pg_tables where schemaname='public' and rowsecurity;

\echo '── policies per table ──'
select tablename, count(*) as policies from pg_policies where schemaname='public' group by tablename order by tablename;

\echo '── realtime publication members ──'
select pubname, schemaname, tablename from pg_publication_tables order by 1;

\echo '── updated_at trigger ──'
select tgname from pg_trigger where tgname='trg_reservations_updated_at' and not tgisinternal;

\echo '── singleton indexes ──'
select indexname from pg_indexes where schemaname='public' and indexname like 'uq\_%' order by 1;

\echo '── security-definer RPCs present ──'
select proname from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('is_admin','get_admin_profile','book_reservation','cancel_reservation',
                  'create_manual_reservation','get_reservation_config','get_available_times',
                  'get_month_availability','set_updated_at')
order by 1;

\echo '── seed data sanity ──'
select 'site_settings' as tbl, count(*) from site_settings
union all select 'reservation_settings', count(*) from reservation_settings
union all select 'business_hours', count(*) from business_hours
union all select 'restaurant_tables', count(*) from restaurant_tables
union all select 'menu_categories', count(*) from menu_categories
union all select 'menu_items', count(*) from menu_items;

\echo ''
\echo '── assertions ──'
select (count(*) = 13) as ok_rls
  from pg_tables where schemaname='public' and rowsecurity \gset
select exists (select 1 from pg_publication_tables
  where pubname='supabase_realtime' and schemaname='public' and tablename='reservations') as ok_realtime \gset
select exists (select 1 from pg_trigger
  where tgname='trg_reservations_updated_at' and not tgisinternal) as ok_trigger \gset
select exists (select 1 from pg_indexes
  where schemaname='public' and indexname='uq_site_settings_singleton') as ok_singleton \gset
select exists (select 1 from pg_proc
  where pronamespace='public'::regnamespace and proname='set_updated_at') as ok_trigger_fn \gset
select (count(*) = 3) as ok_res_policies
  from pg_policies where schemaname='public' and tablename='reservations' \gset

\if :ok_rls
  \echo '✓ 13/13 tables have RLS'
\else
  \echo '✗ RLS not enabled on every table' ; \quit 1
\endif
\if :ok_realtime
  \echo '✓ reservations is in the supabase_realtime publication'
\else
  \echo '✗ realtime publication membership missing' ; \quit 1
\endif
\if :ok_trigger
  \echo '✓ trg_reservations_updated_at exists'
\else
  \echo '✗ updated_at trigger missing' ; \quit 1
\endif
\if :ok_singleton
  \echo '✓ site_settings singleton guard exists'
\else
  \echo '✗ uq_site_settings_singleton missing' ; \quit 1
\endif
\if :ok_trigger_fn
  \echo '✓ set_updated_at() exists'
\else
  \echo '✗ set_updated_at() missing' ; \quit 1
\endif
\if :ok_res_policies
  \echo '✓ reservations has 3 policies (own select, own update, admin all)'
\else
  \echo '✗ reservations policy count is not 3' ; \quit 1
\endif
