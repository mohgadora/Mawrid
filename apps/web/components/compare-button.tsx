'use client'

import { GitCompare, Check } from 'lucide-react'
import { useCompare } from '@/lib/compare'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function CompareButton({
  productId,
  className,
}: {
  productId: string
  className?: string
}) {
  const { toggle, isInCompare, isFull } = useCompare()
  const { lang } = useI18n()
  const active = isInCompare(productId)
  const disabled = isFull && !active

  return (
    <button
      onClick={() => toggle(productId)}
      disabled={disabled}
      aria-pressed={active}
      aria-label={
        active
          ? lang === 'ar' ? 'إزالة من المقارنة' : 'Remove from compare'
          : lang === 'ar' ? 'أضف للمقارنة' : 'Add to compare'
      }
      className={cn(
        'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
        active
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-accent hover:text-foreground',
        disabled && 'cursor-not-allowed opacity-40',
        className,
      )}
    >
      {active ? (
        <Check className="size-3.5" />
      ) : (
        <GitCompare className="size-3.5" />
      )}
      {active
        ? lang === 'ar' ? 'في المقارنة' : 'In compare'
        : lang === 'ar' ? 'قارن' : 'Compare'}
    </button>
  )
}
