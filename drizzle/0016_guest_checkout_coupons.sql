-- 0016: guest checkout + cart coupons
--
-- PR #13 ("guest checkout and cart coupons") added these columns/table to the
-- Drizzle schema (lib/db/schema.ts) but shipped no migration for them. As a
-- result any full SELECT on "order" — e.g. the admin orders list used by the
-- dashboard — failed at runtime with:  column "guestId" does not exist,
-- which surfaced in the admin panel as "حدث خطأ غير متوقع".
--
-- All statements are idempotent so this is safe to re-run.

-- ── guest_user ──────────────────────────────────────────────────────────────
-- Guest checkout stores buyer contact details here instead of a full account.
CREATE TABLE IF NOT EXISTS "guest_user" (
  "id"        text PRIMARY KEY,
  "email"     text,
  "phone"     text,
  "fullName"  text,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);

-- ── order: guest checkout + coupon linkage ───────────────────────────────────
-- Guest orders carry a guestId instead of a userId, so userId becomes nullable.
ALTER TABLE "order" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "guestId"    text;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "couponId"   text;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "couponCode" text;

-- ── coupon_usage: record the discount that was applied ───────────────────────
ALTER TABLE "coupon_usage" ADD COLUMN IF NOT EXISTS "discountAmount" numeric(12,2) NOT NULL DEFAULT '0';

-- ── driver: city (used for zone assignment / filtering) ──────────────────────
ALTER TABLE "driver" ADD COLUMN IF NOT EXISTS "city" text;
