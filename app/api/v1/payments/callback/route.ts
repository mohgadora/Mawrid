import { NextRequest, NextResponse } from 'next/server'
import { verifyAndSettle } from '@/services/payment'
import { siteUrl } from '@/lib/config'

/**
 * GET /api/v1/payments/callback?orderId=...&invoice_id=...
 * وجهة العودة من Moyasar — يتحقّق ويسوّي ثم يعيد المتصفّح لصفحة الطلب.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const orderId = sp.get('orderId') ?? ''
  const invoiceId = sp.get('invoice_id') || sp.get('id') || undefined

  const base = siteUrl()
  if (!orderId) return NextResponse.redirect(`${base}/orders`)

  let status: 'paid' | 'failed' | 'pending' = 'pending'
  try {
    status = await verifyAndSettle(orderId, invoiceId)
  } catch (err) {
    console.error('[payment] callback settle failed:', err)
  }

  return NextResponse.redirect(`${base}/orders/${orderId}?payment=${status}`)
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
