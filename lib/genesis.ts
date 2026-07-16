import 'server-only'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'

/**
 * تكامل الدخول الموحّد مع تطبيق جينيسيس (SuperApp) — ADR-0008.
 *
 * مورِد يعمل كـ web miniapp داخل حاوية WebView في جينيسيس. المضيف يحقن جسر
 * `window.genesis`، والصفحة تطلب منه رمزًا محدود النطاق (scoped token) ثم
 * ترسله إلى هنا.
 *
 * التحقّق يتم **محليًا** عبر المفاتيح العامة المنشورة في JWKS: لا سرّ مشترك
 * يُزوَّد لكل miniapp، ولا نداء شبكي لجينيسيس عند كل دخول. هذا هو العقد
 * القياسي نفسه لكل miniapp لاحق — لا شيء هنا خاص بمورِد سوى GENESIS_AUDIENCE.
 */

const GENESIS_ISSUER = (process.env.GENESIS_ISSUER ?? '').replace(/\/$/, '')

/** مُعرّف مورِد في سجلّ جينيسيس — يجب أن يطابق مطالبة aud في الرمز. */
const GENESIS_AUDIENCE = 'mawrid'

export const genesisSsoEnabled = () => GENESIS_ISSUER !== ''

/**
 * jose يجلب JWKS ويخزّنه مؤقتًا ويعيد الجلب عند ظهور kid جديد — فتدوير
 * المفاتيح في جينيسيس لا يتطلّب أي تغيير هنا.
 */
const jwks = genesisSsoEnabled()
  ? createRemoteJWKSet(new URL(`${GENESIS_ISSUER}/.well-known/jwks.json`))
  : null

export interface GenesisIdentity {
  genesisUserId: string
  /** رقم الجوال بصيغة E.164 كما يصدره جينيسيس. */
  phone: string
}

/**
 * يتحقّق من رمز جينيسيس محدود النطاق محليًا. يعيد null لأي رمز غير صالح أو
 * منتهٍ أو موجّه لخدمة أخرى — لا نفرّق بين أسباب الرفض تجاه العميل.
 */
export async function verifyGenesisToken(token: string): Promise<GenesisIdentity | null> {
  if (!jwks) return null

  try {
    const { payload } = await jwtVerify(token, jwks, {
      // issuer + audience يمنعان إعادة استخدام رمز صادر لخدمة مصغّرة أخرى،
      // و jose يفرض التوقيع والصلاحية. الخوارزمية مثبّتة لمنع هجوم alg=none.
      issuer: GENESIS_ISSUER,
      audience: GENESIS_AUDIENCE,
      algorithms: ['RS256'],
    })

    // رموز المضيف كاملة الصلاحية لا تحمل typ=miniapp — لا تُقبل هنا أبدًا.
    if (payload.typ !== 'miniapp') return null
    if (typeof payload.sub !== 'string' || typeof payload.phone !== 'string') return null

    return { genesisUserId: payload.sub, phone: payload.phone }
  } catch {
    return null
  }
}

/** ملف المستخدم كما تعرضه نقطة UserInfo القياسية في جينيسيس. */
export interface GenesisUserInfo {
  sub: string
  name?: string
  phone_number?: string
  locale?: string
  picture?: string
  email?: string
}

/**
 * يقرأ تفاصيل المستخدم من جينيسيس (OIDC UserInfo). المطالبات محكومة بنطاقات
 * الرمز، فما لم يطلب مورِد صلاحية user.read لن يعود سوى المعرّف.
 */
export async function fetchGenesisUserInfo(token: string): Promise<GenesisUserInfo | null> {
  if (!genesisSsoEnabled()) return null
  try {
    const res = await fetch(`${GENESIS_ISSUER}/api/v1/userinfo`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    })
    return res.ok ? ((await res.json()) as GenesisUserInfo) : null
  } catch {
    // الملف تحسين للعرض فقط — الدخول لا يتوقّف عليه.
    return null
  }
}

