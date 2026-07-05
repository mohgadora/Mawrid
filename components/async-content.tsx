'use client'

import type { ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

/**
 * Standardises the four states every screen must handle: loading / error /
 * empty / success. Fed directly by SWR's `{ data, error, isLoading }`.
 */
export function AsyncContent<T>({
  data,
  error,
  isLoading,
  loading,
  isEmpty,
  empty,
  onRetry,
  children,
}: {
  data: T | undefined
  error: unknown
  isLoading: boolean
  loading?: ReactNode
  isEmpty?: (data: T) => boolean
  empty?: ReactNode
  onRetry?: () => void
  children: (data: T) => ReactNode
}) {
  const { t } = useI18n()
  const loadingNode = loading ?? (
    <div className="flex items-center justify-center py-16 text-muted-foreground">
      <RefreshCw className="size-6 animate-spin" aria-hidden="true" />
    </div>
  )

  if (isLoading || data === undefined) {
    if (error && data === undefined && !isLoading) {
      // fall through to error below
    } else {
      return <>{loadingNode}</>
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-destructive/40 bg-card px-6 py-16 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-8" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold text-foreground">{t('errorTitle')}</h2>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground text-pretty">
            {t('errorDesc')}
          </p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <RefreshCw className="size-4" />
            {t('retry')}
          </button>
        )}
      </div>
    )
  }

  if (data === undefined) return <>{loadingNode}</>

  if (isEmpty && empty && isEmpty(data)) return <>{empty}</>

  return <>{children(data)}</>
}
