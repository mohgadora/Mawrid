export type Voucher = {
  code: string
  type: 'percent' | 'fixed'
  value: number        // percent (0-100) or fixed USD
  minOrderUsd: number  // minimum order to apply
  descriptionAr: string
  descriptionEn: string
}

/** Demo voucher codes */
export const VOUCHERS: Voucher[] = [
  {
    code: 'WELCOME10',
    type: 'percent',
    value: 10,
    minOrderUsd: 0,
    descriptionAr: 'خصم 10% على أول طلب',
    descriptionEn: '10% off your first order',
  },
  {
    code: 'SAVE20',
    type: 'percent',
    value: 20,
    minOrderUsd: 500,
    descriptionAr: 'خصم 20% على الطلبات فوق 500$',
    descriptionEn: '20% off orders over $500',
  },
  {
    code: 'BULK50',
    type: 'fixed',
    value: 50,
    minOrderUsd: 1000,
    descriptionAr: 'خصم ثابت 50$ على الطلبات الكبيرة',
    descriptionEn: '$50 off bulk orders over $1000',
  },
  {
    code: 'NEWUSER',
    type: 'percent',
    value: 15,
    minOrderUsd: 0,
    descriptionAr: 'خصم 15% لمستخدم جديد',
    descriptionEn: '15% off for new users',
  },
]

export type VoucherResult =
  | { valid: true; voucher: Voucher; discountUsd: number }
  | { valid: false; error: 'invalid_code' | 'min_order' }

export function applyVoucher(code: string, subtotalUsd: number): VoucherResult {
  const voucher = VOUCHERS.find(
    (v) => v.code.toUpperCase() === code.toUpperCase().trim(),
  )
  if (!voucher) return { valid: false, error: 'invalid_code' }
  if (subtotalUsd < voucher.minOrderUsd) return { valid: false, error: 'min_order' }

  const discountUsd =
    voucher.type === 'percent'
      ? (subtotalUsd * voucher.value) / 100
      : Math.min(voucher.value, subtotalUsd)

  return { valid: true, voucher, discountUsd }
}
