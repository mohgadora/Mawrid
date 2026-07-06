-- Feature 16: Blog — categories + posts.

CREATE TABLE IF NOT EXISTS "blog_category" (
  "id"        text PRIMARY KEY,
  "slug"      text NOT NULL UNIQUE,
  "nameAr"    text NOT NULL,
  "nameEn"    text,
  "sortOrder" integer NOT NULL DEFAULT 0,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "blog_post" (
  "id"          text PRIMARY KEY,
  "slug"        text NOT NULL UNIQUE,
  "titleAr"     text NOT NULL,
  "titleEn"     text,
  "bodyAr"      text NOT NULL,
  "bodyEn"      text,
  "excerptAr"   text,
  "excerptEn"   text,
  "coverImage"  text,
  "categoryId"  text REFERENCES "blog_category"("id") ON DELETE SET NULL,
  "authorId"    text,
  "status"      text NOT NULL DEFAULT 'draft',  -- draft | published
  "tags"        jsonb NOT NULL DEFAULT '[]',
  "publishedAt" timestamp with time zone,
  "viewCount"   integer NOT NULL DEFAULT 0,
  "createdAt"   timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt"   timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_blog_post_status" ON "blog_post"("status");
CREATE INDEX IF NOT EXISTS "idx_blog_post_categoryId" ON "blog_post"("categoryId");
CREATE INDEX IF NOT EXISTS "idx_blog_post_publishedAt" ON "blog_post"("publishedAt");
