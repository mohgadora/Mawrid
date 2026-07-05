CREATE TABLE IF NOT EXISTS "referral_code" (
  "id" text PRIMARY KEY,
  "userId" text NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
  "code" text NOT NULL UNIQUE,
  "usageCount" integer NOT NULL DEFAULT 0,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "referral" (
  "id" text PRIMARY KEY,
  "referrerId" text NOT NULL REFERENCES "user"("id"),
  "refereeId" text NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
  "code" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "referrerBonus" integer NOT NULL DEFAULT 0,
  "refereeBonus" integer NOT NULL DEFAULT 0,
  "rewardedAt" timestamp with time zone,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_ref_referrerId" ON "referral"("referrerId");
