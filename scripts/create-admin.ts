/**
 * scripts/create-admin.ts — إنشاء أول أدمن مرة واحدة، يدوياً.
 * يستبدل باب /api/create-admin العام (المحذوف).
 *
 * مستقل تماماً (مثل seed.ts): ينشئ Pool و betterAuth خاصّين به، ولا يستورد
 * lib/db أو lib/auth حتى لا يصطدم بـ `server-only` خارج بيئة Next.
 * تجزئة كلمة المرور في better-auth (scrypt) مستقلة عن BETTER_AUTH_SECRET،
 * فالمستخدم الناتج متوافق مع تطبيق الويب.
 *
 * التشغيل:  SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... pnpm create-admin
 */
import 'dotenv/config'
import { Pool } from 'pg'
import { betterAuth } from 'better-auth'
import { admin } from 'better-auth/plugins'
import { getDatabaseSslConfig } from '../lib/db/ssl'

const email = process.env.SEED_ADMIN_EMAIL
const password = process.env.SEED_ADMIN_PASSWORD

if (!email || !password) {
  console.error('❌ Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in the environment.')
  process.exit(1)
}
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is required.')
  process.exit(1)
}
if (process.env.NODE_ENV === 'production' && !process.env.BETTER_AUTH_SECRET) {
  console.error('❌ BETTER_AUTH_SECRET is required in production. Generate: openssl rand -base64 32')
  process.exit(1)
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: getDatabaseSslConfig(), // نفس سياسة SSL المستخدمة في تطبيق الويب
})

const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  plugins: [admin({ defaultRole: 'consumer', adminRole: 'admin' })],
  emailAndPassword: { enabled: true },
})

async function main() {
  try {
    const result = await auth.api.createUser({
      body: { email: email!, password: password!, name: 'Admin', role: 'admin' },
    })
    console.log('✅ admin created:', result.user?.email ?? email)
  } catch (err) {
    const msg = String(err).toLowerCase()
    if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('already')) {
      const client = await pool.connect()
      const res = await client.query(
        `UPDATE "user" SET role = 'admin' WHERE email = $1 RETURNING id, email, role`,
        [email],
      )
      client.release()
      console.log('✅ existing user promoted to admin:', res.rows[0]?.email ?? email)
    } else {
      console.error('❌ failed:', err)
      process.exitCode = 1
    }
  } finally {
    await pool.end()
  }
}

main()
