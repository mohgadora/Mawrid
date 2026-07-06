-- Feature 1: Coupon Engine — buyer-facing validation/redemption + supplier-scoped coupons.
-- Backward-compatible: extends the existing `coupon` / `coupon_usage` tables and `order`.

-- ── coupon: scope + supplier ownership + bilingual marketing copy ────────────
ALTER TABLE "coupon" ADD COLUMN IF NOT EXISTS "scope"         text NOT NULL DEFAULT 'global';   -- global | supplier | category | product | first_order
ALTER TABLE "coupon" ADD COLUMN IF NOT EXISTS "scopeIds"      jsonb NOT NULL DEFAULT '[]';
ALTER TABLE "coupon" ADD COLUMN IF NOT EXISTS "supplierId"    text REFERENCES "supplier"("id") ON DELETE CASCADE;
ALTER TABLE "coupon" ADD COLUMN IF NOT EXISTS "titleAr"       text;
ALTER TABLE "coupon" ADD COLUMN IF NOT EXISTS "titleEn"       text;
ALTER TABLE "coupon" ADD COLUMN IF NOT EXISTS "descriptionAr" text;
ALTER TABLE "coupon" ADD COLUMN IF NOT EXISTS "descriptionEn" text;

CREATE INDEX IF NOT EXISTS "idx_coupon_scope"      ON "coupon"("scope");
CREATE INDEX IF NOT EXISTS "idx_coupon_supplierId" ON "coupon"("supplierId");

-- ── coupon_usage: record the discount actually applied ──────────────────────
ALTER TABLE "coupon_usage" ADD COLUMN IF NOT EXISTS "discountAmount" numeric(12,2) NOT NULL DEFAULT 0;

-- ── order: link redeemed coupon ─────────────────────────────────────────────
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "couponId"   text REFERENCES "coupon"("id");
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "couponCode" text;

CREATE INDEX IF NOT EXISTS "idx_order_couponId" ON "order"("couponId");
