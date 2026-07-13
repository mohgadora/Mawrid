-- Feature 17: Moyasar payments — record the gateway invoice/payment id on the order.

ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "paymentRef" text;
