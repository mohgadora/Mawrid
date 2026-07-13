'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { TrendingUp, Clock } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { authClient } from '@/lib/auth-client'
import { fetchPopularSearches, fetchRecentSearches } from '@/lib/api-client'

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((q) => (
        <Link
          key={q}
          href={`/search?q=${encodeURIComponent(q)}`}
          className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
        >
          {q}
        </Link>
      ))}
    </div>
  )
}

export function SearchSuggestions() {
  const { lang } = useI18n()
  const { data: session } = authClient.useSession()
  const { data: popular } = useSWR<string[]>('search/popular', fetchPopularSearches)
  const { data: recent } = useSWR<string[]>(session?.user ? 'search/recent' : null, fetchRecentSearches)

  if (!popular?.length && !recent?.length) return null

  return (
    <div className="mx-auto mt-6 max-w-2xl space-y-5">
      {recent && recent.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-muted-foreground">
            <Clock className="size-4" /> {lang === 'ar' ? 'عمليات بحثك الأخيرة' : 'Your recent searches'}
          </h3>
          <Chips items={recent} />
        </div>
      )}
      {popular && popular.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-muted-foreground">
            <TrendingUp className="size-4" /> {lang === 'ar' ? 'الأكثر بحثاً' : 'Popular searches'}
          </h3>
          <Chips items={popular} />
        </div>
      )}
    </div>
  )
}
