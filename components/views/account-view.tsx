'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import useSWR from 'swr'
import {
  UserRound,
  MapPin,
  Building2,
  Heart,
  ClipboardList,
  Package,
  ShoppingCart,
  Crown,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  Check,
  BadgeCheck,
  Globe,
  Home,
  Sparkles,
  UserPlus,
  Star,
  Ticket,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PageShell } from '@/components/page-shell'
import { AsyncContent } from '@/components/async-content'
import { EmptyState } from '@/components/empty-state'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ThemeToggle } from '@/components/theme-toggle'
import { ListSkeleton } from '@/components/skeletons'
import { InviteSection } from '@/components/invite-section'
import { LoyaltySection } from '@/components/loyalty-section'
import { VouchersSection } from '@/components/vouchers-section'
import { useI18n, COUNTRIES, type Lang } from '@/lib/i18n'
import { authClient } from '@/lib/auth-client'
import { DEMO_FEATURES_ENABLED } from '@/lib/feature-flags'
import { useProducts } from '@/lib/use-products'
import { toCartSnapshot } from '@/lib/cart'
import { useCart } from '@/lib/cart'
import { useToast } from '@/lib/toast'
import { useSubscription } from '@/lib/subscription'
import type { Branch } from '@/lib/account-types'
import type { AccountProduct } from '@/services/account'
import type { Role } from '@/lib/config'
import {
  fetchProfile,
  updateProfileApi,
  fetchAddresses,
  addAddressApi,
  updateAddressApi,
  removeAddressApi,
  fetchFavorites,
  toggleFavoriteApi,
  fetchTemplates,
  submitMerchantKycApi,
  fetchMerchantKycStatus,
  type Address,
  type Profile,
} from '@/lib/api-client'

type TabKey = 'profile' | 'addresses' | 'branches' | 'favorites' | 'templates' | 'invite' | 'points' | 'vouchers'

const ROLE_KEY: Record<Role, 'roleGuest' | 'roleConsumer' | 'roleMerchant'> = {
  guest: 'roleGuest',
  consumer: 'roleConsumer',
  merchant: 'roleMerchant',
}

export function AccountView() {
  const { t, lang } = useI18n()
  const [tab, setTab] = useState<TabKey>('profile')

  const profile = useSWR<Awaited<ReturnType<typeof fetchProfile>>>('profile', fetchProfile)
  const addresses = useSWR<Awaited<ReturnType<typeof fetchAddresses>>>('addresses', fetchAddresses)
  const favorites = useSWR<Awaited<ReturnType<typeof fetchFavorites>>>('favorites', fetchFavorites)
  const branches = useSWR<Branch[]>('branches', () => Promise.resolve([]))

  const displayName = profile.data?.name ?? ''
  const initial = displayName.trim().charAt(0) || '?'

  const TABS: { key: TabKey; label: string; icon: typeof UserRound }[] = [
    { key: 'profile', label: t('profile'), icon: UserRound },
    { key: 'addresses', label: t('addresses'), icon: MapPin },
    { key: 'branches', label: t('branches'), icon: Building2 },
    { key: 'favorites', label: t('favorites'), icon: Heart },
    { key: 'templates', label: t('reorderTemplates'), icon: ClipboardList },
    ...(DEMO_FEATURES_ENABLED
      ? ([
          { key: 'invite', label: lang === 'ar' ? 'دعوة زملاء' : 'Invite', icon: UserPlus },
          { key: 'points', label: lang === 'ar' ? 'نقاطي' : 'My Points', icon: Star },
          { key: 'vouchers', label: lang === 'ar' ? 'قسائمي' : 'Vouchers', icon: Ticket },
        ] as const)
      : []),
  ]

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-6 pb-24 lg:pb-6">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center gap-2">
            <UserRound className="size-6 text-primary" />
            <h1 className="text-2xl font-bold text-balance">{t('myAccount')}</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t('manageAccount')}</p>
        </header>

        {/* Profile summary card */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary text-2xl font-black text-primary-foreground">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              {profile.data ? (
                <>
                  <h2 className="truncate text-lg font-bold text-foreground">{displayName}</h2>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {profile.data.phone}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                      {profile.data.role === 'merchant' && <BadgeCheck className="size-3.5 text-primary" />}
                      {t(ROLE_KEY[(profile.data.role as Role) ?? 'consumer'] ?? 'roleConsumer')}
                    </span>
                    <PremiumBadge />
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <span className="h-5 w-40 animate-pulse rounded bg-muted" />
                  <span className="h-4 w-28 animate-pulse rounded bg-muted" />
                </div>
              )}
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-4 divide-x divide-border border-t border-border text-center rtl:divide-x-reverse">
            <Stat value={addresses.data?.length} label={t('savedAddressesCount')} />
            <Stat value={branches.data?.length} label={t('branchesCount')} />
            <Stat value={favorites.data?.length} label={t('favoritesCount')} />
            {DEMO_FEATURES_ENABLED && (
              <Stat value={undefined} label={lang === 'ar' ? 'نقطة' : 'pts'} />
            )}
          </div>
        </section>

        {/* Quick links */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickLink href="/orders" icon={Package} label={t('myOrders')} />
          <QuickLink href="/cart" icon={ShoppingCart} label={t('cart')} />
          <QuickLink href="/search" icon={Sparkles} label={t('recommended')} />
          <QuickLink href="/" icon={Home} label={t('backToHome')} />
        </div>

        {/* Premium card */}
        <PremiumCard />

        {/* Preferences */}
        <PreferencesCard />

        {/* Tabs */}
        <div className="mt-6">
          <div
            role="tablist"
            aria-label={t('myAccount')}
            className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2"
          >
            {TABS.map(({ key, label, icon: Icon }) => {
              const active = tab === key
              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(key)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              )
            })}
          </div>

          <div className="mt-4">
            {tab === 'profile' && (
              <>
                <ProfileSection swr={profile} />
                {profile.data?.role === 'merchant' && <MerchantKycSection />}
              </>
            )}
            {tab === 'addresses' && <AddressesSection swr={addresses} />}
            {tab === 'branches' && <BranchesSection swr={branches} />}
            {tab === 'favorites' && <FavoritesSection swr={favorites} />}
            {tab === 'templates' && <TemplatesSection />}
            {tab === 'invite' && <InviteSection />}
            {tab === 'points' && <LoyaltySection />}
            {tab === 'vouchers' && <VouchersSection />}
          </div>
        </div>

        {/* Logout */}
        <LogoutButton />
      </div>
    </PageShell>
  )
}

