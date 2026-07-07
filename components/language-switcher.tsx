'use client'

import { useI18n, type Lang } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const LANGS: { code: Lang; label: string }[] = [
  { code: 'ar', label: 'AR' },
  { code: 'en', label: 'EN' },
]

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useI18n()

  return (
    <div className={cn('flex items-center gap-0.5 rounded-md border border-border bg-background p-0.5', className)}>
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => {
            setLang(code)
            localStorage.setItem('mawrid-locale', code)
          }}
          className={cn(
            'rounded px-2 py-0.5 text-xs font-medium transition-colors',
            lang === code
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
          aria-pressed={lang === code}
          aria-label={code === 'ar' ? 'العربية' : 'English'}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
