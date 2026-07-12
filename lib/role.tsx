'use client'

import { createContext, useCallback, useContext, useMemo } from 'react'
import type { Role } from './config'
import { authClient } from '@/lib/auth-client'

type RoleContextValue = {
  role: Role
  isMerchant: boolean
  /** هل المستخدم مسجّل دخوله (جلسة صالحة)؟ */
  isLoggedIn: boolean
  /** الجلسة قيد التحميل — لا تُظهر حالة الضيف بعد حتى لا يومض زر الدخول للمسجّلين. */
  isPending: boolean
  /** يُستخدم فقط عند تسجيل الخروج لإعادة الضيف */
  setRole: (r: Role) => void
}

const RoleContext = createContext<RoleContextValue | null>(null)

function roleFromSession(sessionRole?: string | null, isLoggedIn?: boolean): Role {
  if (!isLoggedIn) return 'guest'
  return sessionRole === 'merchant' ? 'merchant' : 'consumer'
}

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession()
  const sessionRole = (session?.user as { role?: string } | undefined)?.role
  const isLoggedIn = Boolean(session?.user)

  const role = useMemo(
    () => roleFromSession(sessionRole, isLoggedIn),
    [sessionRole, isLoggedIn],
  )

  const setRole = useCallback((_r: Role) => {
    // الدور يُشتق من الجلسة فقط — لا تخزين محلي.
  }, [])

  const value = useMemo(
    () => ({ role, isMerchant: role === 'merchant', isLoggedIn, isPending, setRole }),
    [role, isLoggedIn, isPending, setRole],
  )

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used within RoleProvider')
  return ctx
}
