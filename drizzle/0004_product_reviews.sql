-- Migration 0004: Product Reviews System
-- Tables: product_review, review_reply, review_helpful

CREATE TABLE IF NOT EXISTS "product_review" (
  "id"           TEXT PRIMARY KEY,
  "productId"    TEXT NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
  "userId"       TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "orderId"      TEXT REFERENCES "order"("id") ON DELETE SET NULL,
  "rating"       INTEGER NOT NULL CHECK ("rating" BETWEEN 1 AND 5),
  "title"        TEXT,
  "body"         TEXT NOT NULL,
  "helpfulCount" INTEGER NOT NULL DEFAULT 0,
  "verified"     BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "review_reply" (
  "id"        TEXT PRIMARY KEY,
  "reviewId"  TEXT NOT NULL REFERENCES "product_review"("id") ON DELETE CASCADE,
  "userId"    TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "body"      TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "review_helpful" (
  "id"        TEXT PRIMARY KEY,
  "reviewId"  TEXT NOT NULL REFERENCES "product_review"("id") ON DELETE CASCADE,
  "userId"    TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("reviewId", "userId")
);

CREATE INDEX IF NOT EXISTS "idx_review_product" ON "product_review"("productId");
CREATE INDEX IF NOT EXISTS "idx_review_user"    ON "product_review"("userId");
CREATE INDEX IF NOT EXISTS "idx_reply_review"   ON "review_reply"("reviewId");
