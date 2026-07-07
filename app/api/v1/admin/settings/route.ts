import { NextRequest, NextResponse } from 'next/server'
import { ok, serverError, requireAdmin, badRequest } from '@/lib/api-helpers'
import { getSystemSettings, upsertSettings } from '@/lib/settings'
import { writeAuditLog } from '@/lib/audit'
import type { SystemSettings } from '@/lib/settings'

function isSafeUrl(s: string): boolean {
  if (s.startsWith('/')) return true
  try { return new URL(s).protocol === 'https:' } catch { return false }
}

function validateSettings(body: unknown): { data: Partial<SystemSettings>; error?: string } {
  if (!body || typeof body !== 'object') return { data: {}, error: 'Invalid body' }
  const b = body as Record<string, unknown>
  const data: Partial<SystemSettings> = {}

  if ('storeName' in b) {
    if (typeof b.storeName !== 'string' || !b.storeName.trim()) return { data, error: 'storeName must be a non-empty string' }
    data.storeName = b.storeName.trim().slice(0, 100)
  }
  if ('storeLogo' in b) {
    const v = typeof b.storeLogo === 'string' ? b.storeLogo.trim() : ''
    if (v && !isSafeUrl(v)) return { data, error: 'storeLogo must be a valid https URL or a relative path' }
    data.storeLogo = v.slice(0, 500)
  }
  if ('favicon' in b) {
    const v = typeof b.favicon === 'string' ? b.favicon.trim() : ''
    if (v && !isSafeUrl(v)) return { data, error: 'favicon must be a valid https URL or a relative path' }
    data.favicon = v.slice(0, 500)
  }

  const validCurrencies = ['SAR', 'AED', 'KWD', 'USD', 'EGP']
  if ('defaultCurrency' in b) {
    if (!validCurrencies.includes(b.defaultCurrency as string)) return { data, error: 'Invalid currency' }
    data.defaultCurrency = b.defaultCurrency as string
  }
  if ('defaultLanguage' in b) {
    if (!['ar', 'en'].includes(b.defaultLanguage as string)) return { data, error: 'Invalid language' }
    data.defaultLanguage = b.defaultLanguage as string
  }

  const boolFields: (keyof SystemSettings)[] = [
    'taxEnabled', 'codEnabled', 'bankTransferEnabled', 'onlinePaymentEnabled',
    'guestCheckoutEnabled', 'sellerRegistrationEnabled', 'productApprovalRequired',
    'refundEnabled', 'maintenanceMode',
  ]
  for (const field of boolFields) {
    if (field in b) {
      if (typeof b[field] !== 'boolean') return { data, error: `${field} must be boolean` }
      ;(data as Record<string, unknown>)[field] = b[field]
    }
  }

  if ('taxPercentage' in b) {
    const v = Number(b.taxPercentage)
    if (isNaN(v) || v < 0 || v > 100) return { data, error: 'taxPercentage must be 0–100' }
    data.taxPercentage = v
  }
  if ('refundAllowedDays' in b) {
    const v = Number(b.refundAllowedDays)
    if (!Number.isInteger(v) || v < 1 || v > 365) return { data, error: 'refundAllowedDays must be 1–365' }
    data.refundAllowedDays = v
  }
  if ('minStockWarning' in b) {
    const v = Number(b.minStockWarning)
    if (!Number.isInteger(v) || v < 0) return { data, error: 'minStockWarning must be >= 0' }
    data.minStockWarning = v
  }
  if ('defaultCommissionRate' in b) {
    const v = Number(b.defaultCommissionRate)
    if (isNaN(v) || v < 0 || v > 100) return { data, error: 'defaultCommissionRate must be 0–100' }
    data.defaultCommissionRate = v
  }

  if ('businessMode' in b) {
    if (!['single_vendor', 'multi_vendor'].includes(b.businessMode as string)) return { data, error: 'Invalid businessMode' }
    data.businessMode = b.businessMode as SystemSettings['businessMode']
  }
  if ('shippingResponsibility' in b) {
    if (!['in_house', 'seller_wise', 'mixed'].includes(b.shippingResponsibility as string)) return { data, error: 'Invalid shippingResponsibility' }
    data.shippingResponsibility = b.shippingResponsibility as SystemSettings['shippingResponsibility']
  }

  if ('referralBonusReferrer' in b) {
    const v = Number(b.referralBonusReferrer)
    if (isNaN(v) || v < 0 || v > 10000) return { data, error: 'referralBonusReferrer must be 0–10000' }
    data.referralBonusReferrer = v
  }
  if ('referralBonusReferee' in b) {
    const v = Number(b.referralBonusReferee)
    if (isNaN(v) || v < 0 || v > 10000) return { data, error: 'referralBonusReferee must be 0–10000' }
    data.referralBonusReferee = v
  }

  return { data }
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  try {
    const settings = await getSystemSettings()
    return ok(settings)
  } catch (err) {
    return serverError(err)
  }
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard

  try {
    const body = await req.json()
    const { data, error } = validateSettings(body)
    if (error) return badRequest(error)
    if (!Object.keys(data).length) return badRequest('No valid fields provided')

    await upsertSettings(data, guard.id)
    await writeAuditLog({
      userId: guard.id,
      action: 'update_settings',
      entity: 'system_setting',
      meta: data as Record<string, unknown>,
    })

    const settings = await getSystemSettings()
    return ok(settings)
  } catch (err) {
    return serverError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
