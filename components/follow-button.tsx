'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Heart, Check } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/toast'
import { authClient } from '@/lib/auth-client'
import { fetchFollowStatus, followShopApi, unfollowShopApi } from '@/lib/api-client'
import { cn } from '@/lib/utils'

export function FollowButton({ supplierId, className }: { supplierId: string; className?: string }) {
  const { lang } = useI18n()
  const toast = useToast()
  const { data: session } = authClient.useSession()
  const { data, mutate } = useSWR(session?.user ? `follow:${supplierId}` : null, () => fetchFollowStatus(supplierId))
  const [busy, setBusy] = useState(false)
  const following = data?.following ?? false

  async function toggle() {
    if (busy) return
    if (!session?.user) {
      toast.error(lang === 'ar' ? 'سجّل الدخول للمتابعة' : 'Sign in to follow')
      return
    }
    setBusy(true)
    // optimistic
    mutate({ following: !following }, false)
    try {
      if (following) await unfollowShopApi(supplierId)
      else await followShopApi(supplierId)
      mutate()
    } catch (err) {
      mutate({ following }, false)
      toast.error(err instanceof Error ? err.message : lang === 'ar' ? 'تعذّر التنفيذ' : 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={cn(
        'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60',
        following
          ? 'border border-border bg-card text-foreground hover:bg-accent'
          : 'bg-primary text-primary-foreground hover:bg-primary/90',
        className,
      )}
    >
      {following ? <Check className="size-4" /> : <Heart className="size-4" />}
      {following ? (lang === 'ar' ? 'متابَع' : 'Following') : lang === 'ar' ? 'متابعة' : 'Follow'}
    </button>
  )
}
