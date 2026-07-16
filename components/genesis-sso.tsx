'use client'

import { useEffect, useRef } from 'react'
import { authClient } from '@/lib/auth-client'

/**
 * الدخول الموحّد عند تشغيل مورِد داخل تطبيق جينيسيس.
 *
 * حاوية WebView في جينيسيس تحقن جسر `window.genesis`. عند غياب جلسة مورِد
 * نطلب من الجسر رمزًا محدود النطاق ونبادله بجلسة better-auth، فيظهر المستخدم
 * مسجّلًا بدل حالة الضيف. في متصفح عادي لا يوجد جسر فلا يحدث شيء.
 *
 * لا يعرض هذا المكوّن أي واجهة.
 */

interface GenesisBridge {
  getScopedToken: () => Promise<string>
}

declare global {
  interface Window {
    genesis?: Partial<GenesisBridge>
  }
}

/** الجسر قد يصل بعد سكربتات الصفحة على أندرويد — ننتظر genesisready كاحتياط. */
const BRIDGE_WAIT_MS = 2_000

function waitForBridge(): Promise<GenesisBridge | null> {
  const ready = () =>
    typeof window.genesis?.getScopedToken === 'function'
      ? (window.genesis as GenesisBridge)
      : null

  const existing = ready()
  if (existing) return Promise.resolve(existing)

  return new Promise((resolve) => {
    let done = false
    const finish = (value: GenesisBridge | null) => {
      if (done) return
      done = true
      document.removeEventListener('genesisready', onReady)
      clearTimeout(timer)
      resolve(value)
    }
    const onReady = () => finish(ready())
    document.addEventListener('genesisready', onReady)
    const timer = setTimeout(() => finish(ready()), BRIDGE_WAIT_MS)
  })
}

export function GenesisSso() {
  const { refetch } = authClient.useSession()
  // محاولة واحدة لكل تحميل: الفشل يعني بقاء المستخدم ضيفًا، لا حلقة إعادة.
  const attempted = useRef(false)

  useEffect(() => {
    // لا نتخطّى عند وجود جلسة: الجلسة تعيش أسبوعًا، ولو اكتفينا بالدخول
    // الأول لبقي الاسم/البريد المحدَّث في جينيسيس غير ظاهر طوال تلك المدة.
    // كل فتح للصفحة داخل التطبيق يعيد المزامنة من المضيف.
    if (attempted.current) return
    attempted.current = true

    void (async () => {
      const bridge = await waitForBridge()
      if (!bridge) return // متصفح عادي — لا جسر.

      try {
        const token = await bridge.getScopedToken()
        const res = await fetch('/api/auth/genesis/sign-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
          credentials: 'include',
        })
        if (!res.ok) return
        await refetch()
      } catch {
        // الجسر أو التبادل فشل — نبقى ضيوفًا بصمت بدل تعطيل الصفحة.
      }
    })()
  }, [refetch])

  return null
}
