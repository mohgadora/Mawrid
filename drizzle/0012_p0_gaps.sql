-- P0 gap fixes
-- 1. Add variantId FK to order_line
ALTER TABLE "order_line"
  ADD COLUMN IF NOT EXISTS "variantId" text REFERENCES "product_variant"("id") ON DELETE SET NULL;
