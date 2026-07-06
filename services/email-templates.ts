/**
 * services/email-templates.ts — قوالب بريد لكل حدث مع متغيّرات {{var}}.
 * الإرسال يعيد استخدام lib/email.ts (Resend) بدل مزوّد ثانٍ.
 */
import 'server-only'
import { db } from '@/lib/db'
import { emailTemplate } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { writeAuditLog } from '@/lib/audit'
import { sendEmail } from '@/lib/email'

type DbTemplate = typeof emailTemplate.$inferSelect

/** يستبدل {{key}} بقيمها. المفاتيح غير الموجودة تُترك فارغة. */
export function renderTemplate(text: string, variables: Record<string, string | number>): string {
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key: string) => {
    const v = variables[key]
    return v == null ? '' : String(v)
  })
}

export async function listTemplates(): Promise<DbTemplate[]> {
  return db.select().from(emailTemplate).orderBy(emailTemplate.event).limit(200)
}

export async function getTemplate(event: string): Promise<DbTemplate | null> {
  const [row] = await db.select().from(emailTemplate).where(eq(emailTemplate.event, event)).limit(1)
  return row ?? null
}

export type EmailTemplateInput = {
  event: string
  subjectAr: string
  bodyAr: string
  subjectEn?: string | null
  bodyEn?: string | null
  active?: boolean
}

export async function upsertTemplate(data: EmailTemplateInput, adminId: string): Promise<DbTemplate> {
  if (!data.event?.trim()) throw new ValidationError('اسم الحدث مطلوب')
  if (!data.subjectAr?.trim() || !data.bodyAr?.trim()) throw new ValidationError('الموضوع والنص بالعربية مطلوبان')

  const values = {
    subjectAr: data.subjectAr,
    bodyAr: data.bodyAr,
    subjectEn: data.subjectEn ?? null,
    bodyEn: data.bodyEn ?? null,
    active: data.active ?? true,
    updatedAt: new Date(),
  }
  const [row] = await db
    .insert(emailTemplate)
    .values({ id: crypto.randomUUID(), event: data.event.trim(), ...values })
    .onConflictDoUpdate({ target: emailTemplate.event, set: values })
    .returning()
  await writeAuditLog({ userId: adminId, action: 'email_template.upsert', entity: 'email_template', entityId: row.id })
  return row
}

export async function deleteTemplate(id: string, adminId: string): Promise<void> {
  await db.delete(emailTemplate).where(eq(emailTemplate.id, id))
  await writeAuditLog({ userId: adminId, action: 'email_template.delete', entity: 'email_template', entityId: id })
}

/**
 * يرسل بريداً من قالب حدث مع تعبئة المتغيّرات. آمن للفشل — يُسجّل ولا يرمي، حتى
 * لا يُعطّل تدفّق العمل (طلب/محفظة...) عند غياب القالب أو فشل المزوّد.
 */
export async function sendTemplatedEmail(
  to: string,
  event: string,
  variables: Record<string, string | number> = {},
  lang: 'ar' | 'en' = 'ar',
): Promise<boolean> {
  try {
    const tpl = await getTemplate(event)
    if (!tpl || !tpl.active) return false
    const subject = renderTemplate(lang === 'en' && tpl.subjectEn ? tpl.subjectEn : tpl.subjectAr, variables)
    const body = renderTemplate(lang === 'en' && tpl.bodyEn ? tpl.bodyEn : tpl.bodyAr, variables)
    await sendEmail({ to, subject, html: body })
    return true
  } catch (err) {
    console.error(`[email-template] send failed for event ${event}:`, err)
    return false
  }
}

/** يرسل بريداً تجريبياً من القالب (لمعاينة الأدمن). */
export async function sendTestTemplate(id: string, to: string): Promise<void> {
  const [tpl] = await db.select().from(emailTemplate).where(eq(emailTemplate.id, id)).limit(1)
  if (!tpl) throw new NotFoundError('القالب غير موجود')
  const sample = { name: 'أحمد', orderRef: 'ORD-123', amount: '150.00' }
  await sendEmail({
    to,
    subject: `[تجربة] ${renderTemplate(tpl.subjectAr, sample)}`,
    html: renderTemplate(tpl.bodyAr, sample),
  })
}
