-- Add variantSku and variantOptions to order_line
ALTER TABLE "order_line" ADD COLUMN IF NOT EXISTS "variantSku" text;
ALTER TABLE "order_line" ADD COLUMN IF NOT EXISTS "variantOptions" jsonb NOT NULL DEFAULT '{}';

-- Add commissionRate to supplier
ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "commissionRate" numeric(5,2);

-- Add missing fields to payout
ALTER TABLE "payout" ADD COLUMN IF NOT EXISTS "rejectionReason" text;
ALTER TABLE "payout" ADD COLUMN IF NOT EXISTS "adminNote" text;
ALTER TABLE "payout" ADD COLUMN IF NOT EXISTS "requestedBy" text;
ALTER TABLE "payout" ADD COLUMN IF NOT EXISTS "reviewedBy" text;
ALTER TABLE "payout" ADD COLUMN IF NOT EXISTS "paidAt" timestamp with time zone;

-- Add status to product
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'approved';

-- Create product_approval_history
CREATE TABLE IF NOT EXISTS "product_approval_history" (
  "id" text PRIMARY KEY,
  "productId" text NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
  "supplierId" text NOT NULL REFERENCES "supplier"("id"),
  "status" text NOT NULL,
  "reason" text,
  "reviewedBy" text REFERENCES "user"("id"),
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_pah_productId" ON "product_approval_history"("productId");
