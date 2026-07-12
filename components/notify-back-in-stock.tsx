'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Bell, Check, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/toast'
import { authClient } from '@/lib/auth-client'
import { fetchRestockStatus, requestRestockApi } from '@/lib/api-client'

export function NotifyBackInStock({ productId }: { productId: string }) {
  const { lang } = useI18n()
  const toast = useToast()
  const { data: session } = authClient.useSession()
  const { data, mutate } = useSWR(
    session?.user ? `restock:${productId}` : null,
    () => fetchRestockStatus(productId),
  )
  const [loading, setLoading] = useState(false)
  const requested = data?.requested ?? false

  async function submit() {
    if (!session?.user) {
      toast.error(lang === 'ar' ? 'سجّل الدخول لتفعيل التنبيه' : 'Sign in to get alerts')
      return
    }
    setLoading(true)
    try {
      await requestRestockApi(productId)
      await mutate()
      toast.success(lang === 'ar' ? 'سنُخطرك فور توفّر المنتج' : "We'll notify you when it's back")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : lang === 'ar' ? 'تعذّر التنفيذ' : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  if (requested) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
        <Check className="size-4 shrink-0" />
        {lang === 'ar' ? 'ستصلك رسالة فور توفّر المنتج.' : "You'll be notified when it's back in stock."}
      </div>
    )
  }

  return (
    <button
      onClick={submit}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/50 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
      {lang === 'ar' ? 'أخبرني عند التوفّر' : 'Notify me when available'}
    </button>
  )
}
