'use client'

import { useId, useState } from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Lightweight accessible tooltip triggered by an info icon.
 * Opens on hover and keyboard focus; content is announced via aria-describedby.
 */
export function InfoTooltip({
  children,
  label,
  className,
  iconClassName,
}: {
  children: React.ReactNode
  label: string
  className?: string
  iconClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <span className={cn('relative inline-flex', className)}>
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Info className={cn('size-3.5', iconClassName)} />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute bottom-full start-1/2 z-50 mb-2 w-max max-w-56 -translate-x-1/2 rounded-lg border border-border bg-popover px-3 py-2 text-start text-xs leading-relaxed text-popover-foreground shadow-lg rtl:translate-x-1/2"
        >
          {children}
        </span>
      )}
    </span>
  )
}
