import { betterAuth } from 'better-auth'
import { admin } from 'better-auth/plugins'
import { pool } from '@/lib/db'

const productionUrl = process.env.BETTER_AUTH_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.V0_RUNTIME_URL)

// على السيرفر الذاتي لا توجد متغيرات Vercel — يجب ضبط هذه صراحةً.
if (process.env.NODE_ENV === 'production') {
  if (!process.env.BETTER_AUTH_URL) {
    throw new Error('[auth] BETTER_AUTH_URL is required in production (self-hosted).')
  }
  if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error('[auth] BETTER_AUTH_SECRET is required in production. Generate: openssl rand -base64 32')
  }
}

// أصول موثوقة من البيئة بدل قيمة مثبّتة على دومين معاينة v0.
const envTrustedOrigins = (process.env.TRUSTED_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

export const auth = betterAuth({
  database: pool,
  baseURL: productionUrl,

  plugins: [
    // Adds role-based access control — role is stored on the user row
    // and automatically included in every session response.
    admin({
      defaultRole: 'consumer',
      adminRole: 'admin',
    }),
  ],

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      console.info(`[auth] Password reset for ${user.email}: ${url}`)
    },
  },

  user: {
    additionalFields: {
      phone:     { type: 'string', required: false },
      company:   { type: 'string', required: false },
      vatNumber: { type: 'string', required: false },
      country:   { type: 'string', defaultValue: 'SA' },
    },
  },

  trustedOrigins: [
    ...envTrustedOrigins,
    ...(productionUrl ? [productionUrl] : []),
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
  ],

  session: {
    expiresIn:  60 * 60 * 24 * 7, // 7 days
    updateAge:  60 * 60 * 24,     // rotate daily
  },

  ...(process.env.NODE_ENV === 'development'
    ? {
        advanced: {
          defaultCookieAttributes: {
            sameSite: 'none' as const,
            secure: true,
          },
        },
      }
    : {}),
})
