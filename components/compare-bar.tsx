'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { X, GitCompare } from 'lucide-react'
import { useCompare } from '@/lib/compare'
import { useI18n } from '@/lib/i18n'
import { PRODUCTS } from '@/lib/data'

export function CompareBar() {
  const { ids, toggle, clear, count } = useCompare()
  const { lang } = useI18n()
  const router = useRouter()

  if (count === 0) return null

  const products = ids.map((id) => PRODUCTS.find((p) => p.id === id)).filter(Boolean)

  return (
    <div className="fixed inset-x-0 bottom-16 z-50 flex items-center justify-center px-4 lg:bottom-4">
      <div className="flex w-full max-w-xl items-center gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur-sm">
        {/* Products thumbnails */}
        <div className="flex flex-1 items-center gap-2">
          {products.map((p) => p && (
            <div key={p.id} className="group relative">
              <div className="relative size-12 overflow-hidden rounded-lg border border-border bg-muted">
                <Image
                  src={p.image || '/placeholder.svg'}
                  alt={lang === 'ar' ? p.nameAr : p.nameEn}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <button
                onClick={() => toggle(p.id)}
                aria-label={lang === 'ar' ? 'إزالة' : 'Remove'}
                className="absolute -end-1 -top-1 grid size-4 place-items-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="size-2.5" />
              </button>
            </div>
          ))}
          {/* Empty slots */}
          {Array.from({ length: 3 - count }).map((_, i) => (
            <div
              key={i}
              className="size-12 rounded-lg border-2 border-dashed border-border bg-muted/40"
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <p className="hidden text-xs text-muted-foreground sm:block">
            {lang === 'ar'
              ? `${count} من 3 منتجات`
              : `${count} of 3 products`}
          </p>
          <button
            onClick={clear}
            className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent"
          >
            {lang === 'ar' ? 'مسح' : 'Clear'}
          </button>
          <button
            onClick={() => router.push(`/compare?ids=${ids.join(',')}`)}
            disabled={count < 2}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-40"
          >
            <GitCompare className="size-4" />
            {lang === 'ar' ? 'قارن' : 'Compare'}
          </button>
        </div>
      </div>
    </div>
  )
}
