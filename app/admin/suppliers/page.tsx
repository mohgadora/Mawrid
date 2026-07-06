'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import {
  Search, Plus, Store, LogIn, CheckCircle, XCircle,
  ExternalLink, Mail, Phone, MapPin, Star, Package,
  ShoppingCart, TrendingUp, KeyRound, Edit2, Globe,
  Link2, ChevronLeft,
  Building2, Shield, Calendar, DollarSign,
} from 'lucide-react'
import { getAdminSuppliers } from '@/lib/api-client'
import { StatusChip } from '@/components/order-status'
import { AsyncContent } from '@/components/async-content'
import { EmptyState } from '@/components/empty-state'
import { AdminPageSkeleton } from '@/components/skeletons'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/toast'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

type SupplierDetail = {
  id: string
  name: string
  nameAr: string | null
  logo: string | null
  bannerUrl: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  country: string
  status: string
  verified: boolean
  commissionRate: number | null
  minOrder: number
  rating: number
  reviewCount: number
  socialLinks: Record<string, string>
  shippingPolicy: string | null
  returnPolicy: string | null
  createdAt: string
  updatedAt: string
  linkedUser: { id: string; email: string; name: string; emailVerified: boolean; createdAt: Date } | null
  stats: { products: number; orders: number; totalRevenue: number }
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon className={cn('size-4', color)} />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  )
}

// ── Supplier Drawer ───────────────────────────────────────────────────────────

