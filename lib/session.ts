/**
 * lib/session.ts
 * Shared helpers for reading the Better Auth session on the server.
 * Used by Server Actions, Route Handlers, and middleware.
 */
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

/** Returns the session, or null if not authenticated. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

/**
 * Returns the current user's id.
 * Throws 'Unauthorized' if there is no valid session.
 * Use this in every Server Action or Route Handler that touches user data.
 */
export async function getUserId(): Promise<string> {
  const session = await getSession()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

/** Same as getUserId() but also returns the full user object. */
export async function requireSession() {
  const session = await getSession()
  if (!session?.user) throw new Error('Unauthorized')
  return session
}