function Stat({ value, label }: { value: number | undefined; label: string }) {
  return (
    <div className="px-2 py-3">
      <div className="text-xl font-black tabular-nums text-foreground">
        {value === undefined ? '—' : value}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

function PremiumBadge() {
  const { t } = useI18n()
  const { premiumUnlocked } = useSubscription()
  if (!premiumUnlocked) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-chart-3/15 px-2.5 py-1 text-xs font-semibold text-chart-3">
      <Crown className="size-3.5" />
      {t('premiumMember')}
    </span>
  )
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: typeof Package
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="size-5" />
      </span>
      <span className="text-xs font-medium text-foreground">{label}</span>
    </Link>
  )
}

function PremiumCard() {
  const { t } = useI18n()
  const { premiumUnlocked, loading, subscribe, cancel } = useSubscription()
  const { success, info } = useToast()
  const [confirmCancel, setConfirmCancel] = useState(false)

  if (loading) return null

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-chart-3/30 bg-chart-3/5">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-chart-3/15 text-chart-3">
          <Crown className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-2 font-bold text-foreground">
            {t('premiumTitle')}
            {premiumUnlocked && <Check className="size-4 text-success" />}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground text-pretty">
            {premiumUnlocked ? t('premiumActive') : t('premiumDesc')}
          </p>
        </div>
        {premiumUnlocked ? (
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            className="shrink-0 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t('cancelSubscription')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              subscribe()
              success(t('toastPremiumUnlocked'))
            }}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-chart-3 px-5 py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Crown className="size-4" />
            {t('unlockPremium')}
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title={t('cancelSubscriptionConfirm')}
        description={t('cancelSubscriptionConfirmDesc')}
        confirmLabel={t('cancelSubscription')}
        cancelLabel={t('back')}
        onConfirm={() => {
          cancel()
          info(t('toastPremiumCancelled'))
        }}
      />
    </section>
  )
}

