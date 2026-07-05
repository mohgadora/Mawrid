CREATE TABLE IF NOT EXISTS "loyalty_account" (
  "id" text PRIMARY KEY,
  "userId" text NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
  "balance" integer NOT NULL DEFAULT 0,
  "lifetimeEarned" integer NOT NULL DEFAULT 0,
  "lifetimeRedeemed" integer NOT NULL DEFAULT 0,
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "loyalty_transaction" (
  "id" text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "orderId" text REFERENCES "order"("id"),
  "type" text NOT NULL,
  "points" integer NOT NULL,
  "balanceBefore" integer NOT NULL,
  "balanceAfter" integer NOT NULL,
  "note" text,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_lt_userId" ON "loyalty_transaction"("userId");
CREATE INDEX IF NOT EXISTS "idx_la_userId" ON "loyalty_account"("userId");
