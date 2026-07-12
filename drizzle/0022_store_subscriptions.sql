-- Feature 16: Store Subscriptions — supplier plans + active subscriptions.

CREATE TABLE IF NOT EXISTS "subscription_plan" (
  "id"             text PRIMARY KEY,
  "nameAr"         text NOT NULL,
  "nameEn"         text,
  "priceMonthly"   numeric(12,2) NOT NULL,
  "priceYearly"    numeric(12,2),
  "maxProducts"    integer,
  "maxOrders"      integer,
  "commissionRate" numeric(5,2),
  "features"       jsonb NOT NULL DEFAULT '[]',
  "active"         boolean NOT NULL DEFAULT true,
  "sortOrder"      integer NOT NULL DEFAULT 0,
  "createdAt"      timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "store_subscription" (
  "id"                 text PRIMARY KEY,
  "supplierId"         text NOT NULL REFERENCES "supplier"("id") ON DELETE CASCADE,
  "planId"             text NOT NULL REFERENCES "subscription_plan"("id"),
  "status"             text NOT NULL DEFAULT 'active',  -- active | expired | cancelled | trial
  "currentPeriodStart" timestamp with time zone NOT NULL,
  "currentPeriodEnd"   timestamp with time zone NOT NULL,
  "autoRenew"          boolean NOT NULL DEFAULT true,
  "createdAt"          timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt"          timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_store_subscription_supplierId" ON "store_subscription"("supplierId");
CREATE INDEX IF NOT EXISTS "idx_store_subscription_status" ON "store_subscription"("status");
