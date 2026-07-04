'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { Role } from './config'

type RoleContextValue = {
  role: Role
  /** Merchants must be verified to unlock wholesale pricing. Demo: always true. */
  isMerchant: boolean
  setRole: (r: Role) => void
}

const RoleContext = createContext<RoleContextValue | null>(null)

const STORAGE_KEY = 'mawrid_role'

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>('guest')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Role | null
    if (saved) setRoleState(saved)
  }, [])

  const setRole = useCallback((r: Role) => {
    setRoleState(r)
    localStorage.setItem(STORAGE_KEY, r)
  }, [])

  const value = useMemo(
    () => ({ role, isMerchant: role === 'merchant', setRole }),
    [role, setRole],
  )

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used within RoleProvider')
  return ctx
}
