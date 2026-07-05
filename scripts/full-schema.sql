-- ──────────────────────────────────────────────────────────────────────────
-- Mawrid — Full Schema (idempotent)
-- Run this on any fresh PostgreSQL/Neon/Supabase database.
-- Safe to re-run: all statements use IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
-- ──────────────────────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════════
-- 0000 — Core Tables
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "user" (
  "id"            text PRIMARY KEY,
  "name"          text NOT NULL,
  "email"         text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  "image"         text,
  "role"          text NOT NULL DEFAULT 'consumer',
  "phone"         text,
  "company"       text,
  "vatNumber"     text,
  "country"       text DEFAULT 'SA',
  "banned"        boolean DEFAULT false,
  "banReason"     text,
  "banExpires"    timestamp with time zone,
  "createdAt"     timestamp with time zone NOT NULL,
  "updatedAt"     timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS "account" (
  "id"                     text PRIMARY KEY,
  "accountId"              text NOT NULL,
  "providerId"             text NOT NULL,
  "userId"                 text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "accessToken"            text,
  "refreshToken"           text,
  "idToken"                text,
  "accessTokenExpiresAt"   timestamp with time zone,
  "refreshTokenExpiresAt"  timestamp with time zone,
  "scope"                  text,
  "password"               text,
  "createdAt"              timestamp with time zone NOT NULL,
  "updatedAt"              timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS "session" (
  "id"        text PRIMARY KEY,
  "expiresAt" timestamp with time zone NOT NULL,
  "token"     text NOT NULL UNIQUE,
  "createdAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  "userId"    text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id"         text PRIMARY KEY,
  "identifier" text NOT NULL,
  "value"      text NOT NULL,
  "expiresAt"  timestamp with time zone NOT NULL,
  "createdAt"  timestamp with time zone,
  "updatedAt"  timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "address" (
  "id"         text PRIMARY KEY,
  "userId"     text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "label"      text NOT NULL DEFAULT 'Home',
  "fullName"   text NOT NULL,
  "phone"      text NOT NULL,
  "line1"      text NOT NULL,
  "line2"      text,
  "city"       text NOT NULL,
  "region"     text,
  "country"    text NOT NULL DEFAULT 'SA',
  "postalCode" text,
  "isDefault"  boolean NOT NULL DEFAULT false,
  "createdAt"  timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "audit_log" (
  "id"        text PRIMARY KEY,
  "userId"    text,
  "action"    text NOT NULL,
  "entity"    text NOT NULL,
  "entityId"  text,
  "diff"      jsonb,
  "ip"        text,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "category" (
  "id"        text PRIMARY KEY,
  "name"      text NOT NULL,
  "nameAr"    text NOT NULL,
  "slug"      text NOT NULL UNIQUE,
  "icon"      text,
  "parentId"  text,
  "sortOrder" integer NOT NULL DEFAULT 0,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "country" (
  "id"       text PRIMARY KEY,
  "code"     text NOT NULL UNIQUE,
  "name"     text NOT NULL,
  "nameAr"   text NOT NULL,
  "currency" text NOT NULL DEFAULT 'SAR',
  "active"   boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS "supplier" (
  "id"             text PRIMARY KEY,
  "name"           text NOT NULL,
  "nameAr"         text,
  "logo"           text,
  "country"        text NOT NULL DEFAULT 'SA',
  "city"           text,
  "rating"         numeric(3,2) NOT NULL DEFAULT 0,
  "reviewCount"    integer NOT NULL DEFAULT 0,
  "verified"       boolean NOT NULL DEFAULT false,
  "responseTime"   text,
  "minOrder"       integer NOT NULL DEFAULT 1,
  "commissionRate" numeric(5,2),
  "userId"         text REFERENCES "user"("id"),
  "createdAt"      timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt"      timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "product" (
  "id"             text PRIMARY KEY,
  "sku"            text UNIQUE,
  "name"           text NOT NULL,
  "nameAr"         text,
  "description"    text,
  "descriptionAr"  text,
  "categoryId"     text REFERENCES "category"("id"),
  "supplierId"     text REFERENCES "supplier"("id"),
  "imageUrl"       text,
  "images"         jsonb NOT NULL DEFAULT '[]',
  "unitsPerCarton" integer NOT NULL DEFAULT 1,
  "weight"         numeric(8,3),
  "tags"           jsonb NOT NULL DEFAULT '[]',
  "marketAvgPrice" numeric(12,2),
  "stock"          integer NOT NULL DEFAULT 0,
  "active"         boolean NOT NULL DEFAULT true,
  "featured"       boolean NOT NULL DEFAULT false,
  "status"         text NOT NULL DEFAULT 'approved',
  "createdAt"      timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt"      timestamp with time zone NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS "price_tier" (
  "id"        text PRIMARY KEY,
  "productId" text NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
  "minQty"    integer NOT NULL,
  "maxQty"    integer,
  "price"     numeric(12,2) NOT NULL,
  "sortOrder" integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "delivery_zone" (
  "id"             text PRIMARY KEY,
  "name"           text NOT NULL,
  "nameAr"         text,
  "country"        text NOT NULL DEFAULT 'SA',
  "shippingFee"    numeric(12,2) NOT NULL DEFAULT '0',
  "freeOverAmount" numeric(12,2),
  "estimatedDays"  integer NOT NULL DEFAULT 3,
  "active"         boolean NOT NULL DEFAULT true,
  "createdAt"      timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "order" (
  "id"              text PRIMARY KEY,
  "ref"             text NOT NULL UNIQUE,
  "userId"          text NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
  "supplierId"      text REFERENCES "supplier"("id"),
  "status"          text NOT NULL DEFAULT 'pending',
  "addressId"       text REFERENCES "address"("id"),
  "shippingAddress" jsonb,
  "paymentMethod"   text NOT NULL DEFAULT 'cod',
  "paymentStatus"   text NOT NULL DEFAULT 'unpaid',
  "subtotal"        numeric(12,2) NOT NULL DEFAULT '0',
  "shippingFee"     numeric(12,2) NOT NULL DEFAULT '0',
  "discount"        numeric(12,2) NOT NULL DEFAULT '0',
  "total"           numeric(12,2) NOT NULL DEFAULT '0',
  "notes"           text,
  "estimatedDelivery" date,
  "deliveredAt"     timestamp with time zone,
  "createdAt"       timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt"       timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "order_line" (
  "id"             text PRIMARY KEY,
  "orderId"        text NOT NULL REFERENCES "order"("id") ON DELETE CASCADE,
  "productId"      text REFERENCES "product"("id"),
  "variantId"      text REFERENCES "product_variant"("id") ON DELETE SET NULL,
  "productName"    text NOT NULL,
  "productImage"   text,
  "sku"            text,
  "variantSku"     text,
  "variantOptions" jsonb NOT NULL DEFAULT '{}',
  "qty"            integer NOT NULL,
  "unitPrice"      numeric(12,2) NOT NULL,
  "cartonQty"      integer NOT NULL DEFAULT 1,
  "unitsPerCarton" integer NOT NULL DEFAULT 1,
  "subtotal"       numeric(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS "order_event" (
  "id"        text PRIMARY KEY,
  "orderId"   text NOT NULL REFERENCES "order"("id") ON DELETE CASCADE,
  "status"    text NOT NULL,
  "note"      text,
  "createdBy" text,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "payout" (
  "id"              text PRIMARY KEY,
  "supplierId"      text NOT NULL REFERENCES "supplier"("id"),
  "amount"          numeric(12,2) NOT NULL,
  "currency"        text NOT NULL DEFAULT 'SAR',
  "status"          text NOT NULL DEFAULT 'pending',
  "reference"       text,
  "bankAccount"     jsonb,
  "rejectionReason" text,
  "adminNote"       text,
  "requestedBy"     text,
  "reviewedBy"      text,
  "paidAt"          timestamp with time zone,
  "processedAt"     timestamp with time zone,
  "createdAt"       timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "transaction" (
  "id"        text PRIMARY KEY,
  "userId"    text NOT NULL,
  "orderId"   text REFERENCES "order"("id"),
  "type"      text NOT NULL,
  "amount"    numeric(12,2) NOT NULL,
  "currency"  text NOT NULL DEFAULT 'SAR',
  "status"    text NOT NULL DEFAULT 'completed',
  "gateway"   text,
  "reference" text,
  "meta"      jsonb,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "favorite" (
  "id"        text PRIMARY KEY,
  "userId"    text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "productId" text NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "order_template" (
  "id"        text PRIMARY KEY,
  "userId"    text NOT NULL,
  "name"      text NOT NULL,
  "items"     jsonb NOT NULL DEFAULT '[]',
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "driver" (
  "id"             text PRIMARY KEY,
  "name"           text NOT NULL,
  "phone"          text NOT NULL,
  "vehicle"        text NOT NULL,
  "vehiclePlate"   text,
  "status"         text NOT NULL DEFAULT 'offline',
  "lat"            numeric(10,7),
  "lng"            numeric(10,7),
  "currentOrderId" text REFERENCES "order"("id"),
  "userId"         text REFERENCES "user"("id"),
  "createdAt"      timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt"      timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "support_ticket" (
  "id"         text PRIMARY KEY,
  "ref"        text NOT NULL UNIQUE,
  "userId"     text NOT NULL,
  "orderId"    text REFERENCES "order"("id"),
  "subject"    text NOT NULL,
  "body"       text NOT NULL,
  "status"     text NOT NULL DEFAULT 'open',
  "priority"   text NOT NULL DEFAULT 'medium',
  "assignedTo" text,
  "resolvedAt" timestamp with time zone,
  "createdAt"  timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt"  timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ticket_message" (
  "id"        text PRIMARY KEY,
  "ticketId"  text NOT NULL REFERENCES "support_ticket"("id") ON DELETE CASCADE,
  "userId"    text NOT NULL,
  "body"      text NOT NULL,
  "isStaff"   boolean NOT NULL DEFAULT false,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "kyc_approval" (
  "id"          text PRIMARY KEY,
  "userId"      text NOT NULL,
  "type"        text NOT NULL DEFAULT 'merchant',
  "status"      text NOT NULL DEFAULT 'pending',
  "crNumber"    text,
  "vatNumber"   text,
  "documents"   jsonb NOT NULL DEFAULT '[]',
  "reviewedBy"  text,
  "reviewNote"  text,
  "createdAt"   timestamp with time zone NOT NULL DEFAULT now(),
  "reviewedAt"  timestamp with time zone
);

-- ═══════════════════════════════════════════════════════════════════
-- 0002 — Admin Collections
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "admin_collection" (
  "key"       text PRIMARY KEY,
  "items"     jsonb NOT NULL DEFAULT '[]',
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════
-- 0003 — Settings, Coupons, Seller Earnings, Refunds, Stock
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "system_setting" (
  "key"       text PRIMARY KEY,
  "value"     text NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedBy" text
);

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

-- ═══════════════════════════════════════════════════════════════════
-- 0004 — Product Reviews
-- ═══════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════
-- 0005 — Product Approval History
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "product_approval_history" (
  "id"         text PRIMARY KEY,
  "productId"  text NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
  "supplierId" text NOT NULL REFERENCES "supplier"("id"),
  "status"     text NOT NULL,
  "reason"     text,
  "reviewedBy" text REFERENCES "user"("id"),
  "createdAt"  timestamp with time zone NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════
-- 0006 — Flash Sales
-- ═══════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════
-- 0007 — Loyalty
-- ═══════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════
-- 0008 — Referrals
-- ═══════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════
-- 0009 — Notifications
-- ═══════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════
-- 0010 — Shipping Rules
-- ═══════════════════════════════════════════════════════════════════

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
-- Indexes
-- ═══════════════════════════════════════════════════════════════════

CREATE UNIQUE INDEX IF NOT EXISTS "favorite_user_product_unique" ON "favorite" ("userId", "productId");
CREATE INDEX IF NOT EXISTS "idx_product_variant_productId"       ON "product_variant"("productId");
CREATE INDEX IF NOT EXISTS "idx_product_variant_sku"             ON "product_variant"("sku");
CREATE INDEX IF NOT EXISTS "idx_coupon_code"                     ON "coupon"("code");
CREATE INDEX IF NOT EXISTS "idx_coupon_active"                   ON "coupon"("active");
CREATE INDEX IF NOT EXISTS "idx_coupon_usage_couponId_userId"    ON "coupon_usage"("couponId","userId");
CREATE INDEX IF NOT EXISTS "idx_seller_earning_supplierId"       ON "seller_earning"("supplierId");
CREATE INDEX IF NOT EXISTS "idx_seller_earning_orderId"          ON "seller_earning"("orderId");
CREATE INDEX IF NOT EXISTS "idx_seller_earning_status"           ON "seller_earning"("status");
CREATE INDEX IF NOT EXISTS "idx_refund_request_orderId"          ON "refund_request"("orderId");
CREATE INDEX IF NOT EXISTS "idx_refund_request_userId"           ON "refund_request"("userId");
CREATE INDEX IF NOT EXISTS "idx_refund_request_status"           ON "refund_request"("status");
CREATE INDEX IF NOT EXISTS "idx_stock_movement_productId"        ON "stock_movement"("productId");
CREATE INDEX IF NOT EXISTS "idx_stock_movement_type"             ON "stock_movement"("type");
CREATE INDEX IF NOT EXISTS "idx_review_product"                  ON "product_review"("productId");
CREATE INDEX IF NOT EXISTS "idx_review_user"                     ON "product_review"("userId");
CREATE INDEX IF NOT EXISTS "idx_reply_review"                    ON "review_reply"("reviewId");
CREATE INDEX IF NOT EXISTS "idx_pah_productId"                   ON "product_approval_history"("productId");
CREATE INDEX IF NOT EXISTS "idx_fsp_flashSaleId"                 ON "flash_sale_product"("flashSaleId");
CREATE INDEX IF NOT EXISTS "idx_fs_startsAt_endsAt"              ON "flash_sale"("startsAt","endsAt");
CREATE INDEX IF NOT EXISTS "idx_lt_userId"                       ON "loyalty_transaction"("userId");
CREATE INDEX IF NOT EXISTS "idx_la_userId"                       ON "loyalty_account"("userId");
CREATE INDEX IF NOT EXISTS "idx_ref_referrerId"                  ON "referral"("referrerId");
CREATE INDEX IF NOT EXISTS "idx_notif_userId_read"               ON "notification"("userId","read");
CREATE INDEX IF NOT EXISTS "idx_sr_zoneId"                       ON "shipping_rule"("zoneId");

-- ═══════════════════════════════════════════════════════════════════
-- Default system settings
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO "system_setting" ("key","value","updatedAt") VALUES
  ('businessMode',                    'b2b',    now()),
  ('shippingResponsibility',          'seller', now()),
  ('taxEnabled',                      'false',  now()),
  ('taxRate',                         '15',     now()),
  ('paymentMethods',                  '["cod","bank_transfer"]', now()),
  ('guestCheckout',                   'false',  now()),
  ('productApprovalRequired',         'false',  now()),
  ('defaultSellerCommissionPercent',  '10',     now()),
  ('refundAllowedDays',               '7',      now()),
  ('lowStockThreshold',               '10',     now())
ON CONFLICT ("key") DO NOTHING;