/**
 * يوحّد صيغة رقم الجوال السعودي إلى E.164 (‎+9665XXXXXXXX‎).
 * جينيسيس يصدر ‎+966500000001‎ بينما قد يخزّن مورِد ‎0500000001‎.
 * يعيد null لما لا يطابق صيغة جوال سعودي.
 */
export function toE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  const national = digits.startsWith('966')
    ? digits.slice(3)
    : digits.startsWith('0')
      ? digits.slice(1)
      : digits
  return /^5\d{8}$/.test(national) ? `+966${national}` : null
}

/**
 * الصيغ المكافئة لرقم واحد، للمطابقة مع بيانات قديمة خُزّنت بصيغ مختلفة.
 * ‎+966500000001‎ → ‎+966500000001‎ / ‎966500000001‎ / ‎0500000001‎ / ‎500000001‎
 */
export function phoneVariants(e164: string): string[] {
  const national = e164.slice(4) // بعد ‎+966‎
  return [e164, `966${national}`, `0${national}`, national]
}

export type ResolveResult =
  | { ok: true; userId: string }
  | { ok: false; reason: 'no-match' | 'ambiguous' | 'banned' | 'bad-phone' }

/**
 * يبحث عن مستخدم مورِد المطابق لهوية جينيسيس عبر رقم الجوال.
 *
 * تعدّد المطابقات يُرفض بدل التخمين — الدخول إلى الحساب الخطأ أسوأ من عدم
 * الدخول. إنشاء الحساب عند غياب المطابقة يتم في نقطة الدخول نفسها عبر
 * internalAdapter حتى تُطبَّق أعراف better-auth (المعرّف، الطوابع، الدور).
 */
export async function resolveMawridUser(identity: GenesisIdentity): Promise<ResolveResult> {
  const e164 = toE164(identity.phone)
  if (!e164) return { ok: false, reason: 'bad-phone' }

  const matches = await db
    .select({ id: user.id, banned: user.banned })
    .from(user)
    .where(inArray(user.phone, phoneVariants(e164)))

  if (matches.length === 0) return { ok: false, reason: 'no-match' }
  if (matches.length > 1) return { ok: false, reason: 'ambiguous' }

  const found = matches[0]
  if (found.banned) return { ok: false, reason: 'banned' }
  return { ok: true, userId: found.id }
}

/**
 * يزامن ملف المستخدم من جينيسيس عند كل دخول — جينيسيس مصدر الحقيقة للهوية،
 * فتحديث الاسم أو البريد هناك يظهر في مورِد دون إعادة تسجيل.
 *
 * البريد فريد في المخطّط وهو مفتاح دخول كلمة المرور، فلا نكتبه إن كان مملوكًا
 * لحساب آخر — تغيير هوية حساب قائم أسوأ من بريد قديم. نكتب مباشرةً لأن
 * الحقول (image/‏name/‏email) خارج ما يمرّره better-auth عبر additionalFields.
 */
export async function syncProfileFromGenesis(
  userId: string,
  profile: GenesisUserInfo,
): Promise<void> {
  const update: {name?: string; email?: string; image?: string; updatedAt: Date} = {
    updatedAt: new Date(),
  }
  if (profile.name) update.name = profile.name
  if (profile.picture) update.image = profile.picture
  if (profile.email) {
    const [taken] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, profile.email))
    if (!taken || taken.id === userId) update.email = profile.email
  }
  await db.update(user).set(update).where(eq(user.id, userId))
}

/**
 * يثبّت توثيق الجوال للحساب المُنشأ من جينيسيس — فالرقم موثّق أصلًا برمز OTP
 * في جينيسيس قبل إصدار الرمز.
 *
 * يُكتب مباشرةً لأن better-auth يُسقط الحقول غير المعلنة في
 * user.additionalFields، و phoneVerified ليس منها؛ وهو نفس ما يفعله مسار
 * app/api/v1/auth/otp/verify في مورِد.
 */
export async function markPhoneVerified(userId: string): Promise<void> {
  await db
    .update(user)
    .set({ phoneVerified: true, updatedAt: new Date() })
    .where(eq(user.id, userId))
}
