'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center" dir="rtl">
      <div className="space-y-2">
        <p className="text-5xl">⚠️</p>
        <h2 className="text-xl font-bold text-foreground">حدث خطأ غير متوقع</h2>
        <p className="text-sm text-muted-foreground">
          نعتذر عن هذا الخلل. يمكنك المحاولة مجدداً أو العودة للصفحة الرئيسية.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
        >
          حاول مجدداً
        </button>
        <a
          href="/"
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition"
        >
          الرئيسية
        </a>
      </div>
    </main>
  )
}
