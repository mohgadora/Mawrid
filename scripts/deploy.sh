#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Mawrid — Auto-Deploy Script
#
# Pulls latest code from GitHub, installs dependencies, runs DB patch,
# rebuilds the app, and restarts PM2.
#
# Setup (one-time on server):
#   chmod +x /var/www/mawrid-dev/scripts/deploy.sh
#   # Add to cron or GitHub webhook (see below)
#
# Usage:
#   ./scripts/deploy.sh [--branch main]
#
# Environment variables (defaults to .env.local values):
#   APP_DIR   Project root (default: /var/www/mawrid-dev)
#   PM2_NAME  PM2 process name (default: mawrid-dev)
#   BRANCH    Git branch to pull (default: main)
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/mawrid-dev}"
PM2_NAME="${PM2_NAME:-mawrid-dev}"
BRANCH="${BRANCH:-main}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

log "Starting deploy for branch: $BRANCH"
cd "$APP_DIR"

# ── 1. Pull latest code ──────────────────────────────────────────────────────
log "Fetching latest code from origin/$BRANCH ..."
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"
log "Code updated to: $(git rev-parse --short HEAD)"

# ── 2. Install dependencies ──────────────────────────────────────────────────
log "Installing dependencies ..."
pnpm install --no-frozen-lockfile

# ── 3. Patch database (idempotent — safe to run every time) ─────────────────
log "Running database patch ..."

# Load DATABASE_URL from .env.local or .env.production
ENV_FILE="$APP_DIR/.env.local"
[ ! -f "$ENV_FILE" ] && ENV_FILE="$APP_DIR/.env.production"

if [ -f "$ENV_FILE" ]; then
  export $(grep -E "^DATABASE_URL=" "$ENV_FILE" | xargs) 2>/dev/null || true
fi

if [ -z "${DATABASE_URL:-}" ]; then
  log "WARNING: DATABASE_URL not set, skipping DB patch"
else
  # Use psql with the connection string
  # Strip sslmode from URL for psql compatibility if needed
  DB_URL="$DATABASE_URL"
  psql "$DB_URL" -v ON_ERROR_STOP=0 -f "$APP_DIR/scripts/patch-db.sql" \
    && log "DB patch applied successfully" \
    || log "WARNING: Some DB patch statements failed (may already exist)"
fi

# ── 4. Build the app ─────────────────────────────────────────────────────────
log "Building Next.js app ..."
pnpm build

# ── 5. Restart PM2 ───────────────────────────────────────────────────────────
log "Restarting PM2 process: $PM2_NAME ..."
PORT="${PORT:-3600}"
if pm2 list | grep -q "$PM2_NAME"; then
  pm2 stop "$PM2_NAME" || true
  # Release the port before starting a new process
  fuser -k "${PORT}/tcp" 2>/dev/null || true
  sleep 1
  pm2 start "$PM2_NAME"
else
  pm2 start node --name "$PM2_NAME" --cwd "$APP_DIR" \
    -- node_modules/next/dist/bin/next start -p "$PORT"
fi

pm2 save
log "Deploy complete! App running as: $PM2_NAME"
