-- Feature 14: Guest checkout — allow orders without a registered account.

CREATE TABLE IF NOT EXISTS "guest_user" (
  "id"        text PRIMARY KEY,
  "email"     text,
  "phone"     text,
  "fullName"  text,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "guestId" text REFERENCES "guest_user"("id");
-- الطلبات كضيف لا تملك userId
ALTER TABLE "order" ALTER COLUMN "userId" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_order_guestId" ON "order"("guestId");
