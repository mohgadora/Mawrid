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

-- driver
ALTER TABLE "driver" ADD COLUMN IF NOT EXISTS "city" text;

-- order — guest checkout + cart coupons (PR #13)
-- Guest orders carry a guestId instead of a userId, so userId becomes nullable.
ALTER TABLE "order" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "guestId"    text;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "couponId"   text;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "couponCode" text;

-- coupon_usage — record the discount that was applied
ALTER TABLE "coupon_usage" ADD COLUMN IF NOT EXISTS "discountAmount" numeric(12,2) NOT NULL DEFAULT '0';

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

-- guest_user (guest checkout — stores buyer contact details for guest orders)
CREATE TABLE IF NOT EXISTS "guest_user" (
  "id"        text PRIMARY KEY,
  "email"     text,
  "phone"     text,
  "fullName"  text,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);

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

-- ═══════════════════════════════════════════════════════════════════
-- 5. Column sync (self-healing) — adds ANY column the app's schema
--    (lib/db/schema.ts) expects but that an older database is missing.
--    Auto-derived from scripts/full-schema.sql. All statements are
--    idempotent (ADD COLUMN IF NOT EXISTS) and never drop or alter data.
--    Fixes admin pages that do a full SELECT and 500 on a missing column
--    (buyers → user, countries → country, orders → order, etc.).
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "accountId" text;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "providerId" text;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "userId" text;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "accessToken" text;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "refreshToken" text;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "idToken" text;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "accessTokenExpiresAt" timestamp with time zone;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" timestamp with time zone;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "scope" text;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "password" text;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone;
ALTER TABLE "address" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "address" ADD COLUMN IF NOT EXISTS "userId" text;
ALTER TABLE "address" ADD COLUMN IF NOT EXISTS "label" text DEFAULT 'Home'::text NOT NULL;
ALTER TABLE "address" ADD COLUMN IF NOT EXISTS "fullName" text;
ALTER TABLE "address" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "address" ADD COLUMN IF NOT EXISTS "line1" text;
ALTER TABLE "address" ADD COLUMN IF NOT EXISTS "line2" text;
ALTER TABLE "address" ADD COLUMN IF NOT EXISTS "city" text;
ALTER TABLE "address" ADD COLUMN IF NOT EXISTS "region" text;
ALTER TABLE "address" ADD COLUMN IF NOT EXISTS "country" text DEFAULT 'SA'::text NOT NULL;
ALTER TABLE "address" ADD COLUMN IF NOT EXISTS "postalCode" text;
ALTER TABLE "address" ADD COLUMN IF NOT EXISTS "isDefault" boolean DEFAULT false NOT NULL;
ALTER TABLE "address" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "admin_collection" ADD COLUMN IF NOT EXISTS "key" text;
ALTER TABLE "admin_collection" ADD COLUMN IF NOT EXISTS "items" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "admin_collection" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "userId" text;
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "action" text;
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "entity" text;
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "entityId" text;
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "diff" jsonb;
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "ip" text;
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "category" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "category" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "category" ADD COLUMN IF NOT EXISTS "nameAr" text;
ALTER TABLE "category" ADD COLUMN IF NOT EXISTS "slug" text;
ALTER TABLE "category" ADD COLUMN IF NOT EXISTS "icon" text;
ALTER TABLE "category" ADD COLUMN IF NOT EXISTS "parentId" text;
ALTER TABLE "category" ADD COLUMN IF NOT EXISTS "sortOrder" integer DEFAULT 0 NOT NULL;
ALTER TABLE "category" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "country" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "country" ADD COLUMN IF NOT EXISTS "code" text;
ALTER TABLE "country" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "country" ADD COLUMN IF NOT EXISTS "nameAr" text;
ALTER TABLE "country" ADD COLUMN IF NOT EXISTS "currency" text DEFAULT 'SAR'::text NOT NULL;
ALTER TABLE "country" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true NOT NULL;
ALTER TABLE "coupon" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "coupon" ADD COLUMN IF NOT EXISTS "code" text;
ALTER TABLE "coupon" ADD COLUMN IF NOT EXISTS "type" text DEFAULT 'percentage'::text NOT NULL;
ALTER TABLE "coupon" ADD COLUMN IF NOT EXISTS "value" numeric(10,2);
ALTER TABLE "coupon" ADD COLUMN IF NOT EXISTS "minOrderAmount" numeric(12,2);
ALTER TABLE "coupon" ADD COLUMN IF NOT EXISTS "maxDiscountAmount" numeric(12,2);
ALTER TABLE "coupon" ADD COLUMN IF NOT EXISTS "usageLimitTotal" integer;
ALTER TABLE "coupon" ADD COLUMN IF NOT EXISTS "usageLimitPerCustomer" integer DEFAULT 1 NOT NULL;
ALTER TABLE "coupon" ADD COLUMN IF NOT EXISTS "usedCount" integer DEFAULT 0 NOT NULL;
ALTER TABLE "coupon" ADD COLUMN IF NOT EXISTS "firstOrderOnly" boolean DEFAULT false NOT NULL;
ALTER TABLE "coupon" ADD COLUMN IF NOT EXISTS "applicableProductIds" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "coupon" ADD COLUMN IF NOT EXISTS "applicableCategoryIds" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "coupon" ADD COLUMN IF NOT EXISTS "startsAt" timestamp with time zone;
ALTER TABLE "coupon" ADD COLUMN IF NOT EXISTS "expiresAt" timestamp with time zone;
ALTER TABLE "coupon" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true NOT NULL;
ALTER TABLE "coupon" ADD COLUMN IF NOT EXISTS "createdBy" text;
ALTER TABLE "coupon" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "coupon_usage" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "coupon_usage" ADD COLUMN IF NOT EXISTS "couponId" text;
ALTER TABLE "coupon_usage" ADD COLUMN IF NOT EXISTS "userId" text;
ALTER TABLE "coupon_usage" ADD COLUMN IF NOT EXISTS "orderId" text;
ALTER TABLE "coupon_usage" ADD COLUMN IF NOT EXISTS "discountAmount" numeric(12,2) DEFAULT '0'::numeric NOT NULL;
ALTER TABLE "coupon_usage" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "delivery_zone" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "delivery_zone" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "delivery_zone" ADD COLUMN IF NOT EXISTS "nameAr" text;
ALTER TABLE "delivery_zone" ADD COLUMN IF NOT EXISTS "country" text DEFAULT 'SA'::text NOT NULL;
ALTER TABLE "delivery_zone" ADD COLUMN IF NOT EXISTS "shippingFee" numeric(12,2) DEFAULT '0'::numeric NOT NULL;
ALTER TABLE "delivery_zone" ADD COLUMN IF NOT EXISTS "freeOverAmount" numeric(12,2);
ALTER TABLE "delivery_zone" ADD COLUMN IF NOT EXISTS "estimatedDays" integer DEFAULT 3 NOT NULL;
ALTER TABLE "delivery_zone" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true NOT NULL;
ALTER TABLE "delivery_zone" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "driver" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "driver" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "driver" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "driver" ADD COLUMN IF NOT EXISTS "vehicle" text;
ALTER TABLE "driver" ADD COLUMN IF NOT EXISTS "vehiclePlate" text;
ALTER TABLE "driver" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'offline'::text NOT NULL;
ALTER TABLE "driver" ADD COLUMN IF NOT EXISTS "lat" numeric(10,7);
ALTER TABLE "driver" ADD COLUMN IF NOT EXISTS "lng" numeric(10,7);
ALTER TABLE "driver" ADD COLUMN IF NOT EXISTS "currentOrderId" text;
ALTER TABLE "driver" ADD COLUMN IF NOT EXISTS "userId" text;
ALTER TABLE "driver" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "driver" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "favorite" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "favorite" ADD COLUMN IF NOT EXISTS "userId" text;
ALTER TABLE "favorite" ADD COLUMN IF NOT EXISTS "productId" text;
ALTER TABLE "favorite" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "flash_sale" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "flash_sale" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "flash_sale" ADD COLUMN IF NOT EXISTS "nameEn" text;
ALTER TABLE "flash_sale" ADD COLUMN IF NOT EXISTS "startsAt" timestamp with time zone;
ALTER TABLE "flash_sale" ADD COLUMN IF NOT EXISTS "endsAt" timestamp with time zone;
ALTER TABLE "flash_sale" ADD COLUMN IF NOT EXISTS "discountType" text DEFAULT 'percentage'::text NOT NULL;
ALTER TABLE "flash_sale" ADD COLUMN IF NOT EXISTS "discountValue" numeric(12,2);
ALTER TABLE "flash_sale" ADD COLUMN IF NOT EXISTS "maxDiscountAmount" numeric(12,2);
ALTER TABLE "flash_sale" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true NOT NULL;
ALTER TABLE "flash_sale" ADD COLUMN IF NOT EXISTS "createdBy" text;
ALTER TABLE "flash_sale" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "flash_sale" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "flash_sale_product" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "flash_sale_product" ADD COLUMN IF NOT EXISTS "flashSaleId" text;
ALTER TABLE "flash_sale_product" ADD COLUMN IF NOT EXISTS "productId" text;
ALTER TABLE "flash_sale_product" ADD COLUMN IF NOT EXISTS "overridePrice" numeric(12,2);
ALTER TABLE "flash_sale_product" ADD COLUMN IF NOT EXISTS "stockLimit" integer;
ALTER TABLE "flash_sale_product" ADD COLUMN IF NOT EXISTS "soldCount" integer DEFAULT 0 NOT NULL;
ALTER TABLE "guest_user" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "guest_user" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "guest_user" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "guest_user" ADD COLUMN IF NOT EXISTS "fullName" text;
ALTER TABLE "guest_user" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "kyc_approval" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "kyc_approval" ADD COLUMN IF NOT EXISTS "userId" text;
ALTER TABLE "kyc_approval" ADD COLUMN IF NOT EXISTS "type" text DEFAULT 'merchant'::text NOT NULL;
ALTER TABLE "kyc_approval" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'::text NOT NULL;
ALTER TABLE "kyc_approval" ADD COLUMN IF NOT EXISTS "crNumber" text;
ALTER TABLE "kyc_approval" ADD COLUMN IF NOT EXISTS "vatNumber" text;
ALTER TABLE "kyc_approval" ADD COLUMN IF NOT EXISTS "documents" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "kyc_approval" ADD COLUMN IF NOT EXISTS "reviewedBy" text;
ALTER TABLE "kyc_approval" ADD COLUMN IF NOT EXISTS "reviewNote" text;
ALTER TABLE "kyc_approval" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "kyc_approval" ADD COLUMN IF NOT EXISTS "reviewedAt" timestamp with time zone;
ALTER TABLE "loyalty_account" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "loyalty_account" ADD COLUMN IF NOT EXISTS "userId" text;
ALTER TABLE "loyalty_account" ADD COLUMN IF NOT EXISTS "balance" integer DEFAULT 0 NOT NULL;
ALTER TABLE "loyalty_account" ADD COLUMN IF NOT EXISTS "lifetimeEarned" integer DEFAULT 0 NOT NULL;
ALTER TABLE "loyalty_account" ADD COLUMN IF NOT EXISTS "lifetimeRedeemed" integer DEFAULT 0 NOT NULL;
ALTER TABLE "loyalty_account" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "loyalty_transaction" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "loyalty_transaction" ADD COLUMN IF NOT EXISTS "userId" text;
ALTER TABLE "loyalty_transaction" ADD COLUMN IF NOT EXISTS "orderId" text;
ALTER TABLE "loyalty_transaction" ADD COLUMN IF NOT EXISTS "type" text;
ALTER TABLE "loyalty_transaction" ADD COLUMN IF NOT EXISTS "points" integer;
ALTER TABLE "loyalty_transaction" ADD COLUMN IF NOT EXISTS "balanceBefore" integer;
ALTER TABLE "loyalty_transaction" ADD COLUMN IF NOT EXISTS "balanceAfter" integer;
ALTER TABLE "loyalty_transaction" ADD COLUMN IF NOT EXISTS "note" text;
ALTER TABLE "loyalty_transaction" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "notification" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "notification" ADD COLUMN IF NOT EXISTS "userId" text;
ALTER TABLE "notification" ADD COLUMN IF NOT EXISTS "type" text;
ALTER TABLE "notification" ADD COLUMN IF NOT EXISTS "title" text;
ALTER TABLE "notification" ADD COLUMN IF NOT EXISTS "body" text;
ALTER TABLE "notification" ADD COLUMN IF NOT EXISTS "link" text;
ALTER TABLE "notification" ADD COLUMN IF NOT EXISTS "read" boolean DEFAULT false NOT NULL;
ALTER TABLE "notification" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "ref" text;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "userId" text;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "guestId" text;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "couponId" text;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "couponCode" text;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "supplierId" text;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'::text NOT NULL;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "addressId" text;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "shippingAddress" jsonb;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "paymentMethod" text DEFAULT 'cod'::text NOT NULL;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "paymentStatus" text DEFAULT 'unpaid'::text NOT NULL;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "subtotal" numeric(12,2) DEFAULT '0'::numeric NOT NULL;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "shippingFee" numeric(12,2) DEFAULT '0'::numeric NOT NULL;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "discount" numeric(12,2) DEFAULT '0'::numeric NOT NULL;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "total" numeric(12,2) DEFAULT '0'::numeric NOT NULL;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "estimatedDelivery" date;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "deliveredAt" timestamp with time zone;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "order_event" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "order_event" ADD COLUMN IF NOT EXISTS "orderId" text;
ALTER TABLE "order_event" ADD COLUMN IF NOT EXISTS "status" text;
ALTER TABLE "order_event" ADD COLUMN IF NOT EXISTS "note" text;
ALTER TABLE "order_event" ADD COLUMN IF NOT EXISTS "createdBy" text;
ALTER TABLE "order_event" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "order_line" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "order_line" ADD COLUMN IF NOT EXISTS "orderId" text;
ALTER TABLE "order_line" ADD COLUMN IF NOT EXISTS "productId" text;
ALTER TABLE "order_line" ADD COLUMN IF NOT EXISTS "variantId" text;
ALTER TABLE "order_line" ADD COLUMN IF NOT EXISTS "productName" text;
ALTER TABLE "order_line" ADD COLUMN IF NOT EXISTS "productImage" text;
ALTER TABLE "order_line" ADD COLUMN IF NOT EXISTS "sku" text;
ALTER TABLE "order_line" ADD COLUMN IF NOT EXISTS "variantSku" text;
ALTER TABLE "order_line" ADD COLUMN IF NOT EXISTS "variantOptions" jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE "order_line" ADD COLUMN IF NOT EXISTS "qty" integer;
ALTER TABLE "order_line" ADD COLUMN IF NOT EXISTS "unitPrice" numeric(12,2);
ALTER TABLE "order_line" ADD COLUMN IF NOT EXISTS "cartonQty" integer DEFAULT 1 NOT NULL;
ALTER TABLE "order_line" ADD COLUMN IF NOT EXISTS "unitsPerCarton" integer DEFAULT 1 NOT NULL;
ALTER TABLE "order_line" ADD COLUMN IF NOT EXISTS "subtotal" numeric(12,2);
ALTER TABLE "order_template" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "order_template" ADD COLUMN IF NOT EXISTS "userId" text;
ALTER TABLE "order_template" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "order_template" ADD COLUMN IF NOT EXISTS "items" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "order_template" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "order_template" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "payout" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "payout" ADD COLUMN IF NOT EXISTS "supplierId" text;
ALTER TABLE "payout" ADD COLUMN IF NOT EXISTS "amount" numeric(12,2);
ALTER TABLE "payout" ADD COLUMN IF NOT EXISTS "currency" text DEFAULT 'SAR'::text NOT NULL;
ALTER TABLE "payout" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'::text NOT NULL;
ALTER TABLE "payout" ADD COLUMN IF NOT EXISTS "reference" text;
ALTER TABLE "payout" ADD COLUMN IF NOT EXISTS "bankAccount" jsonb;
ALTER TABLE "payout" ADD COLUMN IF NOT EXISTS "rejectionReason" text;
ALTER TABLE "payout" ADD COLUMN IF NOT EXISTS "adminNote" text;
ALTER TABLE "payout" ADD COLUMN IF NOT EXISTS "requestedBy" text;
ALTER TABLE "payout" ADD COLUMN IF NOT EXISTS "reviewedBy" text;
ALTER TABLE "payout" ADD COLUMN IF NOT EXISTS "paidAt" timestamp with time zone;
ALTER TABLE "payout" ADD COLUMN IF NOT EXISTS "processedAt" timestamp with time zone;
ALTER TABLE "payout" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "price_tier" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "price_tier" ADD COLUMN IF NOT EXISTS "productId" text;
ALTER TABLE "price_tier" ADD COLUMN IF NOT EXISTS "minQty" integer;
ALTER TABLE "price_tier" ADD COLUMN IF NOT EXISTS "maxQty" integer;
ALTER TABLE "price_tier" ADD COLUMN IF NOT EXISTS "price" numeric(12,2);
ALTER TABLE "price_tier" ADD COLUMN IF NOT EXISTS "sortOrder" integer DEFAULT 0 NOT NULL;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "sku" text;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "nameAr" text;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "descriptionAr" text;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "categoryId" text;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "supplierId" text;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "imageUrl" text;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "images" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "unitsPerCarton" integer DEFAULT 1 NOT NULL;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "weight" numeric(8,3);
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "tags" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "marketAvgPrice" numeric(12,2);
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "stock" integer DEFAULT 0 NOT NULL;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true NOT NULL;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "featured" boolean DEFAULT false NOT NULL;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'approved'::text NOT NULL;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "product_approval_history" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "product_approval_history" ADD COLUMN IF NOT EXISTS "productId" text;
ALTER TABLE "product_approval_history" ADD COLUMN IF NOT EXISTS "supplierId" text;
ALTER TABLE "product_approval_history" ADD COLUMN IF NOT EXISTS "status" text;
ALTER TABLE "product_approval_history" ADD COLUMN IF NOT EXISTS "reason" text;
ALTER TABLE "product_approval_history" ADD COLUMN IF NOT EXISTS "reviewedBy" text;
ALTER TABLE "product_approval_history" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "product_review" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "product_review" ADD COLUMN IF NOT EXISTS "productId" text;
ALTER TABLE "product_review" ADD COLUMN IF NOT EXISTS "userId" text;
ALTER TABLE "product_review" ADD COLUMN IF NOT EXISTS "orderId" text;
ALTER TABLE "product_review" ADD COLUMN IF NOT EXISTS "rating" integer;
ALTER TABLE "product_review" ADD COLUMN IF NOT EXISTS "title" text;
ALTER TABLE "product_review" ADD COLUMN IF NOT EXISTS "body" text;
ALTER TABLE "product_review" ADD COLUMN IF NOT EXISTS "helpfulCount" integer DEFAULT 0 NOT NULL;
ALTER TABLE "product_review" ADD COLUMN IF NOT EXISTS "verified" boolean DEFAULT false NOT NULL;
ALTER TABLE "product_review" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "product_review" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "product_variant" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "product_variant" ADD COLUMN IF NOT EXISTS "productId" text;
ALTER TABLE "product_variant" ADD COLUMN IF NOT EXISTS "sku" text;
ALTER TABLE "product_variant" ADD COLUMN IF NOT EXISTS "barcode" text;
ALTER TABLE "product_variant" ADD COLUMN IF NOT EXISTS "price" numeric(12,2);
ALTER TABLE "product_variant" ADD COLUMN IF NOT EXISTS "compareAtPrice" numeric(12,2);
ALTER TABLE "product_variant" ADD COLUMN IF NOT EXISTS "stock" integer DEFAULT 0 NOT NULL;
ALTER TABLE "product_variant" ADD COLUMN IF NOT EXISTS "lowStockThreshold" integer DEFAULT 5 NOT NULL;
ALTER TABLE "product_variant" ADD COLUMN IF NOT EXISTS "weight" numeric(8,3);
ALTER TABLE "product_variant" ADD COLUMN IF NOT EXISTS "images" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "product_variant" ADD COLUMN IF NOT EXISTS "options" jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE "product_variant" ADD COLUMN IF NOT EXISTS "isDefault" boolean DEFAULT false NOT NULL;
ALTER TABLE "product_variant" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true NOT NULL;
ALTER TABLE "product_variant" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "product_variant" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "referral" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "referral" ADD COLUMN IF NOT EXISTS "referrerId" text;
ALTER TABLE "referral" ADD COLUMN IF NOT EXISTS "refereeId" text;
ALTER TABLE "referral" ADD COLUMN IF NOT EXISTS "code" text;
ALTER TABLE "referral" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'::text NOT NULL;
ALTER TABLE "referral" ADD COLUMN IF NOT EXISTS "referrerBonus" integer DEFAULT 0 NOT NULL;
ALTER TABLE "referral" ADD COLUMN IF NOT EXISTS "refereeBonus" integer DEFAULT 0 NOT NULL;
ALTER TABLE "referral" ADD COLUMN IF NOT EXISTS "rewardedAt" timestamp with time zone;
ALTER TABLE "referral" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "referral_code" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "referral_code" ADD COLUMN IF NOT EXISTS "userId" text;
ALTER TABLE "referral_code" ADD COLUMN IF NOT EXISTS "code" text;
ALTER TABLE "referral_code" ADD COLUMN IF NOT EXISTS "usageCount" integer DEFAULT 0 NOT NULL;
ALTER TABLE "referral_code" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "refund_request" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "refund_request" ADD COLUMN IF NOT EXISTS "ref" text;
ALTER TABLE "refund_request" ADD COLUMN IF NOT EXISTS "orderId" text;
ALTER TABLE "refund_request" ADD COLUMN IF NOT EXISTS "userId" text;
ALTER TABLE "refund_request" ADD COLUMN IF NOT EXISTS "items" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "refund_request" ADD COLUMN IF NOT EXISTS "reason" text;
ALTER TABLE "refund_request" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "refund_request" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'::text NOT NULL;
ALTER TABLE "refund_request" ADD COLUMN IF NOT EXISTS "refundAmount" numeric(12,2);
ALTER TABLE "refund_request" ADD COLUMN IF NOT EXISTS "adminNote" text;
ALTER TABLE "refund_request" ADD COLUMN IF NOT EXISTS "reviewedBy" text;
ALTER TABLE "refund_request" ADD COLUMN IF NOT EXISTS "reviewedAt" timestamp with time zone;
ALTER TABLE "refund_request" ADD COLUMN IF NOT EXISTS "returnTrackingNumber" text;
ALTER TABLE "refund_request" ADD COLUMN IF NOT EXISTS "images" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "refund_request" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "refund_request" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "review_helpful" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "review_helpful" ADD COLUMN IF NOT EXISTS "reviewId" text;
ALTER TABLE "review_helpful" ADD COLUMN IF NOT EXISTS "userId" text;
ALTER TABLE "review_helpful" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "review_reply" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "review_reply" ADD COLUMN IF NOT EXISTS "reviewId" text;
ALTER TABLE "review_reply" ADD COLUMN IF NOT EXISTS "userId" text;
ALTER TABLE "review_reply" ADD COLUMN IF NOT EXISTS "body" text;
ALTER TABLE "review_reply" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "seller_earning" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "seller_earning" ADD COLUMN IF NOT EXISTS "supplierId" text;
ALTER TABLE "seller_earning" ADD COLUMN IF NOT EXISTS "orderId" text;
ALTER TABLE "seller_earning" ADD COLUMN IF NOT EXISTS "grossAmount" numeric(12,2);
ALTER TABLE "seller_earning" ADD COLUMN IF NOT EXISTS "commissionRate" numeric(5,2);
ALTER TABLE "seller_earning" ADD COLUMN IF NOT EXISTS "commissionAmount" numeric(12,2);
ALTER TABLE "seller_earning" ADD COLUMN IF NOT EXISTS "netEarning" numeric(12,2);
ALTER TABLE "seller_earning" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'::text NOT NULL;
ALTER TABLE "seller_earning" ADD COLUMN IF NOT EXISTS "settledAt" timestamp with time zone;
ALTER TABLE "seller_earning" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "expiresAt" timestamp with time zone;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "token" text;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "ipAddress" text;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "userAgent" text;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "userId" text;
ALTER TABLE "shipping_rule" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "shipping_rule" ADD COLUMN IF NOT EXISTS "zoneId" text;
ALTER TABLE "shipping_rule" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "shipping_rule" ADD COLUMN IF NOT EXISTS "minOrderAmount" numeric(12,2) DEFAULT '0'::numeric NOT NULL;
ALTER TABLE "shipping_rule" ADD COLUMN IF NOT EXISTS "maxOrderAmount" numeric(12,2);
ALTER TABLE "shipping_rule" ADD COLUMN IF NOT EXISTS "freeAbove" numeric(12,2);
ALTER TABLE "shipping_rule" ADD COLUMN IF NOT EXISTS "baseFee" numeric(12,2) DEFAULT '0'::numeric NOT NULL;
ALTER TABLE "shipping_rule" ADD COLUMN IF NOT EXISTS "perKgFee" numeric(12,2) DEFAULT '0'::numeric NOT NULL;
ALTER TABLE "shipping_rule" ADD COLUMN IF NOT EXISTS "estimatedDays" integer DEFAULT 3 NOT NULL;
ALTER TABLE "shipping_rule" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true NOT NULL;
ALTER TABLE "shipping_rule" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "stock_movement" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "stock_movement" ADD COLUMN IF NOT EXISTS "productId" text;
ALTER TABLE "stock_movement" ADD COLUMN IF NOT EXISTS "variantId" text;
ALTER TABLE "stock_movement" ADD COLUMN IF NOT EXISTS "type" text;
ALTER TABLE "stock_movement" ADD COLUMN IF NOT EXISTS "delta" integer;
ALTER TABLE "stock_movement" ADD COLUMN IF NOT EXISTS "stockAfter" integer;
ALTER TABLE "stock_movement" ADD COLUMN IF NOT EXISTS "reference" text;
ALTER TABLE "stock_movement" ADD COLUMN IF NOT EXISTS "reason" text;
ALTER TABLE "stock_movement" ADD COLUMN IF NOT EXISTS "createdBy" text;
ALTER TABLE "stock_movement" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "nameAr" text;
ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "logo" text;
ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "country" text DEFAULT 'SA'::text NOT NULL;
ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "city" text;
ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "rating" numeric(3,2) DEFAULT 0 NOT NULL;
ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "reviewCount" integer DEFAULT 0 NOT NULL;
ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "verified" boolean DEFAULT false NOT NULL;
ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "responseTime" text;
ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "minOrder" integer DEFAULT 1 NOT NULL;
ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "commissionRate" numeric(5,2);
ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "userId" text;
ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "support_ticket" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "support_ticket" ADD COLUMN IF NOT EXISTS "ref" text;
ALTER TABLE "support_ticket" ADD COLUMN IF NOT EXISTS "userId" text;
ALTER TABLE "support_ticket" ADD COLUMN IF NOT EXISTS "orderId" text;
ALTER TABLE "support_ticket" ADD COLUMN IF NOT EXISTS "subject" text;
ALTER TABLE "support_ticket" ADD COLUMN IF NOT EXISTS "body" text;
ALTER TABLE "support_ticket" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'open'::text NOT NULL;
ALTER TABLE "support_ticket" ADD COLUMN IF NOT EXISTS "priority" text DEFAULT 'medium'::text NOT NULL;
ALTER TABLE "support_ticket" ADD COLUMN IF NOT EXISTS "assignedTo" text;
ALTER TABLE "support_ticket" ADD COLUMN IF NOT EXISTS "resolvedAt" timestamp with time zone;
ALTER TABLE "support_ticket" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "support_ticket" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "system_setting" ADD COLUMN IF NOT EXISTS "key" text;
ALTER TABLE "system_setting" ADD COLUMN IF NOT EXISTS "value" text;
ALTER TABLE "system_setting" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "system_setting" ADD COLUMN IF NOT EXISTS "updatedBy" text;
ALTER TABLE "ticket_message" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "ticket_message" ADD COLUMN IF NOT EXISTS "ticketId" text;
ALTER TABLE "ticket_message" ADD COLUMN IF NOT EXISTS "userId" text;
ALTER TABLE "ticket_message" ADD COLUMN IF NOT EXISTS "body" text;
ALTER TABLE "ticket_message" ADD COLUMN IF NOT EXISTS "isStaff" boolean DEFAULT false NOT NULL;
ALTER TABLE "ticket_message" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "transaction" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "transaction" ADD COLUMN IF NOT EXISTS "userId" text;
ALTER TABLE "transaction" ADD COLUMN IF NOT EXISTS "orderId" text;
ALTER TABLE "transaction" ADD COLUMN IF NOT EXISTS "type" text;
ALTER TABLE "transaction" ADD COLUMN IF NOT EXISTS "amount" numeric(12,2);
ALTER TABLE "transaction" ADD COLUMN IF NOT EXISTS "currency" text DEFAULT 'SAR'::text NOT NULL;
ALTER TABLE "transaction" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'completed'::text NOT NULL;
ALTER TABLE "transaction" ADD COLUMN IF NOT EXISTS "gateway" text;
ALTER TABLE "transaction" ADD COLUMN IF NOT EXISTS "reference" text;
ALTER TABLE "transaction" ADD COLUMN IF NOT EXISTS "meta" jsonb;
ALTER TABLE "transaction" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "emailVerified" boolean DEFAULT false NOT NULL;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "image" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'consumer'::text NOT NULL;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "company" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "vatNumber" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "country" text DEFAULT 'SA'::text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banned" boolean DEFAULT false;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banReason" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banExpires" timestamp with time zone;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone;
ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "id" text;
ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "identifier" text;
ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "value" text;
ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "expiresAt" timestamp with time zone;
ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone;
ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone;
