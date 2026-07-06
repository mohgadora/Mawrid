/**
 * services/otp.ts — SMS OTP (phone verification).
 *
 * الرمز يُخزَّن مُجزّأً (sha256) لا كنص صريح. حد المعدّل: رمز واحد كل 60 ثانية لكل
 * رقم، وحتى 5 محاولات تحقق قبل الإبطال. مزوّد SMS: Twilio عند توفّر مفاتيحه، وإلا
 * يُطبع الرمز في السجل للتطوير.
 */
import 'server-only'
import { createHash } from 'node:crypto'
import { db } from '@/lib/db'
import { phoneVerification } from '@/lib/db/schema'
import { eq, desc, gt, and } from 'drizzle-orm'
import { ValidationError } from '@/lib/errors'

const CODE_TTL_MS = 5 * 60 * 1000
const RESEND_COOLDOWN_MS = 60 * 1000
const MAX_ATTEMPTS = 5

/** يطبّع رقم الجوال إلى صيغة دولية بسيطة (+ ثم أرقام). */
function normalizePhone(raw: string): string {
  const trimmed = String(raw ?? '').trim().replace(/[\s-]/g, '')
  if (!/^\+?[0-9]{8,15}$/.test(trimmed)) throw new ValidationError('رقم جوال غير صالح')
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`
}

function hashCode(code: string, phone: string): string {
  return createHash('sha256').update(`${code}:${phone}`).digest('hex')
}

/** يولّد رمزاً من 6 أرقام دون تحيّز رياضي كبير. */
function generateCode(): string {
  const buf = crypto.getRandomValues(new Uint32Array(1))[0]
  return String(buf % 1_000_000).padStart(6, '0')
}

async function deliverSms(phone: string, code: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_PHONE_NUMBER
  const body = `رمز التحقق الخاص بك في مورِد: ${code}`

  if (sid && token && from) {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: phone, From: from, Body: body }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error('[otp] Twilio send failed:', res.status, detail)
      throw new ValidationError('تعذّر إرسال الرمز، حاول لاحقاً')
    }
    return
  }

  // Dev fallback — no SMS gateway configured
  console.info(`[otp] (dev) OTP for ${phone}: ${code}`)
}

/** يرسل رمز تحقق لرقم الجوال (مع حدّ معدّل). */
export async function sendOtp(rawPhone: string): Promise<{ phone: string; devCode?: string }> {
  const phone = normalizePhone(rawPhone)

  const [last] = await db
    .select({ createdAt: phoneVerification.createdAt })
    .from(phoneVerification)
    .where(eq(phoneVerification.phone, phone))
    .orderBy(desc(phoneVerification.createdAt))
    .limit(1)
  if (last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    throw new ValidationError('يرجى الانتظار قبل طلب رمز جديد')
  }

  const code = generateCode()
  await db.insert(phoneVerification).values({
    id: crypto.randomUUID(),
    phone,
    codeHash: hashCode(code, phone),
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
    attempts: 0,
    verified: false,
  })

  await deliverSms(phone, code)

  // في التطوير فقط نُعيد الرمز لتسهيل الاختبار
  const isDev = process.env.NODE_ENV !== 'production' && !process.env.TWILIO_ACCOUNT_SID
  return { phone, ...(isDev ? { devCode: code } : {}) }
}

/** يتحقق من الرمز لرقم الجوال. يرمي عند الفشل، ويُرجع true عند النجاح. */
export async function verifyOtp(rawPhone: string, code: string): Promise<boolean> {
  const phone = normalizePhone(rawPhone)
  const clean = String(code ?? '').trim()
  if (!/^[0-9]{6}$/.test(clean)) throw new ValidationError('الرمز يجب أن يكون 6 أرقام')

  const [row] = await db
    .select()
    .from(phoneVerification)
    .where(and(eq(phoneVerification.phone, phone), eq(phoneVerification.verified, false), gt(phoneVerification.expiresAt, new Date())))
    .orderBy(desc(phoneVerification.createdAt))
    .limit(1)

  if (!row) throw new ValidationError('انتهت صلاحية الرمز أو لم يُطلب بعد')
  if (row.attempts >= MAX_ATTEMPTS) throw new ValidationError('تجاوزت عدد المحاولات المسموح، اطلب رمزاً جديداً')

  if (row.codeHash !== hashCode(clean, phone)) {
    await db.update(phoneVerification).set({ attempts: row.attempts + 1 }).where(eq(phoneVerification.id, row.id))
    throw new ValidationError('الرمز غير صحيح')
  }

  await db.update(phoneVerification).set({ verified: true }).where(eq(phoneVerification.id, row.id))
  return true
}
