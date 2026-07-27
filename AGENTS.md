# AGENTS.md

## Cursor Cloud specific instructions

Mawrid is a single Next.js 16 app (root of repo) that bundles the backend API and
three portals (buyer storefront `/`, supplier `/partner`, admin `/admin`). Its only
hard runtime dependency is PostgreSQL. Standard commands live in `README.md` and
`package.json`; the notes below cover the non-obvious caveats for running it here.

### Services

- Web app + API: `pnpm dev` runs on port `3600` (not 3000). It reads `.env.local` automatically.
- PostgreSQL: local server, DB `mawrid_dev`, user/pass `postgres`/`postgres`. Installed via apt and
  persisted in the snapshot, but the service is not auto-started — start it each session with
  `sudo pg_ctlcluster 16 main start` (or `sudo service postgresql start`).
- All third-party integrations (Resend, Moyasar, Twilio, AI Gateway, Maps, social login) are optional
  and degrade gracefully in dev — none are needed to boot or run core flows.

### Non-obvious gotchas

- Standalone scripts (`pnpm db:seed`, `pnpm create-admin`, `drizzle-kit`) load env via `dotenv/config`,
  which reads `.env` — NOT `.env.local`. `.env.local` (where `scripts/setup-dev-db.sh` writes vars) is
  gitignored and only auto-loaded by Next.js. When running those scripts, export the vars first, e.g.
  `set -a; . ./.env.local; set +a` (dotenv will not override already-set shell vars). Do not create a
  committed `.env` — it is not gitignored and would leak secrets.
- Migrations are raw SQL in `drizzle/*.sql`, applied by `scripts/setup-dev-db.sh` (not `pnpm db:migrate`,
  whose `drizzle/meta/_journal.json` only tracks 0000/0012). The setup script uses `psql -v ON_ERROR_STOP=1`
  and currently HALTS at `0015_constraints_and_indexes.sql`: migration `0001` already creates a unique
  index named `favorite_user_product_unique`, and `0015` tries to add a constraint with the same name.
  This is a pre-existing migration bug. To get a complete schema, apply the SQL files while tolerating
  "already exists" errors, e.g. drop/recreate `mawrid_dev` then loop `psql -d mawrid_dev -f <file>` over
  `drizzle/*.sql` without `ON_ERROR_STOP` (the duplicate is harmless — the index from 0001 satisfies intent).
- Admin login: `admin@mawrid.sa` / `Admin12345!` (created via `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` +
  `pnpm create-admin`). `pnpm db:seed` loads catalog/category/supplier demo data.

### Quality gates

CI (`.github/workflows/ci.yml`) runs `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`. Lint emits
warnings only (no errors). Tests are Vitest unit tests and need no database.
