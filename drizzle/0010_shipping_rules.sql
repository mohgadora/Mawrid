CREATE TABLE IF NOT EXISTS "shipping_rule" (
  "id" text PRIMARY KEY,
  "zoneId" text NOT NULL REFERENCES "delivery_zone"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "minOrderAmount" numeric(12,2) NOT NULL DEFAULT '0',
  "maxOrderAmount" numeric(12,2),
  "freeAbove" numeric(12,2),
  "baseFee" numeric(12,2) NOT NULL DEFAULT '0',
  "perKgFee" numeric(12,2) NOT NULL DEFAULT '0',
  "estimatedDays" integer NOT NULL DEFAULT 3,
  "active" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_sr_zoneId" ON "shipping_rule"("zoneId");
