-- ──────────────────────────────────────────────────────────────────────────
-- Mawrid — DB Patch Script (safe to run on existing DB)
-- Adds only MISSING columns and tables. Never drops or modifies existing data.
-- Run this in: Neon SQL editor / Supabase SQL editor / psql
-- ──────────────────────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════════
-- 1. New columns on existing tables
-- ═══════════════════════════════════════════════════════════════════

-- supplier
ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "commissionRate" numeric(5,2);

-- product
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'approved';

-- order_line
ALTER TABLE "order_line" ADD COLUMN IF NOT EXISTS "variantSku"     text;
ALTER TABLE "order_line" ADD COLUMN IF NOT EXISTS "variantOptions" jsonb NOT NULL DEFAULT '{}';
ALTER TABLE "order_line" ADD COLUMN IF NOT EXISTS "cartonQty"      integer NOT NULL DEFAULT 1;
ALTER TABLE "order_line" ADD COLUMN IF NOT EXISTS "unitsPerCarton" integer NOT NULL DEFAULT 1;

-- payout
ALTER TABLE "payout" ADD COLUMN IF NOT EXISTS "rejectionReason" text;
ALTER TABLE "payout" ADD COLUMN IF NOT EXISTS "adminNote"        text;
ALTER TABLE "payout" ADD COLUMN IF NOT EXISTS "requestedBy"      text;
ALTER TABLE "payout" ADD COLUMN IF NOT EXISTS "reviewedBy"       text;
ALTER TABLE "payout" ADD COLUMN IF NOT EXISTS "paidAt"           timestamp with time zone;

-- refund_request (may not exist yet — safe, handled below)
ALTER TABLE "refund_request" ADD COLUMN IF NOT EXISTS "returnTrackingNumber" text;
ALTER TABLE "refund_request" ADD COLUMN IF NOT EXISTS "images" jsonb NOT NULL DEFAULT '[]';

-- ═══════════════════════════════════════════════════════════════════
-- 2. New tables (all IF NOT EXISTS)
-- ═══════════════════════════════════════════════════════════════════

-- admin_collection
CREATE TABLE IF NOT EXISTS "admin_collection" (
  "key"       text PRIMARY KEY,
  "items"     jsonb NOT NULL DEFAULT '[]',
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now()
);

-- system_setting
CREATE TABLE IF NOT EXISTS "system_setting" (
  "key"       text PRIMARY KEY,
  "value"     text NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedBy" text
);

-- product_variant
CREATE TABLE IF NOT EXISTS "product_variant" (
  "id"                text PRIMARY KEY,
  "productId"         text NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
  "sku"               text NOT NULL UNIQUE,
  "barcode"           text,
  "price"             numeric(12,2) NOT NULL,
  "compareAtPrice"    numeric(12,2),
  "stock"             integer NOT NULL DEFAULT 0,
  "lowStockThreshold" integer NOT NULL DEFAULT 5,
  "weight"            numeric(8,3),
  "images"            jsonb NOT NULL DEFAULT '[]',
  "options"           jsonb NOT NULL DEFAULT '{}',
  "isDefault"         boolean NOT NULL DEFAULT false,
  "active"            boolean NOT NULL DEFAULT true,
  "createdAt"         timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt"         timestamp with time zone NOT NULL DEFAULT now()
);

-- order_line.variantId (depends on product_variant existing first)
ALTER TABLE "order_line"
  ADD COLUMN IF NOT EXISTS "variantId" text REFERENCES "product_variant"("id") ON DELETE SET NULL;

