-- Feature 19d: search history — recent searches per user + popularity signal.

CREATE TABLE IF NOT EXISTS "recent_search" (
  "id"          text PRIMARY KEY,
  "userId"      text REFERENCES "user"("id") ON DELETE CASCADE,
  "query"       text NOT NULL,
  "resultCount" integer NOT NULL DEFAULT 0,
  "createdAt"   timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_recent_search_userId" ON "recent_search"("userId");
CREATE INDEX IF NOT EXISTS "idx_recent_search_query" ON "recent_search"("query");
CREATE INDEX IF NOT EXISTS "idx_recent_search_createdAt" ON "recent_search"("createdAt");
