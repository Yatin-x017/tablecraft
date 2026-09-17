#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════
# validate-migrations.sh — apply TableCraft's Supabase migrations to a
# local throwaway Postgres cluster and verify schema + RLS behavior.
#
# Usage:
#   ./scripts/validate-migrations.sh               # full run (starts + stops its own server)
#   ./scripts/validate-migrations.sh --keep        # leave the server running afterwards
#   ./scripts/validate-migrations.sh --skip-verify # apply migrations only
#
# Requirements: a local PostgreSQL (15+), no Docker needed. Auto-detects
# Homebrew installs; override with TC_PG_BIN.
#
# Overrides (env vars):
#   TC_PG_BIN   directory containing initdb / pg_ctl / psql (default: auto-detect)
#   TC_PG_PORT  server port (default 54329)
#   TC_PGDATA   cluster directory (default <repo>/.pgdata)
#
# What it does:
#   1. init (if needed) + start a project-local cluster
#   2. reset the database to a clean state
#   3. apply Supabase stubs, then every supabase/migrations/*.sql in order
#   4. run the verification scripts (assertions fail loudly)
#   5. stop the server it started (unless --keep)
# ════════════════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MIG_DIR="$SCRIPT_DIR/validate-migrations"

TC_PG_PORT="${TC_PG_PORT:-54329}"
TC_PGDATA="${TC_PGDATA:-$ROOT/.pgdata}"
KEEP_RUNNING=0
SKIP_VERIFY=0

for arg in "$@"; do
  case "$arg" in
    --keep) KEEP_RUNNING=1 ;;
    --skip-verify) SKIP_VERIFY=1 ;;
    -h|--help)
      sed -n '2,24p' "$0"
      exit 0
      ;;
    *)
      echo "unknown option: $arg (try --help)" >&2
      exit 2
      ;;
  esac
done

# ── locate Postgres binaries ─────────────────────────────────────────
if [[ -n "${TC_PG_BIN:-}" ]]; then
  PG_BIN="$TC_PG_BIN"
elif command -v psql >/dev/null 2>&1; then
  PG_BIN="$(dirname "$(command -v psql)")"
else
  # Homebrew: newest postgresql@N install wins (BSD sort has no -V)
  PG_BIN="$(ls -dt /opt/homebrew/opt/postgresql@*/bin /usr/local/opt/postgresql@*/bin 2>/dev/null | head -1)"
fi
if [[ -z "${PG_BIN:-}" || ! -x "$PG_BIN/psql" ]]; then
  echo "✗ PostgreSQL not found. Install it (e.g. brew install postgresql@17) or set TC_PG_BIN." >&2
  exit 1
fi

PSQL="$PG_BIN/psql"
PCTL="$PG_BIN/pg_ctl"
INITDB="$PG_BIN/initdb"

echo "PostgreSQL: $("$PSQL" --version)"
echo "Cluster:    $TC_PGDATA  (port $TC_PG_PORT)"

# ── create the cluster on first use ──────────────────────────────────
if [[ ! -f "$TC_PGDATA/PG_VERSION" ]]; then
  echo "… initializing cluster"
  "$INITDB" -D "$TC_PGDATA" -U postgres --locale=C -E UTF8 -A trust >/dev/null
fi

# ── start the server (or reuse one already running) ──────────────────
STARTED_BY_US=0
if "$PCTL" -D "$TC_PGDATA" status >/dev/null 2>&1; then
  echo "… server already running — reusing it"
else
  # Clear a stale postmaster.pid left behind by a crash/kill -9.
  if [[ -f "$TC_PGDATA/postmaster.pid" ]]; then
    stale_pid="$(head -1 "$TC_PGDATA/postmaster.pid")"
    if ! kill -0 "$stale_pid" 2>/dev/null; then
      echo "… removing stale postmaster.pid (pid $stale_pid not alive)"
      rm -f "$TC_PGDATA/postmaster.pid"
    fi
  fi
  echo "… starting server"
  "$PCTL" -D "$TC_PGDATA" -o "-p $TC_PG_PORT -k $TC_PGDATA" -l "$TC_PGDATA/server.log" start >/dev/null
  STARTED_BY_US=1
fi

cleanup() {
  if [[ "$STARTED_BY_US" -eq 1 && "$KEEP_RUNNING" -ne 1 ]]; then
    echo "… stopping server"
    "$PCTL" -D "$TC_PGDATA" stop >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

PSQL_ARGS=(-h "$TC_PGDATA" -p "$TC_PG_PORT" -U postgres -d postgres)

# ── reset to a clean state ───────────────────────────────────────────
echo "── resetting database"
# client_min_messages silences the (expected) cascade-NOTICE spam from the drops.
"$PSQL" -q "${PSQL_ARGS[@]}" -v ON_ERROR_STOP=1 -c \
  "set client_min_messages = warning; drop schema if exists public cascade; drop schema if exists storage cascade; drop schema if exists auth cascade; create schema public;"

echo "── applying Supabase stubs (auth/storage/realtime/roles)"
"$PSQL" -q "${PSQL_ARGS[@]}" -v ON_ERROR_STOP=1 -f "$MIG_DIR/stubs.sql"

# ── apply migrations in order ────────────────────────────────────────
failures=0
echo "── applying migrations"
for f in "$ROOT"/supabase/migrations/*.sql; do
  name="$(basename "$f")"
  if "$PSQL" -q "${PSQL_ARGS[@]}" -v ON_ERROR_STOP=1 -f "$f"; then
    echo "  ✓ $name"
  else
    echo "  ✗ $name failed — see the error above" >&2
    failures=1
  fi
done

# ── verify ───────────────────────────────────────────────────────────
if [[ "$SKIP_VERIFY" -eq 1 ]]; then
  echo "── verification skipped (--skip-verify)"
else
  echo "── structural verification"
  if "$PSQL" "${PSQL_ARGS[@]}" -f "$MIG_DIR/verify-structure.sql"; then
    echo "  ✓ structure"
  else
    echo "  ✗ structure" >&2
    failures=1
  fi

  echo ""
  echo "── anon RLS behavior"
  if "$PSQL" "${PSQL_ARGS[@]}" -f "$MIG_DIR/verify-anon.sql"; then
    echo "  ✓ anon behavior"
  else
    echo "  ✗ anon behavior" >&2
    failures=1
  fi

  echo ""
  echo "── end-to-end behavior (booking / own-row / admin)"
  if "$PSQL" "${PSQL_ARGS[@]}" -f "$MIG_DIR/verify-behavior.sql"; then
    echo "  ✓ behavior"
  else
    echo "  ✗ behavior" >&2
    failures=1
  fi
fi

# ── summary ──────────────────────────────────────────────────────────
echo ""
if [[ "$failures" -eq 0 ]]; then
  echo "✅ All migrations applied and verified."
else
  echo "❌ One or more steps failed — see above."
fi
exit "$failures"
