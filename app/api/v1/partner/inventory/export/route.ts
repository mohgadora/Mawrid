import { NextRequest, NextResponse } from 'next/server'
import { requirePartner, serverError } from '@/lib/api-helpers'
import { getPartnerInventory } from '@/services/partner'

export async function GET(req: NextRequest) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try {
    const items = await getPartnerInventory()
    const rows = ['SKU,اسم المنتج,المخزون,الحالة']
    for (const item of items) {
      rows.push(`"${item.sku}","${item.name}",${item.stock},${item.active ? 'نشط' : 'غير نشط'}`)
    }
    return new NextResponse(rows.join('\n'), {
      headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename=inventory.csv' },
    })
  } catch (err) { return serverError(err) }
}
