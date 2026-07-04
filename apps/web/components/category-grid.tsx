'use client'

import Link from 'next/link'
import { CATEGORIES } from '@/lib/data'
import { useI18n } from '@/lib/i18n'
import { CategoryIcon } from '@/components/category-icon'

export function CategoryGrid() {
  const { t, lang } = useI18n()

  return (
    <section className="mx-auto max-w-7xl px-4 pt-6">
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h2 className="mb-3 text-base font-bold text-foreground sm:text-lg">
          {t('categories')}
        </h2>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 sm:gap-3">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/?cat=${c.slug}#products`}
              className="group flex flex-col items-center gap-2 rounded-xl p-2 text-center transition-colors hover:bg-accent"
            >
              <span className="grid size-12 place-items-center rounded-full bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground sm:size-14">
                <CategoryIcon name={c.icon} className="size-6" />
              </span>
              <span className="line-clamp-2 text-[11px] font-medium leading-tight text-foreground sm:text-xs">
                {lang === 'ar' ? c.nameAr : c.nameEn}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
