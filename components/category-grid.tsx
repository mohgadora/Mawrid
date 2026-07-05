'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { CATEGORIES, type Category } from '@/lib/data'
import { useI18n } from '@/lib/i18n'
import { CategoryIcon } from '@/components/category-icon'

/** Recursively renders sub-category rows with indentation */
function SubCategoryRow({
  sub,
  lang,
  depth = 1,
}: {
  sub: Category
  lang: string
  depth?: number
}) {
  const [open, setOpen] = useState(false)
  const hasChildren = !!sub.children?.length
  const name = lang === 'ar' ? sub.nameAr : sub.nameEn
  const indent = depth * 14 + 12

  return (
    <li>
      <div className="flex items-center gap-1">
        <Link
          href={`/category/${sub.slug}`}
          className="flex flex-1 items-center gap-2 rounded-lg py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          style={{ paddingInlineStart: `${indent}px`, paddingInlineEnd: '8px' }}
        >
          <span className="size-1.5 shrink-0 rounded-full bg-primary/40" />
          {name}
        </Link>
        {hasChildren && (
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {open ? (
              <ChevronDown className="size-3.5" />
            ) : lang === 'ar' ? (
              <ChevronLeft className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </button>
        )}
      </div>
      {hasChildren && open && (
        <ul className="mt-0.5 space-y-0.5">
          {sub.children!.map((child) => (
            <SubCategoryRow key={child.slug} sub={child} lang={lang} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

/** Single root-level category card with expandable sub-tree */
function CategoryTreeItem({ cat, lang }: { cat: Category; lang: string }) {
  const [open, setOpen] = useState(false)
  const name = lang === 'ar' ? cat.nameAr : cat.nameEn
  const hasChildren = !!cat.children?.length

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Root header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link
          href={`/category/${cat.slug}`}
          className="group flex flex-1 items-center gap-3"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <CategoryIcon name={cat.icon} className="size-5" />
          </span>
          <span className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
            {name}
          </span>
        </Link>
        {hasChildren && (
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="grid size-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {open ? (
              <ChevronDown className="size-4" />
            ) : lang === 'ar' ? (
              <ChevronLeft className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
        )}
      </div>

      {/* Expandable sub-category tree */}
      {hasChildren && open && (
        <div className="border-t border-border bg-muted/30 px-3 py-2">
          <ul className="space-y-0.5">
            {cat.children!.map((sub) => (
              <SubCategoryRow key={sub.slug} sub={sub} lang={lang} depth={1} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function CategoryGrid() {
  const { t, lang } = useI18n()

  return (
    <section className="mx-auto max-w-7xl px-4 pt-6">
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h2 className="mb-4 text-base font-bold text-foreground sm:text-lg">
          {t('categories')}
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <CategoryTreeItem key={cat.slug} cat={cat} lang={lang} />
          ))}
        </div>
      </div>
    </section>
  )
}
