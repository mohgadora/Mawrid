-- Feature 8: Chat — conversations + messages (buyer↔supplier / admin / driver).

CREATE TABLE IF NOT EXISTS "conversation" (
  "id"             text PRIMARY KEY,
  "type"           text NOT NULL,   -- buyer_supplier | buyer_admin | buyer_driver
  "orderId"        text REFERENCES "order"("id"),
  "participantIds" jsonb NOT NULL DEFAULT '[]',
  "lastMessageAt"  timestamp with time zone,
  "createdAt"      timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_conversation_orderId" ON "conversation"("orderId");
CREATE INDEX IF NOT EXISTS "idx_conversation_lastMessageAt" ON "conversation"("lastMessageAt");

CREATE TABLE IF NOT EXISTS "chat_message" (
  "id"             text PRIMARY KEY,
  "conversationId" text NOT NULL REFERENCES "conversation"("id") ON DELETE CASCADE,
  "senderId"       text NOT NULL REFERENCES "user"("id"),
  "body"           text NOT NULL,
  "images"         jsonb NOT NULL DEFAULT '[]',
  "readAt"         timestamp with time zone,
  "createdAt"      timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_chat_message_conversationId" ON "chat_message"("conversationId");
CREATE INDEX IF NOT EXISTS "idx_chat_message_createdAt" ON "chat_message"("createdAt");
