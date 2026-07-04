import type { CartItem } from '@/lib/cart'
import type { Role } from '@/lib/config'
import { delay, makeId } from './core'

/**
 * Mock authentication. The one-time password is NEVER returned to the client or
 * rendered anywhere — `requestOtp` only reports that a code was "sent" plus the
 * resend cooldown. `verifyOtp` accepts any well-formed 6-digit code so the demo
 * flow completes without ever surfacing a real secret.
 */

export const OTP_LENGTH = 6
export const RESEND_COOLDOWN_SECONDS = 30

export type OtpRequestResult = {
  sent: boolean
  cooldownSeconds: number
  /** Masked phone for display, e.g. +966 •• ••• 4567 */
  maskedPhone: string
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return phone
  const tail = digits.slice(-4)
  return `${phone.slice(0, 4)} •• ••• ${tail}`
}

export async function requestOtp(phone: string): Promise<OtpRequestResult> {
  return delay(
    {
      sent: true,
      cooldownSeconds: RESEND_COOLDOWN_SECONDS,
      maskedPhone: maskPhone(phone),
    },
    600,
  )
}

export type VerifyResult = { ok: boolean }

export async function verifyOtp(code: string): Promise<VerifyResult> {
  const ok = /^\d{6}$/.test(code)
  return delay({ ok }, 500)
}

export type ConsumerRegistration = {
  name: string
  phone: string
}

export type MerchantRegistration = {
  businessName: string
  phone: string
  crNumber: string
  vatNumber: string
  vatDocName?: string
}

export type Session = {
  userId: string
  role: Role
}

export async function registerConsumer(input: ConsumerRegistration): Promise<Session> {
  void input
  return delay({ userId: makeId('usr'), role: 'consumer' as Role }, 500)
}

export async function registerMerchant(input: MerchantRegistration): Promise<Session> {
  void input
  return delay({ userId: makeId('usr'), role: 'merchant' as Role }, 700)
}

/**
 * The server-side cart saved for a returning user. On login the guest (browser)
 * cart is merged into this. Returns empty by default; the merge logic lives in
 * the cart context so quantities combine by product.
 */
export async function fetchSavedCart(): Promise<CartItem[]> {
  return delay<CartItem[]>([], 200)
}
