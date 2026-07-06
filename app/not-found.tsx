import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center" dir="rtl">
      <div className="space-y-2">
        <p className="text-8xl font-black text-primary">404</p>
        <h1 className="text-2xl font-bold text-foreground">الصفحة غير موجودة</h1>
        <p className="text-sm text-muted-foreground">
          الرابط الذي تبحث عنه غير موجود أو تم نقله.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
      >
        العودة إلى الرئيسية
      </Link>
    </main>
  )
}