function SupplierDrawer({ supplierId, onClose, onMutate }: { supplierId: string; onClose: () => void; onMutate: () => void }) {
  const { success, error: toastError } = useToast()
  const { formatPrice } = useI18n()
  const [resetting, setResetting] = useState(false)
  const [editCommission, setEditCommission] = useState(false)
  const [commission, setCommission] = useState('')

  const { data, error, isLoading, mutate } = useSWR<{ data: SupplierDetail }>(
    supplierId ? `/api/v1/admin/suppliers/${supplierId}` : null,
    (url: string) => fetch(url).then((r) => r.json()),
  )

  const sup = data?.data

  async function resetPassword() {
    if (!sup) return
    setResetting(true)
    try {
      const res = await fetch(`/api/v1/admin/suppliers/${sup.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'فشل')
      success(`تم إرسال رابط إعادة التعيين إلى ${json.data?.email}`)
    } catch (e) {
      toastError((e as Error).message || 'فشل إرسال البريد')
    } finally {
      setResetting(false)
    }
  }

  async function saveCommission() {
    if (!sup) return
    const rate = parseFloat(commission)
    if (isNaN(rate) || rate < 0 || rate > 100) { toastError('نسبة غير صالحة (0-100)'); return }
    try {
      const res = await fetch(`/api/v1/admin/suppliers/${sup.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionRate: rate.toString() }),
      })
      if (!res.ok) throw new Error()
      success('تم حفظ نسبة العمولة')
      setEditCommission(false)
      mutate()
      onMutate()
    } catch {
      toastError('فشل الحفظ')
    }
  }

  const socialIcons: Record<string, React.ElementType> = {
    website: Globe,
  }

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer panel */}
      <div className="relative ms-auto flex h-full w-full max-w-xl flex-col bg-background shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4 bg-card">
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-accent transition-colors">
            <ChevronLeft className="size-5" />
          </button>
          <h2 className="text-base font-bold text-foreground flex-1 truncate">
            {sup ? (sup.nameAr ?? sup.name) : 'تفاصيل المورد'}
          </h2>
          {sup && (
            <StatusChip status={sup.status as Parameters<typeof StatusChip>[0]['status']} size="sm" />
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive text-center py-10">فشل تحميل البيانات</p>
          )}

          {sup && (
            <>
              {/* Banner + Logo */}
              {sup.bannerUrl && (
                <div className="relative h-28 rounded-xl overflow-hidden border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sup.bannerUrl} alt="" className="h-full w-full object-cover" />
                  {sup.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sup.logo} alt="" className="absolute bottom-2 start-3 size-12 rounded-xl border-2 border-background object-contain bg-white" />
                  )}
                </div>
              )}
              {!sup.bannerUrl && sup.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sup.logo} alt="" className="size-16 rounded-xl border border-border object-contain bg-muted" />
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard icon={Package} label="المنتجات" value={sup.stats?.products ?? 0} color="text-primary" />
                <StatCard icon={ShoppingCart} label="الطلبات" value={sup.stats?.orders ?? 0} color="text-blue-500" />
                <StatCard icon={TrendingUp} label="الإيرادات" value={formatPrice(sup.stats?.totalRevenue ?? 0)} color="text-emerald-500" />
              </div>

              {/* Contact Info */}
              <div className="rounded-xl border border-border bg-card divide-y divide-border">
                <p className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">معلومات التواصل</p>

                {sup.phone && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Phone className="size-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground dir-ltr">{sup.phone}</span>
                  </div>
                )}
                {sup.email && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Mail className="size-4 text-muted-foreground shrink-0" />
                    <a href={`mailto:${sup.email}`} className="text-sm text-primary hover:underline">{sup.email}</a>
                  </div>
                )}
                {(sup.city || sup.address) && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <MapPin className="size-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground">{[sup.address, sup.city, sup.country].filter(Boolean).join('، ')}</span>
                  </div>
                )}

                {/* Social links */}
                {Object.entries(sup.socialLinks ?? {}).filter(([, v]) => v).map(([key, val]) => {
                  const Icon = socialIcons[key] ?? Link2
                  return (
                    <div key={key} className="flex items-center gap-3 px-4 py-3">
                      <Icon className="size-4 text-muted-foreground shrink-0" />
                      <a href={val} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                        {val} <ExternalLink className="size-3" />
                      </a>
                    </div>
                  )
                })}

                {!sup.phone && !sup.email && !sup.city && Object.values(sup.socialLinks ?? {}).every((v) => !v) && (
                  <p className="px-4 py-3 text-sm text-muted-foreground">لا توجد معلومات تواصل</p>
                )}
              </div>

              {/* Linked User */}
              <div className="rounded-xl border border-border bg-card divide-y divide-border">
                <p className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">حساب المستخدم</p>
                {sup.linkedUser ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Building2 className="size-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{sup.linkedUser.name}</p>
                        <p className="text-xs text-muted-foreground">{sup.linkedUser.email}</p>
                      </div>
                      {sup.linkedUser.emailVerified && (
                        <Shield className="size-4 text-emerald-500 ms-auto shrink-0" aria-label="بريد موثّق" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Calendar className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        عضو منذ {new Date(sup.linkedUser.createdAt).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="px-4 py-3 text-sm text-muted-foreground">لا يوجد حساب مرتبط</p>
                )}
              </div>

              {/* Commission */}
              <div className="rounded-xl border border-border bg-card divide-y divide-border">
                <p className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">إعدادات العمولة</p>
                <div className="flex items-center gap-3 px-4 py-3">
                  <DollarSign className="size-4 text-muted-foreground shrink-0" />
                  {editCommission ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={commission}
                        onChange={(e) => setCommission(e.target.value)}
                        className="h-8 w-24 text-sm"
                        autoFocus
                        placeholder="0"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                      <Button size="sm" className="h-8 text-xs" onClick={saveCommission}>حفظ</Button>
                      <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditCommission(false)}>إلغاء</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm text-foreground">
                        {sup.commissionRate != null ? `${sup.commissionRate}%` : 'غير محدد'}
                      </span>
                      <button
                        type="button"
                        onClick={() => { setCommission(String(sup.commissionRate ?? '')); setEditCommission(true) }}
                        className="ms-auto rounded p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <Star className="size-4 text-yellow-500 shrink-0" />
                  <span className="text-sm text-foreground">
                    تقييم {(sup.rating ?? 0).toFixed(1)} ★ ({sup.reviewCount ?? 0} تقييم)
                  </span>
                </div>
              </div>

              {/* Policies */}
              {(sup.shippingPolicy || sup.returnPolicy) && (
                <div className="rounded-xl border border-border bg-card divide-y divide-border">
                  <p className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">السياسات</p>
                  {sup.shippingPolicy && (
                    <div className="px-4 py-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">سياسة الشحن</p>
                      <p className="text-sm text-foreground leading-relaxed">{sup.shippingPolicy}</p>
                    </div>
                  )}
                  {sup.returnPolicy && (
                    <div className="px-4 py-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">سياسة الإرجاع</p>
                      <p className="text-sm text-foreground leading-relaxed">{sup.returnPolicy}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Metadata */}
              <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 space-y-1">
                <p className="text-xs text-muted-foreground">
                  تاريخ الانضمام: {new Date(sup.createdAt).toLocaleDateString('ar-SA')}
                </p>
                <p className="text-xs text-muted-foreground">
                  آخر تحديث: {new Date(sup.updatedAt).toLocaleDateString('ar-SA')}
                </p>
                <p className="text-xs font-mono text-muted-foreground/60 break-all">ID: {sup.id}</p>
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        {sup && (
          <div className="border-t border-border bg-card px-5 py-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={resetPassword}
              disabled={resetting || !sup.linkedUser}
              title={!sup.linkedUser ? 'لا يوجد حساب مرتبط' : ''}
            >
              <KeyRound className="size-3.5" />
              {resetting ? 'جارٍ الإرسال…' : 'إعادة تعيين كلمة المرور'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={async () => {
                await fetch('/api/v1/admin/impersonate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ supplierId: sup.id }),
                })
                window.location.href = '/partner'
              }}
            >
              <LogIn className="size-3.5" />
              دخول كمتجر
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminSuppliersPage() {
  const { t } = useI18n()
  const { error: toastError } = useToast()
  const router = useRouter()
  const { data, error, isLoading, mutate } = useSWR<Awaited<ReturnType<typeof getAdminSuppliers>>>('admin/suppliers', getAdminSuppliers)
  const [q, setQ] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  async function changeStatus(id: string, status: 'active' | 'pending' | 'suspended') {
    setUpdating(id)
    try {
      const res = await fetch('/api/v1/admin/suppliers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) throw new Error(await res.text())
      mutate()
    } catch {
      toastError(t('toastSaveFailed'))
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="space-y-5 route-fade">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={t('searchPlaceholder')}
            className="ps-9 h-9 text-sm"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Button size="sm" className="gap-1.5 shrink-0" onClick={() => router.push('/partner/sign-up')}>
          <Plus className="size-4" />
          {t('addNew')}
        </Button>
      </div>

      <AsyncContent
        data={data}
        error={error}
        isLoading={isLoading}
        loading={<AdminPageSkeleton rows={5} cards={0} />}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState icon={Store} title={t('noData')} />}
        onRetry={() => mutate()}
      >
        {(suppliers) => {
          const filtered = suppliers.filter(
            (s) => !q || s.name.includes(q) || s.category.includes(q)
          )
          return (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedId(s.id)}
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.category}</p>
                    </div>
                    <StatusChip status={s.status as Parameters<typeof StatusChip>[0]['status']} size="sm" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                    <div>
                      <p className="text-base font-bold text-foreground">{s.products}</p>
                      <p className="text-[10px] text-muted-foreground">{t('supplierProducts')}</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-foreground">{s.orders.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">{t('supplierOrders')}</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-foreground">{s.rating}</p>
                      <p className="text-[10px] text-muted-foreground">{t('supplierRating')}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
                    <p className="text-[10px] text-muted-foreground">{t('supplierJoined')}: {s.joined}</p>
                    <div className="flex gap-1">
                      {s.status !== 'active' && (
                        <Button size="sm" variant="outline" className="h-6 gap-1 px-2 text-[11px] text-green-600 border-green-300 hover:bg-green-50" disabled={updating === s.id} onClick={() => changeStatus(s.id, 'active')}>
                          <CheckCircle className="size-3" /> تفعيل
                        </Button>
                      )}
                      {s.status === 'active' && (
                        <Button size="sm" variant="outline" className="h-6 gap-1 px-2 text-[11px] text-yellow-600 border-yellow-300 hover:bg-yellow-50" disabled={updating === s.id} onClick={() => changeStatus(s.id, 'suspended')}>
                          <XCircle className="size-3" /> إيقاف
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full py-10 text-center text-sm text-muted-foreground">{t('noData')}</div>
              )}
            </div>
          )
        }}
      </AsyncContent>

      {selectedId && (
        <SupplierDrawer
          supplierId={selectedId}
          onClose={() => setSelectedId(null)}
          onMutate={() => mutate()}
        />
      )}
    </div>
  )
}
