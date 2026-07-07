/**
 * scripts/seed-qa.ts — QA seed: a real, verified supplier login + withdrawal requests,
 * so partner-portal and admin-finance tests have data to act on.
 *
 * Standalone (like create-admin.ts): its own Pool + betterAuth, no server-only imports.
 * Links the fresh supplier user to the existing `east-sugar` supplier (which already
 * owns a product referenced by 7 orders), then adds pending payout (withdrawal) rows.
 *
 * Run:  SEED_SUPPLIER_EMAIL=... SEED_SUPPLIER_PASSWORD=... pnpm tsx scripts/seed-qa.ts
 */
import 'dotenv/config'
import { Pool } from 'pg'
import { betterAuth } from 'better-auth'
import { admin } from 'better-auth/plugins'
import { getDatabaseSslConfig } from '../lib/db/ssl'

const email = process.env.SEED_SUPPLIER_EMAIL
const password = process.env.SEED_SUPPLIER_PASSWORD
const SUPPLIER_ID = process.env.SEED_SUPPLIER_ID || 'east-sugar'

if (!email || !password) {
  console.error('❌ Set SEED_SUPPLIER_EMAIL and SEED_SUPPLIER_PASSWORD.')
  process.exit(1)
}
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is required.')
  process.exit(1)
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: getDatabaseSslConfig(),
})

const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  plugins: [admin({ defaultRole: 'consumer', adminRole: 'admin' })],
  emailAndPassword: { enabled: true },
})

async function main() {
  // 1) Create (or reuse) the supplier user with a proper better-auth password hash.
  try {
    // role is set to 'supplier' by the UPDATE below — better-auth's createUser
    // only types the admin-plugin roles ('user' | 'admin'), so we omit it here.
    await auth.api.createUser({
      body: { email: email!, password: password!, name: 'مورد الاختبار' },
    })
    console.log('✅ supplier user created:', email)
  } catch (err) {
    const msg = String(err).toLowerCase()
    if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('already')) {
      console.log('ℹ️  supplier user already exists — reusing:', email)
    } else {
      throw err
    }
  }

  const client = await pool.connect()
  try {
    // 2) Ensure role=supplier and grab the user id.
    const u = await client.query(
      `UPDATE "user" SET role='supplier' WHERE email=$1 RETURNING id, email, role`,
      [email],
    )
    const userId = u.rows[0]?.id
    if (!userId) throw new Error('supplier user not found after create')
    console.log('   user id:', userId, 'role:', u.rows[0].role)

    // 3) Link the fresh user to the existing verified supplier that already has products/orders.
    const s = await client.query(
      `UPDATE supplier SET "userId"=$1, verified=true, status='active' WHERE id=$2
       RETURNING id, coalesce("nameAr", name) AS name, verified`,
      [userId, SUPPLIER_ID],
    )
    if (!s.rows[0]) throw new Error(`supplier ${SUPPLIER_ID} not found`)
    console.log('✅ linked supplier:', s.rows[0].name, '(verified:', s.rows[0].verified + ')')

    // 4) Seed pending withdrawal (payout) requests for admin-finance + partner-withdrawal tests.
    const existing = await client.query(
      `SELECT count(*)::int AS n FROM payout WHERE "supplierId"=$1 AND reference LIKE 'QA-%'`,
      [SUPPLIER_ID],
    )
    if (existing.rows[0].n > 0) {
      console.log('ℹ️  QA payout rows already present:', existing.rows[0].n, '— skipping insert')
    } else {
      const bank = JSON.stringify({ bankName: 'مصرف الراجحي', iban: 'SA0380000000608010167519' })
      await client.query(
        `INSERT INTO payout (id, "supplierId", amount, currency, status, reference, "bankAccount", "requestedBy", "createdAt")
         VALUES
           (gen_random_uuid(), $1, 1500.00, 'SAR', 'pending', 'QA-WDR-001', $2::jsonb, $3, NOW()),
           (gen_random_uuid(), $1,  875.50, 'SAR', 'pending', 'QA-WDR-002', $2::jsonb, $3, NOW())`,
        [SUPPLIER_ID, bank, userId],
      )
      console.log('✅ seeded 2 pending withdrawal requests')
    }

    // 5) Report what the partner account will now see.
    const summary = await client.query(
      `SELECT
         (SELECT count(*)::int FROM product WHERE "supplierId"=$1) AS products,
         (SELECT count(DISTINCT ol."orderId")::int
            FROM order_line ol JOIN product p ON p.id=ol."productId"
            WHERE p."supplierId"=$1) AS orders,
         (SELECT count(*)::int FROM payout WHERE "supplierId"=$1) AS withdrawals`,
      [SUPPLIER_ID],
    )
    console.log('📊 partner account now sees:', summary.rows[0])
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error('❌ seed-qa failed:', err)
  process.exit(1)
})
