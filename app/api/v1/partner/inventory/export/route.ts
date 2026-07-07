import { NextRequest, NextResponse } from 'next/server'
import { requirePartner, apiError } from '@/lib/api-helpers'
import { getPartnerInventory } from '@/services/partner'

/** Escape a value for RFC 4180 CSV: wrap in quotes, double internal quotes. */
function csvCell(value: string | number | null | undefined): string {
  const s = String(value ?? '')
  // Prefix formula-injection triggers to prevent Excel macro execution
  const safe = /^[=+\-@\t\r]/.test(s) ? `\t${s}` : s
  return `"${safe.replace(/"/g, '""')}"`
}

export async function GET(req: NextRequest) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    const items = await getPartnerInventory(guard)
    const rows = [['SKU', 'اسم المنتج', 'المخزون', 'الحالة'].map(csvCell).join(',')]
    for (const item of items) {
      rows.push([item.sku, item.name, item.stock, item.active ? 'نشط' : 'غير نشط'].map(csvCell).join(','))
    }
    return new NextResponse(rows.join('\r\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=inventory.csv',
      },
    })
  } catch (err) { return apiError(err) }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
