'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import { useI18n } from '@/lib/i18n'

/** Header dark-mode toggle. Wired to the existing dark oklch tokens. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()
  const { t } = useI18n()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t('toggleTheme')}
      aria-pressed={isDark}
      title={isDark ? t('lightMode') : t('darkMode')}
      className={
        'grid size-9 place-items-center rounded-md transition-colors hover:bg-primary-foreground/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/40 ' +
        (className ?? '')
      }
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  )
}
