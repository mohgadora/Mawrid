-- Phase 13: Returns & Refunds — add missing columns to refund_request
ALTER TABLE "refund_request" ADD COLUMN IF NOT EXISTS "returnTrackingNumber" text;
ALTER TABLE "refund_request" ADD COLUMN IF NOT EXISTS "images" jsonb NOT NULL DEFAULT '[]';
