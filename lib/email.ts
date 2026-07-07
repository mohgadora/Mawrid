/**
 * lib/email.ts — Thin email sender using Resend.
 * Set RESEND_API_KEY and EMAIL_FROM in .env to enable.
 * Falls back to console.info in development when the key is absent.
 */

type SendOptions = {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? 'noreply@mawrid.sa'

  if (!apiKey) {
    // Development fallback — log to console so the dev can copy the link
    console.info(`[email] Would send to ${to}: ${subject}`)
    console.info(`[email] HTML preview:\n${html.replace(/<[^>]+>/g, ' ').trim().slice(0, 500)}`)
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from, to, subject, html }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`[email] Resend API error ${res.status}: ${text}`)
  }
}

/** Password reset email in Arabic + English */
export function buildPasswordResetEmail(url: string): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><title>إعادة تعيين كلمة المرور</title></head>
<body style="font-family:system-ui,sans-serif;background:#f5f5f5;margin:0;padding:2rem;">
  <div style="max-width:480px;margin:auto;background:#fff;border-radius:1rem;padding:2rem;box-shadow:0 2px 8px rgba(0,0,0,.1);">
    <h2 style="margin-top:0;color:#111">إعادة تعيين كلمة المرور</h2>
    <p style="color:#444;line-height:1.6">
      تلقّينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.
      اضغط على الزر أدناه لاختيار كلمة مرور جديدة.
    </p>
    <a href="${url}"
       style="display:inline-block;background:#e11d48;color:#fff;text-decoration:none;padding:.75rem 1.5rem;border-radius:.5rem;font-weight:600;margin:1rem 0;">
      إعادة تعيين كلمة المرور
    </a>
    <p style="color:#888;font-size:.8rem;margin-top:1.5rem;">
      إذا لم تطلب هذا، يمكنك تجاهل هذا البريد. الرابط صالح لمدة ساعة واحدة فقط.
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:1.5rem 0;">
    <p style="color:#888;font-size:.75rem;text-align:center;">مـوريد · منصة التجارة الإلكترونية</p>
  </div>
</body>
</html>`
}
