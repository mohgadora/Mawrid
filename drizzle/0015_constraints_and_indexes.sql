-- 0015: unique constraint on favorite + additional performance indexes

-- Prevent duplicate favorites for the same user/product
ALTER TABLE "favorite"
  ADD CONSTRAINT "favorite_user_product_unique" UNIQUE ("userId", "productId");

-- High-frequency FK indexes not covered by 0014
CREATE INDEX IF NOT EXISTS "idx_supplier_user_id"      ON "supplier"          ("userId");
CREATE INDEX IF NOT EXISTS "idx_product_variant_prod"  ON "product_variant"   ("productId");
CREATE INDEX IF NOT EXISTS "idx_seller_earning_supp"   ON "seller_earning"    ("supplierId");
CREATE INDEX IF NOT EXISTS "idx_notification_user"     ON "notification"      ("userId");
CREATE INDEX IF NOT EXISTS "idx_favorite_user"         ON "favorite"          ("userId");
CREATE INDEX IF NOT EXISTS "idx_favorite_product"      ON "favorite"          ("productId");
