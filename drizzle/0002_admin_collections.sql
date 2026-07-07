CREATE TABLE IF NOT EXISTS "admin_collection" (
  "key" text PRIMARY KEY NOT NULL,
  "items" jsonb DEFAULT '[]' NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
