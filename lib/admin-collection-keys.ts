/** Whitelist of admin collection keys persisted in PostgreSQL. */
export const ADMIN_COLLECTION_KEYS = [
  'admin-campaigns',
  'admin-segments',
  'admin-disputes',
  'admin-loyalty',
  'admin-referrals',
  'admin-content-pages',
  'admin-content-faq',
  'admin-content-announcements',
  'admin-apps',
  'admin-apps-versions',
  'admin-apps-banners',
  'admin-apps-config',
  'admin-apps-force-update',
  'admin-integrations',
  'admin-api-keys',
  'admin-notifications',
  'admin-support-chats',
  'admin-logs',
  'admin-account',
  'admin-finance-taxes',
  'admin-health-incidents',
  'admin-brands',
  'admin-units',
  'admin-attributes',
  'admin-shipping-carriers',
  'admin-shipping-methods',
] as const

export type AdminCollectionKey = (typeof ADMIN_COLLECTION_KEYS)[number]

const KEY_SET = new Set<string>(ADMIN_COLLECTION_KEYS)

export function isAllowedCollectionKey(key: string): key is AdminCollectionKey {
  return KEY_SET.has(key)
}
