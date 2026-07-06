-- Performance indexes for production
-- Fixes sequential scans on high-traffic tables

-- Order lookups by buyer and supplier (most frequent queries)
CREATE INDEX IF NOT EXISTS idx_order_userId      ON "order" ("userId");
CREATE INDEX IF NOT EXISTS idx_order_supplierId  ON "order" ("supplierId");
CREATE INDEX IF NOT EXISTS idx_order_status      ON "order" ("status");
CREATE INDEX IF NOT EXISTS idx_order_createdAt   ON "order" ("createdAt" DESC);

-- Order line and event joins
CREATE INDEX IF NOT EXISTS idx_order_line_orderId   ON "order_line" ("orderId");
CREATE INDEX IF NOT EXISTS idx_order_line_productId ON "order_line" ("productId");
CREATE INDEX IF NOT EXISTS idx_order_event_orderId  ON "order_event" ("orderId");

-- Session lookups by user (getSession is called on every authenticated request)
CREATE INDEX IF NOT EXISTS idx_session_userId ON "session" ("userId");

-- Product catalog lookups
CREATE INDEX IF NOT EXISTS idx_product_supplierId ON "product" ("supplierId");
CREATE INDEX IF NOT EXISTS idx_product_categoryId ON "product" ("categoryId");
CREATE INDEX IF NOT EXISTS idx_product_status     ON "product" ("status");

-- Seller earnings aggregation
CREATE INDEX IF NOT EXISTS idx_seller_earning_supplierId ON "seller_earning" ("supplierId");
CREATE INDEX IF NOT EXISTS idx_seller_earning_orderId    ON "seller_earning" ("orderId");

-- Notifications (unread count query)
CREATE INDEX IF NOT EXISTS idx_notification_userId ON "notification" ("userId");
