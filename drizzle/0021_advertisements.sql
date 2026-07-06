-- Feature 15: In-App Advertisements — placements, impression/click tracking.

CREATE TABLE IF NOT EXISTS "advertisement" (
  "id"          text PRIMARY KEY,
  "titleAr"     text NOT NULL,
  "titleEn"     text,
  "type"        text NOT NULL,   -- banner | popup | product_highlight | category_highlight
  "imageUrl"    text NOT NULL,
  "targetUrl"   text,
  "placement"   text NOT NULL,   -- home_top | home_middle | category_page | search_results | checkout
  "priority"    integer NOT NULL DEFAULT 0,
  "impressions" integer NOT NULL DEFAULT 0,
  "clicks"      integer NOT NULL DEFAULT 0,
  "supplierId"  text REFERENCES "supplier"("id") ON DELETE CASCADE,
  "status"      text NOT NULL DEFAULT 'approved',  -- pending | approved | rejected
  "active"      boolean NOT NULL DEFAULT true,
  "startsAt"    timestamp with time zone,
  "expiresAt"   timestamp with time zone,
  "createdAt"   timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_advertisement_placement" ON "advertisement"("placement");
CREATE INDEX IF NOT EXISTS "idx_advertisement_supplierId" ON "advertisement"("supplierId");
CREATE INDEX IF NOT EXISTS "idx_advertisement_status" ON "advertisement"("status");
