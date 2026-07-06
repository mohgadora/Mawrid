import { NextRequest, NextResponse } from 'next/server'
import { ok, serverError, requirePartner, badRequest } from '@/lib/api-helpers'
import { requestWithdrawal, getPartnerWithdrawals } from '@/services/partner'

export async function GET(req: NextRequest) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard
  try { return ok(await getPartnerWithdrawals()) }
  catch (err) { return serverError(err) }
}

export async function POST(req: NextRequest) {
  const guard = await requirePartner(req)
  if (guard instanceof NextResponse) return guard

  try {
    const body = await req.json() as { amount?: unknown; bankName?: unknown; iban?: unknown; note?: unknown }

    const amount = Number(body.amount)
    if (!amount || amount <= 0) return badRequest('المبلغ يجب أن يكون أكبر من صفر')

    const bankName = String(body.bankName ?? '').trim()
    if (!bankName) return badRequest('اسم البنك مطلوب')

    const iban = String(body.iban ?? '').trim().replace(/\s/g, '')
    if (!iban || iban.length < 15) return badRequest('رقم IBAN غير صالح')

    const row = await requestWithdrawal(
      { amount, bankName, iban, note: body.note ? String(body.note).slice(0, 500) : undefined },
      guard,
    )

    return ok(row)
  } catch (err) {
    return serverError(err)
  }
}
