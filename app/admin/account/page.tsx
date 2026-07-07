'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { useToast } from '@/lib/toast'
import { AdminPageSkeleton } from '@/components/skeletons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Profile = { id: string; name: string; email: string; role: string; createdAt: string }

export default function AdminAccountPage() {
  const { success, error: toastError } = useToast()
  const { data, isLoading } = useSWR<{ data: Profile }>('/api/v1/account/profile', (url: string) =>
    fetch(url).then((r) => r.json())
  )

  const profile = data?.data
  const [name, setName] = useState('')

  useEffect(() => {
    if (profile?.name) setName(profile.name)
  }, [profile])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/v1/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error()
      success('تم حفظ التعديلات')
    } catch {
      toastError('فشل الحفظ')
    }
  }

  if (isLoading) return <AdminPageSkeleton cards={0} rows={4} />

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-lg font-bold text-foreground">الحساب الشخصي</h1>
        <p className="text-sm text-muted-foreground">إدارة بيانات حسابك الإداري</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">الاسم</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم الكامل" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">البريد الإلكتروني</label>
          <Input value={profile?.email ?? ''} readOnly className="bg-muted/50 text-muted-foreground" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">الدور</label>
          <Input value={profile?.role ?? ''} readOnly className="bg-muted/50 text-muted-foreground" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">تاريخ الانضمام</label>
          <Input
            value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('ar-SA') : ''}
            readOnly
            className="bg-muted/50 text-muted-foreground"
          />
        </div>
        <Button type="submit">حفظ التعديلات</Button>
      </form>
    </div>
  )
}
