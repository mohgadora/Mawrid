/**
 * lib/referral-code.ts — pure referral-code formatting (no I/O).
 * The random suffix is supplied by the caller so the format is deterministic
 * and testable.
 */

/** Builds a referral code: 8-char sanitized prefix from the user id + suffix. */
export function buildReferralCode(userId: string, suffix: string): string {
  const prefix = String(userId ?? '').slice(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, 'X')
  return `${prefix}${String(suffix ?? '').toUpperCase()}`
}
