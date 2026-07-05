-- Phase 1: System Settings, Product Variants, Coupons, Seller Earnings, Refunds, Stock Movements

-- ── system_setting ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "system_setting" (
  "key"        text PRIMARY KEY,
  "value"      text NOT NULL,
  "updatedAt"  timestamp with time zone NOT NULL DEFAULT now(),
  "updatedBy"  text
);

-- ── product_variant ────────────────────────────────────────────────────────
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

CREATE INDEX IF NOT EXISTS "idx_product_variant_productId" ON "product_variant"("productId");
CREATE INDEX IF NOT EXISTS "idx_product_variant_sku" ON "product_variant"("sku");

-- ── coupon ────────────────────────────────────────────────────────────────
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

CREATE INDEX IF NOT EXISTS "idx_coupon_code" ON "coupon"("code");
CREATE INDEX IF NOT EXISTS "idx_coupon_active" ON "coupon"("active");

-- ── coupon_usage ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "coupon_usage" (
  "id"        text PRIMARY KEY,
  "couponId"  text NOT NULL REFERENCES "coupon"("id") ON DELETE CASCADE,
  "userId"    text NOT NULL,
  "orderId"   text REFERENCES "order"("id"),
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_coupon_usage_couponId_userId" ON "coupon_usage"("couponId","userId");

-- ── seller_earning ────────────────────────────────────────────────────────
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

CREATE INDEX IF NOT EXISTS "idx_seller_earning_supplierId" ON "seller_earning"("supplierId");
CREATE INDEX IF NOT EXISTS "idx_seller_earning_orderId" ON "seller_earning"("orderId");
CREATE INDEX IF NOT EXISTS "idx_seller_earning_status" ON "seller_earning"("status");

-- ── refund_request ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "refund_request" (
  "id"           text PRIMARY KEY,
  "ref"          text NOT NULL UNIQUE,
  "orderId"      text NOT NULL REFERENCES "order"("id"),
  "userId"       text NOT NULL,
  "items"        jsonb NOT NULL DEFAULT '[]',
  "reason"       text NOT NULL,
  "notes"        text,
  "status"       text NOT NULL DEFAULT 'pending',
  "refundAmount" numeric(12,2),
  "adminNote"    text,
  "reviewedBy"   text,
  "reviewedAt"   timestamp with time zone,
  "createdAt"    timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt"    timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_refund_request_orderId" ON "refund_request"("orderId");
CREATE INDEX IF NOT EXISTS "idx_refund_request_userId" ON "refund_request"("userId");
CREATE INDEX IF NOT EXISTS "idx_refund_request_status" ON "refund_request"("status");

-- ── stock_movement ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "stock_movement" (
  "id"          text PRIMARY KEY,
  "productId"   text NOT NULL REFERENCES "product"("id"),
  "variantId"   text REFERENCES "product_variant"("id"),
  "type"        text NOT NULL,
  "delta"       integer NOT NULL,
  "stockAfter"  integer NOT NULL,
  "reference"   text,
  "reason"      text,
  "createdBy"   text,
  "createdAt"   timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_stock_movement_productId" ON "stock_movement"("productId");
CREATE INDEX IF NOT EXISTS "idx_stock_movement_type" ON "stock_movement"("type");
