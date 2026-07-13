-- Feature 19a: Order editing before shipping — audit trail + settlement.

CREATE TABLE IF NOT EXISTS "order_edit" (
  "id"            text PRIMARY KEY,
  "orderId"       text NOT NULL REFERENCES "order"("id") ON DELETE CASCADE,
  "editedBy"      text,
  "editType"      text NOT NULL,          -- quantity | remove_item
  "changeDetails" jsonb NOT NULL DEFAULT '[]',
  "priceDiff"     numeric(12,2) NOT NULL DEFAULT 0,  -- + = due from buyer, - = refund
  "status"        text NOT NULL DEFAULT 'applied',   -- applied
  "createdAt"     timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_order_edit_orderId" ON "order_edit"("orderId");

CREATE TABLE IF NOT EXISTS "order_edit_payment" (
  "id"          text PRIMARY KEY,
  "orderEditId" text NOT NULL REFERENCES "order_edit"("id") ON DELETE CASCADE,
  "type"        text NOT NULL,   -- due | return
  "amount"      numeric(12,2) NOT NULL,
  "status"      text NOT NULL DEFAULT 'pending',  -- pending | settled
  "method"      text,
  "processedAt" timestamp with time zone,
  "createdAt"   timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_order_edit_payment_orderEditId" ON "order_edit_payment"("orderEditId");
