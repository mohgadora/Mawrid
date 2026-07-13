/**
 * lib/phone.ts — pure phone-number + OTP validation (no DB, no I/O).
 * Extracted from services/otp.ts so the normalization rules are unit-tested.
 */
import { ValidationError } from '@/lib/errors'

/** Normalizes a phone number to a simple international form (+ then digits). */
export function normalizePhone(raw: string): string {
  const trimmed = String(raw ?? '').trim().replace(/[\s-]/g, '')
  if (!/^\+?[0-9]{8,15}$/.test(trimmed)) throw new ValidationError('رقم جوال غير صالح')
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`
}

/** True when the string is exactly a 6-digit OTP code. */
export function isValidOtpCode(code: string): boolean {
  return /^[0-9]{6}$/.test(String(code ?? '').trim())
}
