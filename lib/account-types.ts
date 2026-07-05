/**
 * lib/account-types.ts
 * Shared account types importable by both server and client code.
 */

export type Address = {
  id: string
  label: string
  line1: string
  city: string
  country: string
  isDefault: boolean
  fullName?: string
  phone?: string
}

export type Profile = {
  name: string
  email: string
  phone: string
  company: string
  country: string
  vatNumber: string
  role: string
}

export type Branch = {
  id: string
  name: string
  city: string
  manager: string
  phone: string
}

export type ReorderTemplate = {
  id: string
  name: string
  items: { productId: string; qty: number; product?: unknown }[]
}
