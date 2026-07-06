'use client'

import useSWR from 'swr'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Star, Store, Package } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { fetchFollowedShops, type FollowedShop } from '@/lib/api-client'
import { ListSkeleton } from '@/components/skeletons'
import { EmptyState } from '@/components/empty-state'

export function FollowingView() {
  const { lang } = useI18n()
  const { data, isLoading } = useSWR<FollowedShop[]>('account/following', fetchFollowedShops)

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-4 flex items-center gap-2 text-xl font-black text-foreground">
        <Heart className="size-6 text-primary" />
        {lang === 'ar' ? 'المتاجر التي أتابعها' : 'Shops I follow'}
      </h1>

      {isLoading ? (
        <ListSkeleton count={4} />
      ) : !data?.length ? (
        <EmptyState
          icon={Store}
          title={lang === 'ar' ? 'لا تتابع أي متجر بعد' : 'Not following any shops yet'}
          description={lang === 'ar' ? 'تابع متاجرك المفضّلة لتصلك جديدها.' : 'Follow shops to keep up with their latest.'}
          actionLabel={lang === 'ar' ? 'تصفّح المتاجر' : 'Browse shops'}
          actionHref="/"
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((s) => (
            <li key={s.id}>
              <Link href={`/supplier/${s.id}`} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:bg-accent">
                <span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-accent">
                  <Image src={s.logo || '/placeholder-logo.png'} alt={s.nameAr ?? s.name} width={48} height={48} className="object-contain" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-foreground">{lang === 'ar' ? (s.nameAr ?? s.name) : s.name}</span>
                  <span className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Star className="size-3.5 text-yellow-500" />{Number(s.rating).toFixed(1)}</span>
                    <span className="flex items-center gap-1"><Package className="size-3.5" />{s.productCount}</span>
                    <span className="flex items-center gap-1"><Heart className="size-3.5" />{s.followerCount}</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