function PreferencesCard() {
  const { t, lang, setLang, country, setCountry } = useI18n()

  return (
    <section className="mt-4 rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-3 text-sm font-bold text-muted-foreground">{t('preferences')}</h3>
      <div className="flex flex-wrap items-center gap-3">
        {/* Language */}
        <div className="inline-flex rounded-lg border border-border p-1">
          {(['ar', 'en'] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                lang === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {l === 'ar' ? 'العربية' : 'English'}
            </button>
          ))}
        </div>

        {/* Country / currency */}
        <label className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm">
          <Globe className="size-4 text-muted-foreground" />
          <span className="sr-only">{t('country')}</span>
          <select
            value={country.code}
            onChange={(e) => setCountry(e.target.value)}
            className="bg-transparent text-sm font-medium text-foreground outline-none"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {lang === 'ar' ? c.nameAr : c.nameEn} · {c.currency}
              </option>
            ))}
          </select>
        </label>

        {/* Theme */}
        <div className="inline-flex items-center gap-2 rounded-lg border border-border px-2 py-1">
          <ThemeToggle />
        </div>
      </div>
    </section>
  )
}

/* --- Profile --- */
function ProfileSection({ swr }: { swr: ReturnType<typeof useSWR<Profile>> }) {
  const { t } = useI18n()
  const { success, error: toastError } = useToast()
  const { data, error, isLoading, mutate } = swr
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })

  function startEdit() {
    if (!data) return
    setForm({
      name: data.name,
      email: data.email,
      phone: data.phone,
    })
    setEditing(true)
  }

  async function save() {
    if (!form.name.trim()) {
      toastError(t('toastRequiredFields'))
      return
    }
    setSaving(true)
    try {
      const next = await updateProfileApi({ name: form.name, phone: form.phone })
      await mutate(next, { revalidate: false })
      setEditing(false)
      success(t('toastProfileSaved'))
    } catch {
      toastError(t('toastSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AsyncContent
      data={data}
      error={error}
      isLoading={isLoading}
      onRetry={() => mutate()}
      loading={<ListSkeleton count={2} />}
    >
      {(profile) => (
        <div className="rounded-2xl border border-border bg-card p-5">
          {editing ? (
            <div className="flex flex-col gap-4">
              <Field label={t('name')}>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </Field>
              <Field label={t('email')}>
                <input
                  type="email"
                  dir="ltr"
                  value={form.email}
                  readOnly
                  disabled
                  title={t('emailReadOnly')}
                  className="w-full cursor-not-allowed rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground outline-none"
                />
                <span className="text-xs text-muted-foreground">{t('emailReadOnly')}</span>
              </Field>
              <Field label={t('phoneNumber')}>
                <input
                  type="tel"
                  dir="ltr"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </Field>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={saving}
                  onClick={save}
                  className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {saving ? t('saving') : t('saveChanges')}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <InfoRow label={t('name')} value={profile.name} />
              <InfoRow label={t('email')} value={profile.email} ltr />
              <InfoRow label={t('phoneNumber')} value={profile.phone} ltr />
              <InfoRow label={t('accountType')} value={t(ROLE_KEY[(profile.role as Role) ?? 'consumer'] ?? 'roleConsumer')} />
              <div className="pt-1">
                <button
                  type="button"
                  onClick={startEdit}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Pencil className="size-4" />
                  {t('editProfile')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </AsyncContent>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {children}
    </label>
  )
}

function InfoRow({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground" dir={ltr ? 'ltr' : undefined}>
        {value}
      </span>
    </div>
  )
}

function MerchantKycSection() {
  const { t } = useI18n()
  const { success, error: toastError } = useToast()
  const { data, mutate } = useSWR('merchant-kyc', fetchMerchantKycStatus)
  const [company, setCompany] = useState('')
  const [crNumber, setCrNumber] = useState('')
  const [vatNumber, setVatNumber] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!company.trim()) {
      toastError(t('toastRequiredFields'))
      return
    }
    setSaving(true)
    try {
      await submitMerchantKycApi({ company, crNumber, vatNumber })
      await mutate()
      success(t('toastKycSubmitted'))
    } catch {
      toastError(t('toastSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  if (!data) return null
  if (data.status === 'approved') {
    return (
      <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <p className="text-sm font-bold text-primary">{t('kycApproved')}</p>
      </div>
    )
  }

  if (data.status === 'pending') {
    return (
      <div className="mt-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-5">
        <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400">{t('kycPending')}</p>
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-3 text-sm font-bold">{t('merchantKycTitle')}</h3>
      <p className="mb-4 text-xs text-muted-foreground">{t('merchantKycDesc')}</p>
      <div className="flex flex-col gap-3">
        <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder={t('companyName')} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <input value={crNumber} onChange={(e) => setCrNumber(e.target.value)} placeholder={t('authCrNumber')} dir="ltr" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <input value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} placeholder={t('vat')} dir="ltr" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <button type="button" onClick={submit} disabled={saving} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60">
          {saving ? t('saving') : t('submitKyc')}
        </button>
      </div>
    </div>
  )
}

/* --- Addresses --- */
function AddressesSection({
  swr,
}: {
  swr: ReturnType<typeof useSWR<Address[]>>
}) {
  const { t, country } = useI18n()
  const { success, info, error: toastError } = useToast()
  const { data, error, isLoading, mutate } = swr
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ label: '', line: '', city: '', phone: '' })

  function resetForm() {
    setForm({ label: '', line: '', city: '', phone: '' })
    setAdding(false)
    setEditingId(null)
  }

  function startEdit(addr: Address) {
    setEditingId(addr.id)
    setAdding(false)
    setForm({
      label: addr.label,
      line: addr.line1,
      city: addr.city,
      phone: addr.phone ?? "",
    })
  }

  async function submit() {
    if (!form.label.trim() || !form.line.trim() || !form.city.trim()) {
      toastError(t('toastRequiredFields'))
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        await updateAddressApi(editingId, {
          label: form.label,
          line1: form.line,
          city: form.city,
          phone: form.phone,
          country: country.code,
        })
        success(t('toastAddressUpdated'))
      } else {
        await addAddressApi({
          label: form.label,
          line1: form.line,
          city: form.city,
          country: country.code,
          isDefault: false,
          fullName: '',
          phone: form.phone,
        })
        success(t('toastAddressAdded'))
      }
      await mutate()
      resetForm()
    } catch {
      toastError(t('toastSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!toDelete) return
    try {
      await removeAddressApi(toDelete)
      await mutate()
      info(t('toastAddressRemoved'))
    } catch {
      toastError(t('toastSaveFailed'))
    }
  }

  return (
    <>
      <AsyncContent
        data={data}
        error={error}
        isLoading={isLoading}
        onRetry={() => mutate()}
        loading={<ListSkeleton count={2} />}
      >
        {(list) => (
          <div className="flex flex-col gap-3">
            {list.map((addr) => (
              <div
                key={addr.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
              >
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <MapPin className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {addr.label}
                    </span>
                    {addr.isDefault && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                        {t('defaultLabel')}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground text-pretty">{addr.line1}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {addr.city}
                    {' · '}
                    <span dir="ltr">{addr.phone}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(addr)}
                  aria-label={t('editAddress')}
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setToDelete(addr.id)}
                  aria-label={t('deleteAddress')}
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}

            {(adding || editingId) ? (
              <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
                <input
                  placeholder={t('addressLabel')}
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <input
                  placeholder={t('addressLine')}
                  value={form.line}
                  onChange={(e) => setForm((f) => ({ ...f, line: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder={`${t('city')} *`}
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  />
                  <input
                    placeholder={t('phoneNumber')}
                    dir="ltr"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={submit}
                    disabled={saving}
                    className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {saving ? t('saving') : editingId ? t('saveChanges') : t('addAddress')}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setAdding(true); setEditingId(null); setForm({ label: '', line: '', city: '', phone: '' }) }}
                className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-4 py-3.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Plus className="size-4" />
                {t('addNewAddress')}
              </button>
            )}
          </div>
        )}
      </AsyncContent>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={t('deleteAddressConfirm')}
        description={t('deleteAddressConfirmDesc')}
        confirmLabel={t('deleteAddress')}
        cancelLabel={t('cancel')}
        onConfirm={confirmDelete}
      />
    </>
  )
}

/* --- Branches --- */
function BranchesSection({
  swr,
}: {
  swr: ReturnType<typeof useSWR<Branch[]>>
}) {
  const { t, lang } = useI18n()
  const { data, error, isLoading, mutate } = swr

  return (
    <AsyncContent
      data={data}
      error={error}
      isLoading={isLoading}
      onRetry={() => mutate()}
      loading={<ListSkeleton count={2} />}
      isEmpty={(d) => d.length === 0}
      empty={<EmptyState icon={Building2} title={t('branches')} description={t('manageAccount')} />}
    >
      {(list) => (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((br) => (
            <div key={br.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                <Building2 className="size-4" />
              </span>
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-foreground">
                    {br.name}
                  </span>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {br.city}
                  </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {t('manager')}: {br.manager}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </AsyncContent>
  )
}

/* --- Favorites --- */
function FavoritesSection({ swr }: { swr: ReturnType<typeof useSWR<AccountProduct[]>> }) {
  const { t, lang, formatPrice } = useI18n()
  const { info } = useToast()
  const { data, error, isLoading, mutate } = swr

  async function remove(id: string) {
    await toggleFavoriteApi(id)
    await mutate()
    info(t('toastFavoriteRemoved'))
  }

  return (
    <AsyncContent
      data={data}
      error={error}
      isLoading={isLoading}
      onRetry={() => mutate()}
      loading={<ListSkeleton count={3} />}
      isEmpty={(d) => d.length === 0}
      empty={
        <EmptyState
          icon={Heart}
          title={t('noFavorites')}
          description={t('noFavoritesDesc')}
          actionLabel={t('startShopping')}
          actionHref="/"
        />
      }
    >
      {(products) => (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <Link
                  href={`/product/${product.id}`}
                  className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted"
                >
                  <Image
                    src={product.image || '/placeholder.svg'}
                    alt={lang === 'ar' ? product.nameAr : product.nameEn}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </Link>
                <Link href={`/product/${product.id}`} className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-sm font-medium text-foreground">
                    {lang === 'ar' ? product.nameAr : product.nameEn}
                  </h3>
                  <span className="mt-1 block font-black text-primary">
                    {formatPrice(product.basePrice)}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => remove(product.id)}
                  aria-label={t('remove')}
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Heart className="size-5 fill-current" />
                </button>
              </div>
            ))}
        </div>
      )}
    </AsyncContent>
  )
}

/* --- Reorder templates --- */
function TemplatesSection() {
  const { t, lang } = useI18n()
  const { addItem } = useCart()
  const { products: catalogProducts } = useProducts()
  const { success } = useToast()
  const { data, error, isLoading, mutate } = useSWR<Awaited<ReturnType<typeof fetchTemplates>>>('templates', fetchTemplates)

  function addAll(items: { productId: string; qty: number }[]) {
    let added = 0
    for (const it of items) {
      const product = catalogProducts.find((p) => p.id === it.productId)
      if (product) {
        addItem(toCartSnapshot(product), it.qty)
        added++
      }
    }
    if (added > 0) success(t('toastTemplateAdded'))
  }

  return (
    <AsyncContent
      data={data}
      error={error}
      isLoading={isLoading}
      onRetry={() => mutate()}
      loading={<ListSkeleton count={2} />}
      isEmpty={(d) => d.length === 0}
      empty={<EmptyState icon={ClipboardList} title={t('reorderTemplates')} description={t('manageAccount')} />}
    >
      {(templates) => (
        <div className="flex flex-col gap-3">
          {templates.map((tpl) => {
            const templateProducts = tpl.items
              .map((it) => catalogProducts.find((p) => p.id === it.productId))
              .filter((p): p is NonNullable<typeof p> => Boolean(p))
            const totalCartons = tpl.items.reduce((s, it) => s + it.qty, 0)
            return (
              <div key={tpl.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">
                      {tpl.name}
                    </h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {tpl.items.length} {t('templateItems')}
                      {' · '}
                      {totalCartons} {t('cartons')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addAll(tpl.items)}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <ShoppingCart className="size-4" />
                    {t('addAllToCart')}
                  </button>
                </div>
                <div className="mt-3 flex -space-x-2 rtl:space-x-reverse">
                  {templateProducts.map((p) => (
                    <span
                      key={p.id}
                      className="relative size-11 overflow-hidden rounded-lg border-2 border-card bg-muted"
                    >
                      <Image
                        src={p.image || '/placeholder.svg'}
                        alt={lang === 'ar' ? p.nameAr : p.nameEn}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AsyncContent>
  )
}

/* --- Logout --- */
function LogoutButton() {
  const { t } = useI18n()
  const { info } = useToast()
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-card px-4 py-3 text-sm font-bold text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <LogOut className="size-4 rtl:rotate-180" />
        {t('logout')}
      </button>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={t('logoutConfirm')}
        description={t('logoutConfirmDesc')}
        confirmLabel={t('logout')}
        cancelLabel={t('cancel')}
        onConfirm={async () => {
          await authClient.signOut()
          info(t('toastLoggedOut'))
          router.push('/')
          router.refresh()
        }}
      />
    </>
  )
}
