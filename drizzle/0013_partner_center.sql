-- Partner Center: extend supplier table
ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "bannerUrl" text;
ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "address" text;
ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "socialLinks" jsonb DEFAULT '{}';
ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "shippingPolicy" text;
ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "returnPolicy" text;
ALTER TABLE "supplier" ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'active';
