-- Feature 19c: Restock notify — alert users when an out-of-stock product returns.

CREATE TABLE IF NOT EXISTS "restock_request" (
  "id"        text PRIMARY KEY,
  "productId" text NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
  "userId"    text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "notified"  boolean NOT NULL DEFAULT false,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE ("productId", "userId")
);

CREATE INDEX IF NOT EXISTS "idx_restock_request_productId" ON "restock_request"("productId");
CREATE INDEX IF NOT EXISTS "idx_restock_request_userId" ON "restock_request"("userId");