-- coupon
CREATE TABLE IF NOT EXISTS "coupon" (
  "id"                    text PRIMARY KEY,
  "code"                  text NOT NULL UNIQUE,
  "type"                  text NOT NULL DEFAULT 'percentage',
  "value"                 numeric(10,2) NOT NULL,
  "minOrderAmount"        numeric(12,2),
  "maxDiscountAmount"     numeric(12,2),
  "usageLimitTotal"       integer,
  "usageLimitPerCustomer" integer NOT NULL DEFAULT 1,
  "usedCount"             integer NOT NULL DEFAULT 0,
  "firstOrderOnly"        boolean NOT NULL DEFAULT false,
  "applicableProductIds"  jsonb NOT NULL DEFAULT '[]',
  "applicableCategoryIds" jsonb NOT NULL DEFAULT '[]',
  "startsAt"              timestamp with time zone,
  "expiresAt"             timestamp with time zone,
  "active"                boolean NOT NULL DEFAULT true,
  "createdBy"             text,
  "createdAt"             timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "coupon_usage" (
  "id"        text PRIMARY KEY,
  "couponId"  text NOT NULL REFERENCES "coupon"("id") ON DELETE CASCADE,
  "userId"    text NOT NULL,
  "orderId"   text REFERENCES "order"("id"),
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);

-- seller_earning
CREATE TABLE IF NOT EXISTS "seller_earning" (
  "id"               text PRIMARY KEY,
  "supplierId"       text NOT NULL REFERENCES "supplier"("id"),
  "orderId"          text NOT NULL REFERENCES "order"("id"),
  "grossAmount"      numeric(12,2) NOT NULL,
  "commissionRate"   numeric(5,2) NOT NULL,
  "commissionAmount" numeric(12,2) NOT NULL,
  "netEarning"       numeric(12,2) NOT NULL,
  "status"           text NOT NULL DEFAULT 'pending',
  "settledAt"        timestamp with time zone,
  "createdAt"        timestamp with time zone NOT NULL DEFAULT now()
);

-- refund_request
CREATE TABLE IF NOT EXISTS "refund_request" (
  "id"                   text PRIMARY KEY,
  "ref"                  text NOT NULL UNIQUE,
  "orderId"              text NOT NULL REFERENCES "order"("id"),
  "userId"               text NOT NULL,
  "items"                jsonb NOT NULL DEFAULT '[]',
  "reason"               text NOT NULL,
  "notes"                text,
  "status"               text NOT NULL DEFAULT 'pending',
  "refundAmount"         numeric(12,2),
  "adminNote"            text,
  "reviewedBy"           text,
  "reviewedAt"           timestamp with time zone,
  "returnTrackingNumber" text,
  "images"               jsonb NOT NULL DEFAULT '[]',
  "createdAt"            timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt"            timestamp with time zone NOT NULL DEFAULT now()
);

-- stock_movement
CREATE TABLE IF NOT EXISTS "stock_movement" (
  "id"         text PRIMARY KEY,
  "productId"  text NOT NULL REFERENCES "product"("id"),
  "variantId"  text REFERENCES "product_variant"("id"),
  "type"       text NOT NULL,
  "delta"      integer NOT NULL,
  "stockAfter" integer NOT NULL,
  "reference"  text,
  "reason"     text,
  "createdBy"  text,
  "createdAt"  timestamp with time zone NOT NULL DEFAULT now()
);

-- product_review
CREATE TABLE IF NOT EXISTS "product_review" (
  "id"           text PRIMARY KEY,
  "productId"    text NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
  "userId"       text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "orderId"      text REFERENCES "order"("id") ON DELETE SET NULL,
  "rating"       integer NOT NULL CHECK ("rating" BETWEEN 1 AND 5),
  "title"        text,
  "body"         text NOT NULL,
  "helpfulCount" integer NOT NULL DEFAULT 0,
  "verified"     boolean NOT NULL DEFAULT false,
  "createdAt"    timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt"    timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "review_reply" (
  "id"        text PRIMARY KEY,
  "reviewId"  text NOT NULL REFERENCES "product_review"("id") ON DELETE CASCADE,
  "userId"    text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "body"      text NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "review_helpful" (
  "id"        text PRIMARY KEY,
  "reviewId"  text NOT NULL REFERENCES "product_review"("id") ON DELETE CASCADE,
  "userId"    text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE ("reviewId", "userId")
);

-- product_approval_history
CREATE TABLE IF NOT EXISTS "product_approval_history" (
  "id"         text PRIMARY KEY,
  "productId"  text NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
  "supplierId" text NOT NULL REFERENCES "supplier"("id"),
  "status"     text NOT NULL,
  "reason"     text,
  "reviewedBy" text REFERENCES "user"("id"),
  "createdAt"  timestamp with time zone NOT NULL DEFAULT now()
);

-- flash_sale
CREATE TABLE IF NOT EXISTS "flash_sale" (
  "id"                text PRIMARY KEY,
  "name"              text NOT NULL,
  "nameEn"            text,
  "startsAt"          timestamp with time zone NOT NULL,
  "endsAt"            timestamp with time zone NOT NULL,
  "discountType"      text NOT NULL DEFAULT 'percentage',
  "discountValue"     numeric(12,2) NOT NULL,
  "maxDiscountAmount" numeric(12,2),
  "active"            boolean NOT NULL DEFAULT true,
  "createdBy"         text REFERENCES "user"("id"),
  "createdAt"         timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt"         timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "flash_sale_product" (
  "id"            text PRIMARY KEY,
  "flashSaleId"   text NOT NULL REFERENCES "flash_sale"("id") ON DELETE CASCADE,
  "productId"     text NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
  "overridePrice" numeric(12,2),
  "stockLimit"    integer,
  "soldCount"     integer NOT NULL DEFAULT 0,
  UNIQUE ("flashSaleId", "productId")
);

-- loyalty
CREATE TABLE IF NOT EXISTS "loyalty_account" (
  "id"               text PRIMARY KEY,
  "userId"           text NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
  "balance"          integer NOT NULL DEFAULT 0,
  "lifetimeEarned"   integer NOT NULL DEFAULT 0,
  "lifetimeRedeemed" integer NOT NULL DEFAULT 0,
  "updatedAt"        timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "loyalty_transaction" (
  "id"            text PRIMARY KEY,
  "userId"        text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "orderId"       text REFERENCES "order"("id"),
  "type"          text NOT NULL,
  "points"        integer NOT NULL,
  "balanceBefore" integer NOT NULL,
  "balanceAfter"  integer NOT NULL,
  "note"          text,
  "createdAt"     timestamp with time zone NOT NULL DEFAULT now()
);

-- referrals
CREATE TABLE IF NOT EXISTS "referral_code" (
  "id"         text PRIMARY KEY,
  "userId"     text NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
  "code"       text NOT NULL UNIQUE,
  "usageCount" integer NOT NULL DEFAULT 0,
  "createdAt"  timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "referral" (
  "id"            text PRIMARY KEY,
  "referrerId"    text NOT NULL REFERENCES "user"("id"),
  "refereeId"     text NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
  "code"          text NOT NULL,
  "status"        text NOT NULL DEFAULT 'pending',
  "referrerBonus" integer NOT NULL DEFAULT 0,
  "refereeBonus"  integer NOT NULL DEFAULT 0,
  "rewardedAt"    timestamp with time zone,
  "createdAt"     timestamp with time zone NOT NULL DEFAULT now()
);

-- notifications
CREATE TABLE IF NOT EXISTS "notification" (
  "id"        text PRIMARY KEY,
  "userId"    text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "type"      text NOT NULL,
  "title"     text NOT NULL,
  "body"      text NOT NULL,
  "link"      text,
  "read"      boolean NOT NULL DEFAULT false,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);

-- shipping_rule
CREATE TABLE IF NOT EXISTS "shipping_rule" (
  "id"             text PRIMARY KEY,
  "zoneId"         text NOT NULL REFERENCES "delivery_zone"("id") ON DELETE CASCADE,
  "name"           text NOT NULL,
  "minOrderAmount" numeric(12,2) NOT NULL DEFAULT '0',
  "maxOrderAmount" numeric(12,2),
  "freeAbove"      numeric(12,2),
  "baseFee"        numeric(12,2) NOT NULL DEFAULT '0',
  "perKgFee"       numeric(12,2) NOT NULL DEFAULT '0',
  "estimatedDays"  integer NOT NULL DEFAULT 3,
  "active"         boolean NOT NULL DEFAULT true,
  "createdAt"      timestamp with time zone NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════
-- 3. Indexes
-- ═══════════════════════════════════════════════════════════════════

CREATE UNIQUE INDEX IF NOT EXISTS "favorite_user_product_unique"    ON "favorite" ("userId","productId");
CREATE INDEX IF NOT EXISTS "idx_product_variant_productId"          ON "product_variant"("productId");
CREATE INDEX IF NOT EXISTS "idx_product_variant_sku"                ON "product_variant"("sku");
CREATE INDEX IF NOT EXISTS "idx_coupon_code"                        ON "coupon"("code");
CREATE INDEX IF NOT EXISTS "idx_coupon_active"                      ON "coupon"("active");
CREATE INDEX IF NOT EXISTS "idx_coupon_usage_couponId_userId"       ON "coupon_usage"("couponId","userId");
CREATE INDEX IF NOT EXISTS "idx_seller_earning_supplierId"          ON "seller_earning"("supplierId");
CREATE INDEX IF NOT EXISTS "idx_seller_earning_orderId"             ON "seller_earning"("orderId");
CREATE INDEX IF NOT EXISTS "idx_seller_earning_status"              ON "seller_earning"("status");
CREATE INDEX IF NOT EXISTS "idx_refund_request_orderId"             ON "refund_request"("orderId");
CREATE INDEX IF NOT EXISTS "idx_refund_request_userId"              ON "refund_request"("userId");
CREATE INDEX IF NOT EXISTS "idx_refund_request_status"              ON "refund_request"("status");
CREATE INDEX IF NOT EXISTS "idx_stock_movement_productId"           ON "stock_movement"("productId");
CREATE INDEX IF NOT EXISTS "idx_stock_movement_type"                ON "stock_movement"("type");
CREATE INDEX IF NOT EXISTS "idx_review_product"                     ON "product_review"("productId");
CREATE INDEX IF NOT EXISTS "idx_review_user"                        ON "product_review"("userId");
CREATE INDEX IF NOT EXISTS "idx_reply_review"                       ON "review_reply"("reviewId");
CREATE INDEX IF NOT EXISTS "idx_pah_productId"                      ON "product_approval_history"("productId");
CREATE INDEX IF NOT EXISTS "idx_fsp_flashSaleId"                    ON "flash_sale_product"("flashSaleId");
CREATE INDEX IF NOT EXISTS "idx_fs_startsAt_endsAt"                 ON "flash_sale"("startsAt","endsAt");
CREATE INDEX IF NOT EXISTS "idx_lt_userId"                          ON "loyalty_transaction"("userId");
CREATE INDEX IF NOT EXISTS "idx_la_userId"                          ON "loyalty_account"("userId");
CREATE INDEX IF NOT EXISTS "idx_ref_referrerId"                     ON "referral"("referrerId");
CREATE INDEX IF NOT EXISTS "idx_notif_userId_read"                  ON "notification"("userId","read");
CREATE INDEX IF NOT EXISTS "idx_sr_zoneId"                          ON "shipping_rule"("zoneId");

-- ═══════════════════════════════════════════════════════════════════
-- 4. Default system settings (won't overwrite existing values)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO "system_setting" ("key","value","updatedAt") VALUES
  ('businessMode',                   'b2b',                   now()),
  ('shippingResponsibility',         'seller',                now()),
  ('taxEnabled',                     'false',                 now()),
  ('taxRate',                        '15',                    now()),
  ('paymentMethods',                 '["cod","bank_transfer"]',now()),
  ('guestCheckout',                  'false',                 now()),
  ('productApprovalRequired',        'false',                 now()),
  ('defaultSellerCommissionPercent', '10',                    now()),
  ('refundAllowedDays',              '7',                     now()),
  ('lowStockThreshold',              '10',                    now())
ON CONFLICT ("key") DO NOTHING;
