-- Feature 13: SEO — per-entity metadata overrides for product/category/supplier/page.

CREATE TABLE IF NOT EXISTS "seo_meta" (
  "id"            text PRIMARY KEY,
  "entityType"    text NOT NULL,   -- product | category | supplier | page
  "entityId"     text NOT NULL,
  "titleAr"       text,
  "titleEn"       text,
  "descriptionAr" text,
  "descriptionEn" text,
  "keywords"      jsonb NOT NULL DEFAULT '[]',
  "ogImage"       text,
  "canonicalUrl"  text,
  "noIndex"       boolean NOT NULL DEFAULT false,
  "createdAt"     timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt"     timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE ("entityType", "entityId")
);

CREATE INDEX IF NOT EXISTS "idx_seo_meta_entity" ON "seo_meta"("entityType", "entityId");
