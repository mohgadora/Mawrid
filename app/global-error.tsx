'use client'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f5f5f5' }}>
        <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1.5rem', textAlign: 'center', padding: '1rem' }}>
          <p style={{ fontSize: '3rem', margin: 0 }}>⚠️</p>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 0.5rem' }}>حدث خطأ حرج</h2>
            <p style={{ color: '#666', fontSize: '0.875rem', margin: 0 }}>يرجى إعادة تحميل الصفحة.</p>
          </div>
          <button
            onClick={reset}
            style={{ background: '#e11d48', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
          >
            إعادة المحاولة
          </button>
        </main>
      </body>
    </html>
  )
}
