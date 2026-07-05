#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Mawrid — Dev Database Setup Script
# Creates a fresh local PostgreSQL database and runs all migrations.
#
# Usage:
#   ./scripts/setup-dev-db.sh
#
# Options (env vars):
#   DB_NAME    Database name  (default: mawrid_dev)
#   DB_USER    DB user        (default: postgres)
#   DB_PASS    DB password    (default: postgres)
#   DB_HOST    DB host        (default: localhost)
#   DB_PORT    DB port        (default: 5432)
#   DROP_FIRST If set to "1", drops the DB before recreating it
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DB_NAME="${DB_NAME:-mawrid_dev}"
DB_USER="${DB_USER:-postgres}"
DB_PASS="${DB_PASS:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

export PGPASSWORD="$DB_PASS"
PSQL="psql -h $DB_HOST -p $DB_PORT -U $DB_USER"

echo "🔧 Mawrid Dev DB Setup"
echo "   Host: $DB_HOST:$DB_PORT"
echo "   DB:   $DB_NAME"
echo "   User: $DB_USER"
echo ""

# ── 1. Drop (if requested) ──────────────────────────────────────────────────
if [ "${DROP_FIRST:-0}" = "1" ]; then
  echo "⚠️  Dropping existing database '$DB_NAME'..."
  $PSQL -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";" || true
fi

# ── 2. Create DB ────────────────────────────────────────────────────────────
echo "📦 Creating database '$DB_NAME' (if not exists)..."
$PSQL -d postgres -c "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" \
  | grep -q 1 \
  || $PSQL -d postgres -c "CREATE DATABASE \"$DB_NAME\";"

# ── 3. Write .env.local ─────────────────────────────────────────────────────
ENV_FILE="$(dirname "$0")/../.env.local"
DATABASE_URL_VAL="postgres://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME"

echo "📝 Writing DATABASE_URL to .env.local..."
if [ -f "$ENV_FILE" ]; then
  # Update existing line or append
  if grep -q "^DATABASE_URL=" "$ENV_FILE"; then
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL_VAL|" "$ENV_FILE"
  else
    echo "DATABASE_URL=$DATABASE_URL_VAL" >> "$ENV_FILE"
  fi
else
  cat > "$ENV_FILE" <<ENVEOF
DATABASE_URL=$DATABASE_URL_VAL
DATABASE_ALLOW_INSECURE_SSL=true
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=$(openssl rand -base64 32 | tr -d '\n')
ALLOW_MOCK_FALLBACK=true
NEXT_PUBLIC_DEMO_FEATURES=true
ENVEOF
fi

# ── 4. Run all migrations ───────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_DIR="$PROJECT_DIR/drizzle"

echo ""
echo "🚀 Running migrations from $MIGRATIONS_DIR ..."
echo ""

for sql_file in $(ls "$MIGRATIONS_DIR"/*.sql | sort); do
  name=$(basename "$sql_file")
  echo -n "  ▶ $name ... "
  $PSQL -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$sql_file" > /dev/null 2>&1 \
    && echo "✅" \
    || { echo "❌ FAILED — re-running with output:"; $PSQL -d "$DB_NAME" -f "$sql_file"; exit 1; }
done

echo ""
echo "✅ All migrations applied successfully!"
echo ""
echo "Next steps:"
echo "  1. (Optional) Run seed: pnpm db:seed"
echo "  2. (Optional) Create admin: pnpm create-admin"
echo "  3. Start dev server: pnpm dev"
echo ""
echo "DATABASE_URL=$DATABASE_URL_VAL"
