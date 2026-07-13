-- Feature 19b: Shop follow — buyers follow suppliers; denormalized follower count.

CREATE TABLE IF NOT EXISTS "shop_follower" (
  "id"         text PRIMARY KEY,
  "supplierId" text NOT NULL REFERENCES "supplier"("id") ON DELETE CASCADE,
  "userId"     text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "createdAt"  timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE ("supplierId", "userId")
);

CREATE INDEX IF NOT EXISTS "idx_shop_follower_supplierId" ON "shop_follower"("supplierId");
CREATE INDEX IF NOT EXISTS "idx_shop_follower_userId" ON "shop_follower"("userId");

ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "followerCount" integer NOT NULL DEFAULT 0;
