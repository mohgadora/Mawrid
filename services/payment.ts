/**
 * services/payment.ts — Moyasar payment gateway (invoices flow).
 *
 * الأسعار مخزّنة بالدولار؛ Moyasar يُحصّل بالريال السعودي (SAR) بأصغر وحدة
 * (هللات). التحويل عبر سعر الصرف في lib/config. لا نتعامل مع بيانات البطاقة —
 * نُنشئ فاتورة مستضافة ونعيد توجيه المشتري، ثم نتحقّق في callback.
 *
 * بلا MOYASAR_API_KEY: مسار تطوير يُرجع رابطاً محلياً ولا يُغيّر حالة الدفع.
 */
import 'server-only'
import { db } from '@/lib/db'
import { order } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { writeAuditLog } from '@/lib/audit'
import { CURRENCY_CONFIG } from '@/lib/config'
import { toCents } from '@/lib/money'

const MOYASAR_BASE = 'https://api.moyasar.com/v1'

function sarHalalasFromUsd(usd: number): number {
  // USD → SAR ثم إلى هللات (أصغر وحدة)
  const sar = usd * CURRENCY_CONFIG.SAR.rate
  return Math.max(100, toCents(sar)) // toCents يعطي هللات لأن SAR بخانتين عشريتين
}

function authHeader(): string {
  const key = process.env.MOYASAR_API_KEY ?? ''
  return `Basic ${Buffer.from(`${key}:`).toString('base64')}`
}

/**
 * يُنشئ فاتورة دفع للطلب ويُعيد رابط الدفع المستضاف.
 * يتحقّق من ملكية الطلب وأنه غير مدفوع.
 */
export async function createPaymentInvoice(
  userId: string,
  orderId: string,
  siteUrl: string,
): Promise<{ url: string; invoiceId: string | null; dev: boolean }> {
  const [ord] = await db.select().from(order).where(and(eq(order.id, orderId), eq(order.userId, userId))).limit(1)
  if (!ord) throw new NotFoundError('الطلب غير موجود')
  if (ord.paymentStatus === 'paid') throw new ValidationError('الطلب مدفوع بالفعل')

  const amount = sarHalalasFromUsd(Number(ord.total))
  const callbackUrl = `${siteUrl}/api/v1/payments/callback?orderId=${encodeURIComponent(orderId)}`

  if (!process.env.MOYASAR_API_KEY) {
    // مسار تطوير: لا بوابة مُعدّة — أعد المستخدم لصفحة الطلب دون تغيير الحالة
    return { url: `${siteUrl}/orders/${orderId}?payment=unconfigured`, invoiceId: null, dev: true }
  }

  const res = await fetch(`${MOYASAR_BASE}/invoices`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount,
      currency: 'SAR',
      description: `طلب ${ord.ref}`,
      callback_url: callbackUrl,
      metadata: { orderId },
    }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    console.error('[payment] Moyasar invoice failed:', res.status, detail)
    throw new ValidationError('تعذّر إنشاء عملية الدفع، حاول لاحقاً')
  }
  const inv = (await res.json()) as { id: string; url: string }
  await db.update(order).set({ paymentRef: inv.id, updatedAt: new Date() }).where(eq(order.id, orderId))
  await writeAuditLog({ userId, action: 'payment.invoice_created', entity: 'order', entityId: orderId, meta: { invoiceId: inv.id, amount } })
  return { url: inv.url, invoiceId: inv.id, dev: false }
}

/**
 * يتحقّق من فاتورة/دفعة ويُسوّي حالة الطلب. يُستدعى من callback.
 * يُرجع الحالة النهائية ('paid' | 'failed' | 'pending').
 */
export async function verifyAndSettle(orderId: string, invoiceId?: string | null): Promise<'paid' | 'failed' | 'pending'> {
  const [ord] = await db.select().from(order).where(eq(order.id, orderId)).limit(1)
  if (!ord) throw new NotFoundError('الطلب غير موجود')
  if (ord.paymentStatus === 'paid') return 'paid'

  if (!process.env.MOYASAR_API_KEY) return 'pending'

  const id = invoiceId || ord.paymentRef
  if (!id) return 'pending'

  const res = await fetch(`${MOYASAR_BASE}/invoices/${id}`, { headers: { Authorization: authHeader() } })
  if (!res.ok) {
    console.error('[payment] Moyasar verify failed:', res.status)
    return 'pending'
  }
  const inv = (await res.json()) as { status: string; amount: number; currency: string }

  const expected = sarHalalasFromUsd(Number(ord.total))
  const paid = inv.status === 'paid' && inv.currency === 'SAR' && Math.abs(inv.amount - expected) <= 1

  if (paid) {
    await db.update(order).set({ paymentStatus: 'paid', updatedAt: new Date() }).where(eq(order.id, orderId))
    await writeAuditLog({ userId: ord.userId, action: 'payment.settled', entity: 'order', entityId: orderId, meta: { invoiceId: id } })
    return 'paid'
  }
  if (inv.status === 'failed') return 'failed'
  return 'pending'
}
