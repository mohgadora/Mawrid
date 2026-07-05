-- Production hardening: unique favorites, FK constraints where safe
CREATE UNIQUE INDEX IF NOT EXISTS "favorite_user_product_unique" ON "favorite" ("userId", "productId");

DO $$ BEGIN
  ALTER TABLE "order" ADD CONSTRAINT "order_user_id_user_id_fk"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "address" ADD CONSTRAINT "address_user_id_user_id_fk"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "favorite" ADD CONSTRAINT "favorite_user_id_user_id_fk"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
