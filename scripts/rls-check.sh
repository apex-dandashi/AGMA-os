#!/usr/bin/env bash
# RLS regression harness runner (docs/07 Sprint C1).
# Requires a running local Supabase stack (supabase start).
set -euo pipefail
cd "$(dirname "$0")/.."

DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
SQL_FILE="supabase/tests/rls_checks.sql"

if command -v psql >/dev/null 2>&1; then
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$SQL_FILE"
else
  docker exec -i supabase_db_agma-os psql -U postgres -d postgres \
    -v ON_ERROR_STOP=1 < "$SQL_FILE"
fi
echo "RLS harness: all personas verified."
