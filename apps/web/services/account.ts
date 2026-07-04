import type { Role } from '@/lib/config'
import { clone, delay, makeId, readStore, writeStore } from './core'

export type Address = {
  id: string
  labelAr: string
  labelEn: string
  line: string
  cityAr: string
  cityEn: string
  phone: string
  isDefault: boolean
}

export type Branch = {
  id: string
  nameAr: string
  nameEn: string
  cityAr: string
  cityEn: string
  manager: string
}

export type ReorderTemplate = {
  id: string
  nameAr: string
  nameEn: string
  items: { productId: string; qty: number }[]
}

export type Profile = {
  nameAr: string
  nameEn: string
  phone: string
  email: string
  role: Role
  crNumber?: string
  vatNumber?: string
}

const PROFILE_KEY = 'mawrid_profile'
const ADDRESS_KEY = 'mawrid_addresses'
const BRANCH_KEY = 'mawrid_branches'
const FAV_KEY = 'mawrid_favorites'
const TEMPLATE_KEY = 'mawrid_templates'

const DEFAULT_PROFILE: Profile = {
  nameAr: 'متجر البركة للمواد الغذائية',
  nameEn: 'Al Baraka Grocery Store',
  phone: '+966 55 123 4567',
  email: 'store@albaraka.example',
  role: 'merchant',
}

const DEFAULT_ADDRESSES: Address[] = [
  {
    id: 'addr_main',
    labelAr: 'الفرع الرئيسي',
    labelEn: 'Main Branch',
    line: 'شارع الملك فهد، حي العليا',
    cityAr: 'الرياض',
    cityEn: 'Riyadh',
    phone: '+966 55 123 4567',
    isDefault: true,
  },
  {
    id: 'addr_wh',
    labelAr: 'المستودع',
    labelEn: 'Warehouse',
    line: 'المنطقة الصناعية الثانية',
    cityAr: 'الرياض',
    cityEn: 'Riyadh',
    phone: '+966 55 765 4321',
    isDefault: false,
  },
]

const DEFAULT_BRANCHES: Branch[] = [
  {
    id: 'br_1',
    nameAr: 'فرع العليا',
    nameEn: 'Olaya Branch',
    cityAr: 'الرياض',
    cityEn: 'Riyadh',
    manager: 'أحمد سالم',
  },
  {
    id: 'br_2',
    nameAr: 'فرع الملقا',
    nameEn: 'Malqa Branch',
    cityAr: 'الرياض',
    cityEn: 'Riyadh',
    manager: 'خالد ناصر',
  },
]

const DEFAULT_TEMPLATES: ReorderTemplate[] = [
  {
    id: 'tpl_weekly',
    nameAr: 'طلبية أسبوعية',
    nameEn: 'Weekly restock',
    items: [
      { productId: 'rice-basmati', qty: 20 },
      { productId: 'sunflower-oil', qty: 30 },
      { productId: 'white-sugar', qty: 20 },
    ],
  },
  {
    id: 'tpl_beverages',
    nameAr: 'مشروبات ووجبات',
    nameEn: 'Drinks & snacks',
    items: [
      { productId: 'soft-drinks', qty: 25 },
      { productId: 'chips-snacks', qty: 30 },
    ],
  },
]

export async function getProfile(): Promise<Profile> {
  return delay(readStore(PROFILE_KEY, DEFAULT_PROFILE))
}

export async function updateProfile(patch: Partial<Profile>): Promise<Profile> {
  const next = { ...readStore(PROFILE_KEY, DEFAULT_PROFILE), ...patch }
  writeStore(PROFILE_KEY, next)
  return delay(next)
}

export async function getAddresses(): Promise<Address[]> {
  return delay(readStore(ADDRESS_KEY, DEFAULT_ADDRESSES))
}

export async function addAddress(input: Omit<Address, 'id' | 'isDefault'>): Promise<Address[]> {
  const list = readStore(ADDRESS_KEY, DEFAULT_ADDRESSES)
  const created: Address = { ...input, id: makeId('addr'), isDefault: list.length === 0 }
  const next = [...list, created]
  writeStore(ADDRESS_KEY, next)
  return delay(next)
}

export async function removeAddress(id: string): Promise<Address[]> {
  const next = readStore(ADDRESS_KEY, DEFAULT_ADDRESSES).filter((a) => a.id !== id)
  writeStore(ADDRESS_KEY, next)
  return delay(next)
}

export async function getBranches(): Promise<Branch[]> {
  return delay(readStore(BRANCH_KEY, DEFAULT_BRANCHES))
}

export async function getFavorites(): Promise<string[]> {
  return delay(readStore<string[]>(FAV_KEY, ['soft-drinks', 'uht-milk']))
}

/** Toggle a product favorite; returns the new favorites list. */
export async function toggleFavorite(productId: string): Promise<string[]> {
  const list = readStore<string[]>(FAV_KEY, ['soft-drinks', 'uht-milk'])
  const next = list.includes(productId)
    ? list.filter((id) => id !== productId)
    : [...list, productId]
  writeStore(FAV_KEY, next)
  return delay(clone(next))
}

export async function getReorderTemplates(): Promise<ReorderTemplate[]> {
  return delay(readStore(TEMPLATE_KEY, DEFAULT_TEMPLATES))
}
