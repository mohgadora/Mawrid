/**
 * lib/settings.ts — System settings store (DB-backed, server-only).
 *
 * One row per key in `system_setting`. All writes go through this module
 * so we get type safety and a single cache-invalidation point.
 */
import 'server-only'
import { db } from '@/lib/db'
import { systemSetting } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'

// ─── Typed defaults ────────────────────────────────────────────────────────

export interface SystemSettings {
  storeName: string
  storeLogo: string
  favicon: string
  defaultCurrency: string
  defaultLanguage: string
  taxEnabled: boolean
  taxPercentage: number
  codEnabled: boolean
  bankTransferEnabled: boolean
  onlinePaymentEnabled: boolean
  guestCheckoutEnabled: boolean
  sellerRegistrationEnabled: boolean
  productApprovalRequired: boolean
  refundEnabled: boolean
  refundAllowedDays: number
  minStockWarning: number
  maintenanceMode: boolean
  businessMode: 'single_vendor' | 'multi_vendor'
  shippingResponsibility: 'in_house' | 'seller_wise' | 'mixed'
  defaultCommissionRate: number
}

export const SETTING_DEFAULTS: SystemSettings = {
  storeName: 'Mawrid',
  storeLogo: '',
  favicon: '',
  defaultCurrency: 'SAR',
  defaultLanguage: 'ar',
  taxEnabled: false,
  taxPercentage: 15,
  codEnabled: true,
  bankTransferEnabled: false,
  onlinePaymentEnabled: false,
  guestCheckoutEnabled: false,
  sellerRegistrationEnabled: true,
  productApprovalRequired: false,
  refundEnabled: true,
  refundAllowedDays: 7,
  minStockWarning: 10,
  maintenanceMode: false,
  businessMode: 'multi_vendor',
  shippingResponsibility: 'in_house',
  defaultCommissionRate: 10,
}

type SettingKey = keyof SystemSettings

// ─── Read all settings (merges DB values over defaults) ───────────────────

export async function getSystemSettings(): Promise<SystemSettings> {
  const rows = await db.select().from(systemSetting)
  const map: Record<string, string> = {}
  for (const row of rows) map[row.key] = row.value

  const cast = <T>(key: SettingKey, dflt: T): T => {
    const raw = map[key]
    if (raw === undefined) return dflt
    if (typeof dflt === 'boolean') return (raw === 'true') as unknown as T
    if (typeof dflt === 'number') return Number(raw) as unknown as T
    return raw as unknown as T
  }

  return {
    storeName:                   cast('storeName', SETTING_DEFAULTS.storeName),
    storeLogo:                   cast('storeLogo', SETTING_DEFAULTS.storeLogo),
    favicon:                     cast('favicon', SETTING_DEFAULTS.favicon),
    defaultCurrency:             cast('defaultCurrency', SETTING_DEFAULTS.defaultCurrency),
    defaultLanguage:             cast('defaultLanguage', SETTING_DEFAULTS.defaultLanguage),
    taxEnabled:                  cast('taxEnabled', SETTING_DEFAULTS.taxEnabled),
    taxPercentage:               cast('taxPercentage', SETTING_DEFAULTS.taxPercentage),
    codEnabled:                  cast('codEnabled', SETTING_DEFAULTS.codEnabled),
    bankTransferEnabled:         cast('bankTransferEnabled', SETTING_DEFAULTS.bankTransferEnabled),
    onlinePaymentEnabled:        cast('onlinePaymentEnabled', SETTING_DEFAULTS.onlinePaymentEnabled),
    guestCheckoutEnabled:        cast('guestCheckoutEnabled', SETTING_DEFAULTS.guestCheckoutEnabled),
    sellerRegistrationEnabled:   cast('sellerRegistrationEnabled', SETTING_DEFAULTS.sellerRegistrationEnabled),
    productApprovalRequired:     cast('productApprovalRequired', SETTING_DEFAULTS.productApprovalRequired),
    refundEnabled:               cast('refundEnabled', SETTING_DEFAULTS.refundEnabled),
    refundAllowedDays:           cast('refundAllowedDays', SETTING_DEFAULTS.refundAllowedDays),
    minStockWarning:             cast('minStockWarning', SETTING_DEFAULTS.minStockWarning),
    maintenanceMode:             cast('maintenanceMode', SETTING_DEFAULTS.maintenanceMode),
    businessMode:                cast('businessMode', SETTING_DEFAULTS.businessMode),
    shippingResponsibility:      cast('shippingResponsibility', SETTING_DEFAULTS.shippingResponsibility),
    defaultCommissionRate:       cast('defaultCommissionRate', SETTING_DEFAULTS.defaultCommissionRate),
  }
}

// ─── Read a single setting ────────────────────────────────────────────────

export async function getSetting<K extends SettingKey>(
  key: K,
): Promise<SystemSettings[K]> {
  const row = await db
    .select()
    .from(systemSetting)
    .where(eq(systemSetting.key, key))
    .limit(1)

  if (!row.length) return SETTING_DEFAULTS[key]
  const raw = row[0].value
  const dflt = SETTING_DEFAULTS[key]
  if (typeof dflt === 'boolean') return (raw === 'true') as unknown as SystemSettings[K]
  if (typeof dflt === 'number') return Number(raw) as unknown as SystemSettings[K]
  return raw as unknown as SystemSettings[K]
}

// ─── Write / upsert settings (admin only — auth check done in API layer) ──

export async function upsertSettings(
  patch: Partial<SystemSettings>,
  updatedBy: string,
): Promise<void> {
  const entries = Object.entries(patch) as [SettingKey, SystemSettings[SettingKey]][]
  if (!entries.length) return

  for (const [key, val] of entries) {
    await db
      .insert(systemSetting)
      .values({ key, value: String(val), updatedBy })
      .onConflictDoUpdate({
        target: systemSetting.key,
        set: { value: String(val), updatedBy, updatedAt: new Date() },
      })
  }
}
