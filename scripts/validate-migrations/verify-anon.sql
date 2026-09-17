\set ON_ERROR_STOP 1
\pset pager off

\echo '═══ RLS behavior as anon (no JWT) ═══'
set role anon;
select current_user as acting_as;

\echo '── anon sees reservations? (expect 0) ──'
select count(*) from reservations;

\echo '── anon sees restaurant_tables? (expect 0) ──'
select count(*) from restaurant_tables;

\echo '── anon sees reservation_settings? (expect 0) ──'
select count(*) from reservation_settings;

\echo '── anon sees site_settings? (expect 1) ──'
select count(*) from site_settings;

\echo '── anon sees active menu_items? (expect 2) ──'
select count(*) from menu_items where is_available;

\echo '── anon sees inactive menu_items? (expect 0) ──'
select count(*) from menu_items where not is_available;

\echo '── is_admin() as anon? (expect f) ──'
select public.is_admin();

\echo ''
\echo '── assertions ──'
select (count(*) = 0) as ok_no_res from reservations \gset
select (count(*) = 0) as ok_no_tables from restaurant_tables \gset
select (count(*) = 0) as ok_no_settings from reservation_settings \gset
select (count(*) = 1) as ok_site from site_settings \gset
select (count(*) = 2) as ok_menu from menu_items where is_available \gset
select (public.is_admin() = false) as ok_not_admin \gset

\if :ok_no_res
  \echo '✓ anon cannot read reservations'
\else
  \echo '✗ anon read reservations' ; \quit 1
\endif
\if :ok_no_tables
  \echo '✓ anon cannot read restaurant_tables'
\else
  \echo '✗ anon read restaurant_tables' ; \quit 1
\endif
\if :ok_no_settings
  \echo '✓ anon cannot read reservation_settings'
\else
  \echo '✗ anon read reservation_settings' ; \quit 1
\endif
\if :ok_site
  \echo '✓ anon can read site_settings'
\else
  \echo '✗ anon cannot read site_settings' ; \quit 1
\endif
\if :ok_menu
  \echo '✓ anon sees the 2 active menu items'
\else
  \echo '✗ anon menu visibility wrong' ; \quit 1
\endif
\if :ok_not_admin
  \echo '✓ anon is not an admin'
\else
  \echo '✗ anon is an admin' ; \quit 1
\endif

reset role;
