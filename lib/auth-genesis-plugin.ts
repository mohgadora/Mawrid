import { createAuthEndpoint, APIError } from 'better-auth/api'
import { setSessionCookie } from 'better-auth/cookies'
import type { BetterAuthPlugin } from 'better-auth'
import {
  fetchGenesisUserInfo,
  genesisSsoEnabled,
  markPhoneVerified,
  resolveMawridUser,
  syncProfileFromGenesis,
  toE164,
  verifyGenesisToken,
} from '@/lib/genesis'

/**
 * إضافة better-auth للدخول الموحّد من تطبيق جينيسيس.
 *
 * تُصدر نقطة POST /api/auth/genesis/sign-in (يخدمها المسار الجامع
 * app/api/auth/[...all]). تستقبل رمزًا محدود النطاق من جسر window.genesis،
 * تتحقّق منه عبر جينيسيس، تربطه بمستخدم مورِد عبر رقم الجوال، ثم تُنشئ جلسة
 * better-auth عادية — فبقيّة التطبيق لا تعرف شيئًا عن جينيسيس.
 *
 * نُنفّذها كإضافة لا كمسار مستقل لأن setSessionCookie تتطلّب سياق نقطة
 * better-call، ولا يمكن تركيبه يدويًا داخل Route Handler.
 */
export const genesisSso = () =>
  ({
    id: 'genesis-sso',
    endpoints: {
      genesisSignIn: createAuthEndpoint(
        '/genesis/sign-in',
        // بلا مخطّط body: zod ليست من اعتماديات مورِد، و better-call يحلّل جسم
        // JSON بلا مخطّط، فنتحقّق يدويًا من الحقل الوحيد.
        { method: 'POST' },
        async (ctx) => {
          if (!genesisSsoEnabled()) {
            throw new APIError('NOT_FOUND', { message: 'Genesis SSO is not configured' })
          }

          const body = ctx.body as { token?: unknown } | undefined
          if (typeof body?.token !== 'string' || body.token === '') {
            throw new APIError('BAD_REQUEST', { message: 'token مطلوب' })
          }

          const identity = await verifyGenesisToken(body.token)
          if (!identity) {
            throw new APIError('UNAUTHORIZED', { message: 'رمز جينيسيس غير صالح' })
          }

          const e164 = toE164(identity.phone)
          if (!e164) {
            throw new APIError('BAD_REQUEST', { message: 'رقم الجوال غير صالح' })
          }

          const resolved = await resolveMawridUser(identity)
          if (!resolved.ok && resolved.reason === 'ambiguous') {
            // أكثر من حساب يحمل الرقم — لا نخمّن أيّها المقصود.
            throw new APIError('CONFLICT', {
              message: 'أكثر من حساب يحمل هذا الرقم — تواصل مع الدعم',
            })
          }
          if (!resolved.ok && resolved.reason === 'banned') {
            throw new APIError('FORBIDDEN', { message: 'الحساب موقوف' })
          }
          if (!resolved.ok && resolved.reason === 'bad-phone') {
            throw new APIError('BAD_REQUEST', { message: 'رقم الجوال غير صالح' })
          }

          const adapter = ctx.context.internalAdapter
          // جينيسيس مصدر الحقيقة للهوية: نقرأ الملف عند كل دخول، لا عند
          // الإنشاء فقط، وإلا بقي الاسم/البريد المحدَّث في جينيسيس غير ظاهر.
          // الفشل هنا لا يمنع الدخول — الملف تحسين لا شرط.
          const profile = await fetchGenesisUserInfo(body.token)

          let userId: string
          if (resolved.ok) {
            userId = resolved.userId
            if (profile) await syncProfileFromGenesis(userId, profile)
          } else {
            // لا حساب بهذا الرقم → ننشئ حساب مستهلك، تمامًا كالدخول السريع
            // برمز OTP: لا تسجيل مسبق في مورِد مطلوب.
            // البريد إلزامي وفريد في المخطّط، وجينيسيس هوية قائمة على الجوال
            // فقط، لذا نشتقّ بريدًا اصطناعيًا لا يصل إليه بريد حقيقي أبدًا.
            const created = await adapter.createUser({
              email: profile?.email ?? `${e164.replace('+', '')}@genesis.local`,
              name: profile?.name ?? 'مستخدم جينيسيس',
              emailVerified: false,
              phone: e164,
            })
            userId = created.id
            await markPhoneVerified(userId)
          }

          const found = await adapter.findUserById(userId)
          if (!found) {
            throw new APIError('INTERNAL_SERVER_ERROR', { message: 'تعذّر إنشاء الجلسة' })
          }

          const session = await adapter.createSession(userId)
          await setSessionCookie(ctx, { session, user: found })

          return ctx.json({ ok: true })
        },
      ),
    },
  }) satisfies BetterAuthPlugin
