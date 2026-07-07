import { betterAuth } from 'better-auth'
import { admin } from 'better-auth/plugins'
import { pool } from '@/lib/db'
import { sendEmail, buildPasswordResetEmail } from '@/lib/email'

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

/**
 * مزوّدو الدخول الاجتماعي — يُضاف كل مزوّد فقط عند توفّر مفاتيحه في البيئة، حتى لا
 * يتعطّل الإقلاع في البيئات التي لا تُفعّل الدخول الاجتماعي.
 */
const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {}
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }
}
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
  socialProviders.apple = {
    clientId: process.env.APPLE_CLIENT_ID,
    clientSecret: process.env.APPLE_CLIENT_SECRET,
  }
}

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

  ...(Object.keys(socialProviders).length ? { socialProviders } : {}),

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'إعادة تعيين كلمة المرور — مـوريد',
        html: buildPasswordResetEmail(url),
      })
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

  // اختبار فقط: تعطيل حد المعدل لتمكين تشغيل حزمة اختبارات آلية من IP واحد.
  // آمن للإنتاج لأنه معطّل ما لم تُضبط البيئة صراحةً على "true".
  ...(process.env.DISABLE_AUTH_RATE_LIMIT === 'true'
    ? { rateLimit: { enabled: false as const } }
    : {}),

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
