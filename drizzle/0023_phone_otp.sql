-- Feature 10: SMS OTP — phone verification codes + user phoneVerified flag.

CREATE TABLE IF NOT EXISTS "phone_verification" (
  "id"        text PRIMARY KEY,
  "phone"     text NOT NULL,
  "codeHash"  text NOT NULL,           -- sha256(code + phone), never store the raw code
  "expiresAt" timestamp with time zone NOT NULL,
  "attempts"  integer NOT NULL DEFAULT 0,
  "verified"  boolean NOT NULL DEFAULT false,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_phone_verification_phone" ON "phone_verification"("phone");
CREATE INDEX IF NOT EXISTS "idx_phone_verification_createdAt" ON "phone_verification"("createdAt");

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "phoneVerified" boolean NOT NULL DEFAULT false;
