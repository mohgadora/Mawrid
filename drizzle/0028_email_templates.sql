-- Feature 19e: Email templates — per-event bilingual HTML templates with {{vars}}.

CREATE TABLE IF NOT EXISTS "email_template" (
  "id"        text PRIMARY KEY,
  "event"     text NOT NULL UNIQUE,
  "subjectAr" text NOT NULL,
  "bodyAr"    text NOT NULL,
  "subjectEn" text,
  "bodyEn"    text,
  "active"    boolean NOT NULL DEFAULT true,
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);
