/**
 * lib/observability.ts — نقطة واحدة لالتقاط الأخطاء.
 *
 * الآن: سجلّ منظّم (JSON) يسهل تجميعه في أي مُجمّع سجلّات. لاحقاً: يكفي ربط
 * Sentry (أو ما يماثله) هنا عبر SENTRY_DSN دون تغيير مواقع الاستدعاء.
 */

type ErrorContext = {
  scope?: string
  route?: string
  userId?: string
  [k: string]: unknown
}

/** يلتقط خطأً ويسجّله بشكل منظّم. يُرجع مُعرّف حدث قصير للربط مع رسالة المستخدم. */
export function captureError(err: unknown, context: ErrorContext = {}): string {
  const eventId = shortId()
  const payload = {
    ts: new Date().toISOString(),
    level: 'error',
    eventId,
    scope: context.scope ?? 'app',
    message: err instanceof Error ? err.message : String(err),
    name: err instanceof Error ? err.name : undefined,
    stack: err instanceof Error ? err.stack : undefined,
    ...context,
  }
  // سطر JSON واحد لكل خطأ — قابل للتجميع (Loki/CloudWatch/…)
  console.error(JSON.stringify(payload))

  // نقطة ربط Sentry المستقبلية (بدون اعتمادية إضافية الآن):
  // if (process.env.SENTRY_DSN) sentry.captureException(err, { extra: context, tags: { eventId } })

  return eventId
}

function shortId(): string {
  try {
    return crypto.randomUUID().slice(0, 8)
  } catch {
    return Math.abs(Date.now() % 1e8).toString(36)
  }
}
