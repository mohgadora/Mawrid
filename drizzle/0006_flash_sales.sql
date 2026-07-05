CREATE TABLE IF NOT EXISTS "flash_sale" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "nameEn" text,
  "startsAt" timestamp with time zone NOT NULL,
  "endsAt" timestamp with time zone NOT NULL,
  "discountType" text NOT NULL DEFAULT 'percentage',
  "discountValue" numeric(12,2) NOT NULL,
  "maxDiscountAmount" numeric(12,2),
  "active" boolean NOT NULL DEFAULT true,
  "createdBy" text REFERENCES "user"("id"),
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "flash_sale_product" (
  "id" text PRIMARY KEY,
  "flashSaleId" text NOT NULL REFERENCES "flash_sale"("id") ON DELETE CASCADE,
  "productId" text NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
  "overridePrice" numeric(12,2),
  "stockLimit" integer,
  "soldCount" integer NOT NULL DEFAULT 0,
  UNIQUE("flashSaleId", "productId")
);

CREATE INDEX IF NOT EXISTS "idx_fsp_flashSaleId" ON "flash_sale_product"("flashSaleId");
CREATE INDEX IF NOT EXISTS "idx_fs_startsAt_endsAt" ON "flash_sale"("startsAt", "endsAt");
