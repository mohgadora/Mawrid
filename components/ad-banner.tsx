'use client'

import { useEffect, useRef } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import { fetchAdsByPlacement, trackAdApi, type AdBanner } from '@/lib/api-client'

/**
 * إعلان(ات) بموضع معيّن. يسجّل ظهوراً واحداً لكل إعلان عند التحميل، ونقرة عند
 * الضغط. آمن للفشل — لا يعطّل الصفحة إن لم تتوفّر إعلانات.
 */
export function AdBanner({ placement, className = '' }: { placement: string; className?: string }) {
  const { lang } = useI18n()
  const { data } = useSWR<AdBanner[]>(`ads:${placement}`, () => fetchAdsByPlacement(placement))
  const trackedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!data?.length) return
    for (const ad of data) {
      if (!trackedRef.current.has(ad.id)) {
        trackedRef.current.add(ad.id)
        trackAdApi(ad.id, 'impression').catch(() => {})
      }
    }
  }, [data])

  if (!data?.length) return null

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {data.map((ad) => {
        const title = (lang === 'ar' ? ad.titleAr : ad.titleEn) || ad.titleAr
        const inner = (
          <img
            src={ad.imageUrl}
            alt={title}
            className="h-auto w-full rounded-2xl object-cover"
            loading="lazy"
          />
        )
        if (ad.targetUrl) {
          return (
            <Link
              key={ad.id}
              href={ad.targetUrl}
              onClick={() => trackAdApi(ad.id, 'click').catch(() => {})}
              className="block overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={title}
            >
              {inner}
            </Link>
          )
        }
        return <div key={ad.id} className="overflow-hidden rounded-2xl">{inner}</div>
      })}
    </div>
  )
}
