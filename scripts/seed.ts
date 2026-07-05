/**
 * scripts/seed.ts
 * Seeds the Neon database with all mock data from lib/data.ts and lib/admin-data.ts
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * Tables seeded (idempotent — uses ON CONFLICT DO NOTHING):
 *   category, supplier, product, price_tier,
 *   delivery_zone, country, driver
 */
import 'dotenv/config'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from '../lib/db/schema'
import { CATEGORIES, SUPPLIERS, PRODUCTS, flattenCategories } from '../lib/data'
import { DELIVERY_ZONES, ADMIN_COUNTRIES } from '../lib/admin-data'
import { sql } from 'drizzle-orm'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool, { schema })

// ── Helpers ────────────────────────────────────────────────────────────────

function uid() {
  return crypto.randomUUID()
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding database...')

  // ── Create tables if they don't exist (Better Auth tables + app tables) ──
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "user" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      "emailVerified" BOOLEAN NOT NULL DEFAULT false,
      image TEXT,
      role TEXT NOT NULL DEFAULT 'consumer',
      phone TEXT,
      company TEXT,
      "vatNumber" TEXT,
      country TEXT DEFAULT 'SA',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "session" (
      id TEXT PRIMARY KEY,
      "expiresAt" TIMESTAMPTZ NOT NULL,
      token TEXT NOT NULL UNIQUE,
      "createdAt" TIMESTAMPTZ NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "account" (
      id TEXT PRIMARY KEY,
      "accountId" TEXT NOT NULL,
      "providerId" TEXT NOT NULL,
      "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      "accessToken" TEXT,
      "refreshToken" TEXT,
      "idToken" TEXT,
      "accessTokenExpiresAt" TIMESTAMPTZ,
      "refreshTokenExpiresAt" TIMESTAMPTZ,
      scope TEXT,
      password TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "verification" (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      "expiresAt" TIMESTAMPTZ NOT NULL,
      "createdAt" TIMESTAMPTZ,
      "updatedAt" TIMESTAMPTZ
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "category" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      "nameAr" TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      icon TEXT,
      "parentId" TEXT,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "supplier" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      "nameAr" TEXT,
      logo TEXT,
      country TEXT NOT NULL DEFAULT 'SA',
      city TEXT,
      rating NUMERIC(3,2) NOT NULL DEFAULT 0,
      "reviewCount" INTEGER NOT NULL DEFAULT 0,
      verified BOOLEAN NOT NULL DEFAULT false,
      "responseTime" TEXT,
      "minOrder" INTEGER NOT NULL DEFAULT 1,
      "userId" TEXT REFERENCES "user"(id),
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "product" (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE,
      name TEXT NOT NULL,
      "nameAr" TEXT,
      description TEXT,
      "descriptionAr" TEXT,
      "categoryId" TEXT REFERENCES "category"(id),
      "supplierId" TEXT REFERENCES "supplier"(id),
      "imageUrl" TEXT,
      images JSONB NOT NULL DEFAULT '[]',
      "unitsPerCarton" INTEGER NOT NULL DEFAULT 1,
      weight NUMERIC(8,3),
      tags JSONB NOT NULL DEFAULT '[]',
      "marketAvgPrice" NUMERIC(12,2),
      stock INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT true,
      featured BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "price_tier" (
      id TEXT PRIMARY KEY,
      "productId" TEXT NOT NULL REFERENCES "product"(id) ON DELETE CASCADE,
      "minQty" INTEGER NOT NULL,
      "maxQty" INTEGER,
      price NUMERIC(12,2) NOT NULL,
      "sortOrder" INTEGER NOT NULL DEFAULT 0
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "address" (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      label TEXT NOT NULL DEFAULT 'Home',
      "fullName" TEXT NOT NULL,
      phone TEXT NOT NULL,
      line1 TEXT NOT NULL,
      line2 TEXT,
      city TEXT NOT NULL,
      region TEXT,
      country TEXT NOT NULL DEFAULT 'SA',
      "postalCode" TEXT,
      "isDefault" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "order" (
      id TEXT PRIMARY KEY,
      ref TEXT NOT NULL UNIQUE,
      "userId" TEXT NOT NULL,
      "supplierId" TEXT REFERENCES "supplier"(id),
      status TEXT NOT NULL DEFAULT 'pending',
      "addressId" TEXT REFERENCES "address"(id),
      "shippingAddress" JSONB,
      "paymentMethod" TEXT NOT NULL DEFAULT 'cod',
      "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
      subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
      "shippingFee" NUMERIC(12,2) NOT NULL DEFAULT 0,
      discount NUMERIC(12,2) NOT NULL DEFAULT 0,
      total NUMERIC(12,2) NOT NULL DEFAULT 0,
      notes TEXT,
      "estimatedDelivery" DATE,
      "deliveredAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "order_line" (
      id TEXT PRIMARY KEY,
      "orderId" TEXT NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
      "productId" TEXT REFERENCES "product"(id),
      "productName" TEXT NOT NULL,
      "productImage" TEXT,
      sku TEXT,
      qty INTEGER NOT NULL,
      "unitPrice" NUMERIC(12,2) NOT NULL,
      "cartonQty" INTEGER NOT NULL DEFAULT 1,
      "unitsPerCarton" INTEGER NOT NULL DEFAULT 1,
      subtotal NUMERIC(12,2) NOT NULL
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "order_event" (
      id TEXT PRIMARY KEY,
      "orderId" TEXT NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      note TEXT,
      "createdBy" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "favorite" (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "productId" TEXT NOT NULL REFERENCES "product"(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "order_template" (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      name TEXT NOT NULL,
      items JSONB NOT NULL DEFAULT '[]',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "support_ticket" (
      id TEXT PRIMARY KEY,
      ref TEXT NOT NULL UNIQUE,
      "userId" TEXT NOT NULL,
      "orderId" TEXT REFERENCES "order"(id),
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT NOT NULL DEFAULT 'medium',
      "assignedTo" TEXT,
      "resolvedAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "ticket_message" (
      id TEXT PRIMARY KEY,
      "ticketId" TEXT NOT NULL REFERENCES "support_ticket"(id) ON DELETE CASCADE,
      "userId" TEXT NOT NULL,
      body TEXT NOT NULL,
      "isStaff" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "kyc_approval" (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'merchant',
      status TEXT NOT NULL DEFAULT 'pending',
      "crNumber" TEXT,
      "vatNumber" TEXT,
      documents JSONB NOT NULL DEFAULT '[]',
      "reviewedBy" TEXT,
      "reviewNote" TEXT,
      "submittedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "reviewedAt" TIMESTAMPTZ
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "payout" (
      id TEXT PRIMARY KEY,
      "supplierId" TEXT NOT NULL REFERENCES "supplier"(id),
      amount NUMERIC(12,2) NOT NULL,
      currency TEXT NOT NULL DEFAULT 'SAR',
      status TEXT NOT NULL DEFAULT 'pending',
      reference TEXT,
      "bankAccount" JSONB,
      "processedAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "transaction" (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "orderId" TEXT REFERENCES "order"(id),
      type TEXT NOT NULL,
      amount NUMERIC(12,2) NOT NULL,
      currency TEXT NOT NULL DEFAULT 'SAR',
      status TEXT NOT NULL DEFAULT 'completed',
      gateway TEXT,
      reference TEXT,
      meta JSONB,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "driver" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      vehicle TEXT NOT NULL,
      "vehiclePlate" TEXT,
      status TEXT NOT NULL DEFAULT 'offline',
      lat NUMERIC(10,7),
      lng NUMERIC(10,7),
      "currentOrderId" TEXT REFERENCES "order"(id),
      "userId" TEXT REFERENCES "user"(id),
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "country" (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      "nameAr" TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'SAR',
      active BOOLEAN NOT NULL DEFAULT true
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "delivery_zone" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      "nameAr" TEXT,
      country TEXT NOT NULL DEFAULT 'SA',
      "shippingFee" NUMERIC(12,2) NOT NULL DEFAULT 0,
      "freeOverAmount" NUMERIC(12,2),
      "estimatedDays" INTEGER NOT NULL DEFAULT 3,
      active BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "audit_log" (
      id TEXT PRIMARY KEY,
      "userId" TEXT,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      "entityId" TEXT,
      diff JSONB,
      ip TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  console.log('Tables ensured.')

  // ── Seed categories ──────────────────────────────────────────────────────
  const flatCats = flattenCategories(CATEGORIES)

  // Build slug→id map for parentId resolution
  const catIdMap: Record<string, string> = {}
  for (const c of flatCats) {
    catIdMap[c.slug] = uid()
  }

  for (const c of flatCats) {
    await db.execute(sql`
      INSERT INTO "category" (id, name, "nameAr", slug, icon, "parentId", "sortOrder")
      VALUES (
        ${catIdMap[c.slug]}, ${c.nameEn}, ${c.nameAr}, ${c.slug}, ${c.icon},
        ${c.parentSlug ? catIdMap[c.parentSlug] : null}, 0
      )
      ON CONFLICT (slug) DO NOTHING
    `)
  }
  console.log(`Categories seeded: ${flatCats.length}`)

  // ── Seed suppliers ───────────────────────────────────────────────────────
  for (const s of SUPPLIERS) {
    await db.execute(sql`
      INSERT INTO "supplier" (id, name, "nameAr", logo, country, city, rating, verified)
      VALUES (
        ${s.id}, ${s.nameEn}, ${s.nameAr}, ${s.logo},
        'SA', ${s.cityEn}, ${s.rating}, ${s.verified}
      )
      ON CONFLICT (id) DO NOTHING
    `)
  }
  console.log(`Suppliers seeded: ${SUPPLIERS.length}`)

  // ── Seed products + price tiers ──────────────────────────────────────────
  for (const p of PRODUCTS) {
    const categoryId = catIdMap[p.categorySlug] ?? null
    await db.execute(sql`
      INSERT INTO "product" (id, name, "nameAr", description, "descriptionAr", "categoryId", "supplierId", "imageUrl", "unitsPerCarton", "marketAvgPrice", stock, active)
      VALUES (
        ${p.id}, ${p.nameEn}, ${p.nameAr},
        ${p.descriptionEn}, ${p.descriptionAr},
        ${categoryId}, ${p.supplierId}, ${p.image},
        ${p.unitsPerCarton}, ${p.marketPrice},
        100, true
      )
      ON CONFLICT (id) DO NOTHING
    `)

    for (let i = 0; i < p.tiers.length; i++) {
      const tier = p.tiers[i]
      const maxQty = p.tiers[i + 1] ? p.tiers[i + 1].minQty - 1 : null
      await db.execute(sql`
        INSERT INTO "price_tier" (id, "productId", "minQty", "maxQty", price, "sortOrder")
        VALUES (${uid()}, ${p.id}, ${tier.minQty}, ${maxQty}, ${tier.pricePerCarton}, ${i})
        ON CONFLICT DO NOTHING
      `)
    }
  }
  console.log(`Products seeded: ${PRODUCTS.length}`)

  // ── Seed delivery zones ──────────────────────────────────────────────────
  for (const z of DELIVERY_ZONES) {
    await db.execute(sql`
      INSERT INTO "delivery_zone" (id, name, "nameAr", country, "shippingFee", "estimatedDays", active)
      VALUES (${z.id}, ${z.name}, ${z.name}, 'SA', ${z.fee}, 3, ${z.status === 'active'})
      ON CONFLICT (id) DO NOTHING
    `)
  }
  console.log(`Delivery zones seeded: ${DELIVERY_ZONES.length}`)

  // ── Seed countries ───────────────────────────────────────────────────────
  for (const c of ADMIN_COUNTRIES) {
    await db.execute(sql`
      INSERT INTO "country" (id, code, name, "nameAr", currency, active)
      VALUES (${uid()}, ${c.code}, ${c.name}, ${c.name}, ${c.currency}, ${c.enabled})
      ON CONFLICT (code) DO NOTHING
    `)
  }
  console.log(`Countries seeded: ${ADMIN_COUNTRIES.length}`)

  // ── Seed sample drivers ──────────────────────────────────────────────────
  const drivers = [
    { id: uid(), name: 'خالد العمري', phone: '+966501234567', vehicle: 'Toyota Hilux', vehiclePlate: 'أ ب ج 1234', status: 'available', lat: 24.7136, lng: 46.6753 },
    { id: uid(), name: 'فهد الشمري', phone: '+966502345678', vehicle: 'Ford Transit', vehiclePlate: 'د هـ و 5678', status: 'busy', lat: 24.6877, lng: 46.7219 },
    { id: uid(), name: 'محمد الغامدي', phone: '+966503456789', vehicle: 'Nissan Navara', vehiclePlate: 'ز ح ط 9012', status: 'offline', lat: 24.7400, lng: 46.6200 },
  ]
  for (const d of drivers) {
    await db.execute(sql`
      INSERT INTO "driver" (id, name, phone, vehicle, "vehiclePlate", status, lat, lng)
      VALUES (${d.id}, ${d.name}, ${d.phone}, ${d.vehicle}, ${d.vehiclePlate}, ${d.status}, ${d.lat}, ${d.lng})
      ON CONFLICT DO NOTHING
    `)
  }
  console.log(`Drivers seeded: ${drivers.length}`)

  console.log('Seed complete!')
  await pool.end()
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
