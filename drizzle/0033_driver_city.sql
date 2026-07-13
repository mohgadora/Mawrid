-- Fix: schema.ts declares driver.city but no migration created it, so a bare
-- SELECT * FROM driver (getAdminDrivers) throws "column driver.city does not
-- exist" (42703) on a DB built purely from migrations. Idempotent — safe if the
-- column was already added out-of-band.

ALTER TABLE "driver" ADD COLUMN IF NOT EXISTS "city" text;
