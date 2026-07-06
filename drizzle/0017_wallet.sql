-- Feature 3: Digital Wallet — per-user balance, ledger, and top-up bonus rules.

-- ── wallet ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "wallet" (
  "id"             text PRIMARY KEY,
  "userId"         text NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
  "balance"        numeric(12,2) NOT NULL DEFAULT 0,
  "lifetimeCredit" numeric(12,2) NOT NULL DEFAULT 0,
  "lifetimeDebit"  numeric(12,2) NOT NULL DEFAULT 0,
  "currency"       text NOT NULL DEFAULT 'USD',
  "createdAt"      timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt"      timestamp with time zone NOT NULL DEFAULT now()
);

-- ── wallet_transaction ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "wallet_transaction" (
  "id"           text PRIMARY KEY,
  "walletId"     text NOT NULL REFERENCES "wallet"("id") ON DELETE CASCADE,
  "type"         text NOT NULL,   -- topup | purchase | refund | bonus | loyalty_convert | cashback | admin_credit | admin_debit
  "amount"       numeric(12,2) NOT NULL,  -- + = credit, - = debit
  "balanceAfter" numeric(12,2) NOT NULL,
  "reference"    text,
  "note"         text,
  "createdBy"    text,
  "createdAt"    timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_wallet_transaction_walletId" ON "wallet_transaction"("walletId");
CREATE INDEX IF NOT EXISTS "idx_wallet_transaction_type"     ON "wallet_transaction"("type");

-- ── wallet_bonus_rule ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "wallet_bonus_rule" (
  "id"         text PRIMARY KEY,
  "minTopup"   numeric(12,2) NOT NULL,
  "bonusType"  text NOT NULL,   -- percent | fixed
  "bonusValue" numeric(12,2) NOT NULL,
  "maxBonus"   numeric(12,2),
  "active"     boolean NOT NULL DEFAULT true,
  "startsAt"   timestamp with time zone,
  "expiresAt"  timestamp with time zone,
  "createdAt"  timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_wallet_bonus_rule_active" ON "wallet_bonus_rule"("active");
