-- Feature 7: CashBack — rules that credit the wallet after an order is delivered.

CREATE TABLE IF NOT EXISTS "cashback_rule" (
  "id"             text PRIMARY KEY,
  "type"           text NOT NULL,   -- percent | fixed
  "value"          numeric(12,2) NOT NULL,
  "maxCashback"    numeric(12,2),
  "minOrderAmount" numeric(12,2) NOT NULL DEFAULT 0,
  "scope"          text NOT NULL DEFAULT 'global',  -- global | supplier | category | first_order
  "scopeIds"       jsonb NOT NULL DEFAULT '[]',
  "titleAr"        text,
  "titleEn"        text,
  "active"         boolean NOT NULL DEFAULT true,
  "startsAt"       timestamp with time zone,
  "expiresAt"      timestamp with time zone,
  "createdAt"      timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_cashback_rule_active" ON "cashback_rule"("active");
CREATE INDEX IF NOT EXISTS "idx_cashback_rule_scope"  ON "cashback_rule"("scope");
