-- Feature 9: Deal of the Day + Clearance sales.

CREATE TABLE IF NOT EXISTS "deal_of_day" (
  "id"           text PRIMARY KEY,
  "productId"    text NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
  "titleAr"      text NOT NULL,
  "titleEn"      text,
  "discountType" text NOT NULL DEFAULT 'percent',  -- percent | fixed
  "discount"     numeric(12,2) NOT NULL,
  "date"         date NOT NULL,
  "active"       boolean NOT NULL DEFAULT true,
  "createdAt"    timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE ("productId", "date")
);

CREATE INDEX IF NOT EXISTS "idx_deal_of_day_date" ON "deal_of_day"("date");

CREATE TABLE IF NOT EXISTS "clearance_sale" (
  "id"        text PRIMARY KEY,
  "titleAr"   text NOT NULL,
  "titleEn"   text,
  "startsAt"  timestamp with time zone NOT NULL,
  "endsAt"    timestamp with time zone NOT NULL,
  "active"    boolean NOT NULL DEFAULT true,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "clearance_sale_product" (
  "id"              text PRIMARY KEY,
  "clearanceId"     text NOT NULL REFERENCES "clearance_sale"("id") ON DELETE CASCADE,
  "productId"       text NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
  "discountPercent" numeric(5,2) NOT NULL,
  UNIQUE ("clearanceId", "productId")
);

CREATE INDEX IF NOT EXISTS "idx_clearance_sale_product_clearanceId" ON "clearance_sale_product"("clearanceId");
