// ─────────────────────────────────────────────────────────────────────────────
// Mawrid — Drizzle ORM schema
// Table names match the DDL run via Neon MCP exactly.
// ─────────────────────────────────────────────────────────────────────────────
import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

const id   = () => text('id').primaryKey()
const uuid = () => text('id').primaryKey().$defaultFn(() => crypto.randomUUID())
const now  = () => timestamp('createdAt', { withTimezone: true }).notNull().defaultNow()

// ═══════════════════════════════════════════════════════════════════════════
// BETTER AUTH TABLES  (column names must stay as-is — Better Auth owns them)
// ═══════════════════════════════════════════════════════════════════════════

export const user = pgTable('user', {
  id:            text('id').primaryKey(),
  name:          text('name').notNull(),
  email:         text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image:         text('image'),
  // App-level extensions
  role:          text('role').notNull().default('consumer'), // consumer|merchant|supplier|admin
  phone:         text('phone'),
  company:       text('company'),
  vatNumber:     text('vatNumber'),
  country:       text('country').default('SA'),
  // Better Auth admin plugin fields
  banned:        boolean('banned').default(false),
  banReason:     text('banReason'),
  banExpires:    timestamp('banExpires', { withTimezone: true }),
  createdAt:     timestamp('createdAt', { withTimezone: true }).notNull(),
  updatedAt:     timestamp('updatedAt', { withTimezone: true }).notNull(),
})

export const session = pgTable('session', {
  id:        text('id').primaryKey(),
  expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
  token:     text('token').notNull().unique(),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId:    text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id:                    text('id').primaryKey(),
  accountId:             text('accountId').notNull(),
  providerId:            text('providerId').notNull(),
  userId:                text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken:           text('accessToken'),
  refreshToken:          text('refreshToken'),
  idToken:               text('idToken'),
  accessTokenExpiresAt:  timestamp('accessTokenExpiresAt', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt', { withTimezone: true }),
  scope:                 text('scope'),
  password:              text('password'),
  createdAt:             timestamp('createdAt', { withTimezone: true }).notNull(),
  updatedAt:             timestamp('updatedAt', { withTimezone: true }).notNull(),
})

export const verification = pgTable('verification', {
  id:         text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value:      text('value').notNull(),
  expiresAt:  timestamp('expiresAt', { withTimezone: true }).notNull(),
  createdAt:  timestamp('createdAt', { withTimezone: true }),
  updatedAt:  timestamp('updatedAt', { withTimezone: true }),
})

// ═══════════════════════════════════════════════════════════════════════════
// CATALOG
// ═══════════════════════════════════════════════════════════════════════════

export const category = pgTable('category', {
  id:        uuid(),
  name:      text('name').notNull(),
  nameAr:    text('nameAr').notNull(),
  slug:      text('slug').notNull().unique(),
  icon:      text('icon'),
  parentId:  text('parentId'),
  sortOrder: integer('sortOrder').notNull().default(0),
  createdAt: now(),
})

export const supplier = pgTable('supplier', {
  id:             uuid(),
  name:           text('name').notNull(),
  nameAr:         text('nameAr'),
  logo:           text('logo'),
  country:        text('country').notNull().default('SA'),
  city:           text('city'),
  rating:         numeric('rating', { precision: 3, scale: 2 }).notNull().default('0'),
  reviewCount:    integer('reviewCount').notNull().default(0),
  verified:       boolean('verified').notNull().default(false),
  responseTime:   text('responseTime'),
  minOrder:       integer('minOrder').notNull().default(1),
  userId:         text('userId').references(() => user.id),
  commissionRate: numeric('commissionRate', { precision: 5, scale: 2 }),
  bannerUrl:      text('bannerUrl'),
  phone:          text('phone'),
  email:          text('email'),
  address:        text('address'),
  socialLinks:    jsonb('socialLinks').$type<Record<string,string>>().default({}),
  shippingPolicy: text('shippingPolicy'),
  returnPolicy:   text('returnPolicy'),
  status:         text('status').notNull().default('active'),
  createdAt:      now(),
  updatedAt:      timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

export const product = pgTable('product', {
  id:              uuid(),
  sku:             text('sku').unique(),
  name:            text('name').notNull(),
  nameAr:          text('nameAr'),
  description:     text('description'),
  descriptionAr:   text('descriptionAr'),
  categoryId:      text('categoryId').references(() => category.id),
  supplierId:      text('supplierId').references(() => supplier.id),
  imageUrl:        text('imageUrl'),
  images:          jsonb('images').notNull().default('[]'),
  unitsPerCarton:  integer('unitsPerCarton').notNull().default(1),
  weight:          numeric('weight', { precision: 8, scale: 3 }),
  tags:            jsonb('tags').notNull().default('[]'),
  marketAvgPrice:  numeric('marketAvgPrice', { precision: 12, scale: 2 }),
  stock:           integer('stock').notNull().default(0),
  active:          boolean('active').notNull().default(true),
  featured:        boolean('featured').notNull().default(false),
  status:          text('status').notNull().default('approved'),
  createdAt:       now(),
  updatedAt:       timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

export const priceTier = pgTable('price_tier', {
  id:        uuid(),
  productId: text('productId').notNull().references(() => product.id, { onDelete: 'cascade' }),
  minQty:    integer('minQty').notNull(),
  maxQty:    integer('maxQty'),
  price:     numeric('price', { precision: 12, scale: 2 }).notNull(),
  sortOrder: integer('sortOrder').notNull().default(0),
})

// ═══════════════════════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════════════════════

export const address = pgTable('address', {
  id:         uuid(),
  userId:     text('userId').notNull(),
  label:      text('label').notNull().default('Home'),
  fullName:   text('fullName').notNull(),
  phone:      text('phone').notNull(),
  line1:      text('line1').notNull(),
  line2:      text('line2'),
  city:       text('city').notNull(),
  region:     text('region'),
  country:    text('country').notNull().default('SA'),
  postalCode: text('postalCode'),
  isDefault:  boolean('isDefault').notNull().default(false),
  createdAt:  now(),
})

export const order = pgTable('order', {
  id:               uuid(),
  ref:              text('ref').notNull().unique(),
  userId:           text('userId').notNull(),
  supplierId:       text('supplierId').references(() => supplier.id),
  status:           text('status').notNull().default('pending'),
  addressId:        text('addressId').references(() => address.id),
  shippingAddress:  jsonb('shippingAddress'),
  paymentMethod:    text('paymentMethod').notNull().default('cod'),
  paymentStatus:    text('paymentStatus').notNull().default('unpaid'),
  subtotal:         numeric('subtotal', { precision: 12, scale: 2 }).notNull().default('0'),
  shippingFee:      numeric('shippingFee', { precision: 12, scale: 2 }).notNull().default('0'),
  discount:         numeric('discount', { precision: 12, scale: 2 }).notNull().default('0'),
  total:            numeric('total', { precision: 12, scale: 2 }).notNull().default('0'),
  couponId:         text('couponId'),
  couponCode:       text('couponCode'),
  notes:            text('notes'),
  estimatedDelivery: date('estimatedDelivery'),
  deliveredAt:      timestamp('deliveredAt', { withTimezone: true }),
  createdAt:        now(),
  updatedAt:        timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

export const orderLine = pgTable('order_line', {
  id:             uuid(),
  orderId:        text('orderId').notNull().references(() => order.id, { onDelete: 'cascade' }),
  productId:      text('productId').references(() => product.id),
  productName:    text('productName').notNull(),
  productImage:   text('productImage'),
  sku:            text('sku'),
  variantId:      text('variantId').references(() => productVariant.id, { onDelete: 'set null' }),
  variantSku:     text('variantSku'),
  variantOptions: jsonb('variantOptions').notNull().default('{}'),
  qty:            integer('qty').notNull(),
  unitPrice:      numeric('unitPrice', { precision: 12, scale: 2 }).notNull(),
  cartonQty:      integer('cartonQty').notNull().default(1),
  unitsPerCarton: integer('unitsPerCarton').notNull().default(1),
  subtotal:       numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
})

export const orderEvent = pgTable('order_event', {
  id:        uuid(),
  orderId:   text('orderId').notNull().references(() => order.id, { onDelete: 'cascade' }),
  status:    text('status').notNull(),
  note:      text('note'),
  createdBy: text('createdBy'),
  createdAt: now(),
})

// ═══════════════════════════════════════════════════════════════════════════
// ACCOUNT / STOREFRONT
// ═══════════════════════════════════════════════════════════════════════════

export const favorite = pgTable('favorite', {
  id:        uuid(),
  userId:    text('userId').notNull(),
  productId: text('productId').notNull().references(() => product.id, { onDelete: 'cascade' }),
  createdAt: now(),
})

export const orderTemplate = pgTable('order_template', {
  id:        uuid(),
  userId:    text('userId').notNull(),
  name:      text('name').notNull(),
  items:     jsonb('items').notNull().default('[]'),
  createdAt: now(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

// ═══════════════════════════════════════════════════════════════════════════
// SUPPORT
// ═══════════════════════════════════════════════════════════════════════════

export const supportTicket = pgTable('support_ticket', {
  id:         uuid(),
  ref:        text('ref').notNull().unique(),
  userId:     text('userId').notNull(),
  orderId:    text('orderId').references(() => order.id),
  subject:    text('subject').notNull(),
  body:       text('body').notNull(),
  status:     text('status').notNull().default('open'),
  priority:   text('priority').notNull().default('medium'),
  assignedTo: text('assignedTo'),
  resolvedAt: timestamp('resolvedAt', { withTimezone: true }),
  createdAt:  now(),
  updatedAt:  timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

export const ticketMessage = pgTable('ticket_message', {
  id:        uuid(),
  ticketId:  text('ticketId').notNull().references(() => supportTicket.id, { onDelete: 'cascade' }),
  userId:    text('userId').notNull(),
  body:      text('body').notNull(),
  isStaff:   boolean('isStaff').notNull().default(false),
  createdAt: now(),
})

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════════════════════════════════

export const kycApproval = pgTable('kyc_approval', {
  id:          uuid(),
  userId:      text('userId').notNull(),
  type:        text('type').notNull().default('merchant'),
  status:      text('status').notNull().default('pending'),
  crNumber:    text('crNumber'),
  vatNumber:   text('vatNumber'),
  documents:   jsonb('documents').notNull().default('[]'),
  reviewedBy:  text('reviewedBy'),
  reviewNote:  text('reviewNote'),
  submittedAt: now(),
  reviewedAt:  timestamp('reviewedAt', { withTimezone: true }),
})

export const payout = pgTable('payout', {
  id:              uuid(),
  supplierId:      text('supplierId').notNull().references(() => supplier.id),
  amount:          numeric('amount', { precision: 12, scale: 2 }).notNull(),
  currency:        text('currency').notNull().default('SAR'),
  status:          text('status').notNull().default('pending'),
  reference:       text('reference'),
  bankAccount:     jsonb('bankAccount'),
  processedAt:     timestamp('processedAt', { withTimezone: true }),
  rejectionReason: text('rejectionReason'),
  adminNote:       text('adminNote'),
  requestedBy:     text('requestedBy'),
  reviewedBy:      text('reviewedBy'),
  paidAt:          timestamp('paidAt', { withTimezone: true }),
  createdAt:       now(),
})

export const transaction = pgTable('transaction', {
  id:        uuid(),
  userId:    text('userId').notNull(),
  orderId:   text('orderId').references(() => order.id),
  type:      text('type').notNull(),
  amount:    numeric('amount', { precision: 12, scale: 2 }).notNull(),
  currency:  text('currency').notNull().default('SAR'),
  status:    text('status').notNull().default('completed'),
  gateway:   text('gateway'),
  reference: text('reference'),
  meta:      jsonb('meta'),
  createdAt: now(),
})

// ═══════════════════════════════════════════════════════════════════════════
// LOGISTICS
// ═══════════════════════════════════════════════════════════════════════════

export const driver = pgTable('driver', {
  id:             uuid(),
  name:           text('name').notNull(),
  phone:          text('phone').notNull(),
  vehicle:        text('vehicle').notNull(),
  vehiclePlate:   text('vehiclePlate'),
  status:         text('status').notNull().default('offline'),
  lat:            numeric('lat', { precision: 10, scale: 7 }),
  lng:            numeric('lng', { precision: 10, scale: 7 }),
  city:           text('city'),
  currentOrderId: text('currentOrderId').references(() => order.id),
  userId:         text('userId').references(() => user.id),
  createdAt:      now(),
  updatedAt:      timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

// ═══════════════════════════════════════════════════════════════════════════
// GEOGRAPHY
// ═══════════════════════════════════════════════════════════════════════════

export const country = pgTable('country', {
  id:       uuid(),
  code:     text('code').notNull().unique(),
  name:     text('name').notNull(),
  nameAr:   text('nameAr').notNull(),
  currency: text('currency').notNull().default('SAR'),
  active:   boolean('active').notNull().default(true),
})

export const deliveryZone = pgTable('delivery_zone', {
  id:             uuid(),
  name:           text('name').notNull(),
  nameAr:         text('nameAr'),
  country:        text('country').notNull().default('SA'),
  shippingFee:    numeric('shippingFee', { precision: 12, scale: 2 }).notNull().default('0'),
  freeOverAmount: numeric('freeOverAmount', { precision: 12, scale: 2 }),
  estimatedDays:  integer('estimatedDays').notNull().default(3),
  active:         boolean('active').notNull().default(true),
  createdAt:      now(),
})

export const shippingRule = pgTable('shipping_rule', {
  id:             text('id').primaryKey(),
  zoneId:         text('zoneId').notNull().references(() => deliveryZone.id, { onDelete: 'cascade' }),
  name:           text('name').notNull(),
  minOrderAmount: numeric('minOrderAmount', { precision: 12, scale: 2 }).notNull().default('0'),
  maxOrderAmount: numeric('maxOrderAmount', { precision: 12, scale: 2 }),
  freeAbove:      numeric('freeAbove', { precision: 12, scale: 2 }),
  baseFee:        numeric('baseFee', { precision: 12, scale: 2 }).notNull().default('0'),
  perKgFee:       numeric('perKgFee', { precision: 12, scale: 2 }).notNull().default('0'),
  estimatedDays:  integer('estimatedDays').notNull().default(3),
  active:         boolean('active').notNull().default(true),
  createdAt:      timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
})
export type ShippingRule = typeof shippingRule.$inferSelect

export const auditLog = pgTable('audit_log', {
  id:        uuid(),
  userId:    text('userId'),
  action:    text('action').notNull(),
  entity:    text('entity').notNull(),
  entityId:  text('entityId'),
  diff:      jsonb('diff'),
  ip:        text('ip'),
  createdAt: now(),
})

/** Generic JSON collections for admin config screens (campaigns, brands, tax rules, …). */
export const adminCollection = pgTable('admin_collection', {
  key:       text('key').primaryKey(),
  items:     jsonb('items').notNull().default('[]'),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM SETTINGS  (single-row config table — key/value pairs)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Typed key-value store for global platform settings.
 * One row per setting key; value is always text (cast at read time).
 */
export const systemSetting = pgTable('system_setting', {
  key:       text('key').primaryKey(),
  value:     text('value').notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: text('updatedBy'),
})

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCT VARIANTS
// ═══════════════════════════════════════════════════════════════════════════

export const productVariant = pgTable('product_variant', {
  id:               uuid(),
  productId:        text('productId').notNull().references(() => product.id, { onDelete: 'cascade' }),
  sku:              text('sku').notNull().unique(),
  barcode:          text('barcode'),
  price:            numeric('price', { precision: 12, scale: 2 }).notNull(),
  compareAtPrice:   numeric('compareAtPrice', { precision: 12, scale: 2 }),
  stock:            integer('stock').notNull().default(0),
  lowStockThreshold:integer('lowStockThreshold').notNull().default(5),
  weight:           numeric('weight', { precision: 8, scale: 3 }),
  images:           jsonb('images').notNull().default('[]'),
  options:          jsonb('options').notNull().default('{}'), // { color: 'Red', size: 'XL' }
  isDefault:        boolean('isDefault').notNull().default(false),
  active:           boolean('active').notNull().default(true),
  createdAt:        now(),
  updatedAt:        timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

// ═══════════════════════════════════════════════════════════════════════════
// COUPONS
// ═══════════════════════════════════════════════════════════════════════════

export const coupon = pgTable('coupon', {
  id:                   uuid(),
  code:                 text('code').notNull().unique(),
  type:                 text('type').notNull().default('percentage'), // percentage | fixed | free_shipping
  value:                numeric('value', { precision: 10, scale: 2 }).notNull(),
  minOrderAmount:       numeric('minOrderAmount', { precision: 12, scale: 2 }),
  maxDiscountAmount:    numeric('maxDiscountAmount', { precision: 12, scale: 2 }),
  usageLimitTotal:      integer('usageLimitTotal'),
  usageLimitPerCustomer:integer('usageLimitPerCustomer').notNull().default(1),
  usedCount:            integer('usedCount').notNull().default(0),
  firstOrderOnly:       boolean('firstOrderOnly').notNull().default(false),
  applicableProductIds: jsonb('applicableProductIds').notNull().default('[]'),
  applicableCategoryIds:jsonb('applicableCategoryIds').notNull().default('[]'),
  scope:                text('scope').notNull().default('global'), // global | supplier | category | product | first_order
  scopeIds:             jsonb('scopeIds').notNull().default('[]'),
  supplierId:           text('supplierId').references(() => supplier.id, { onDelete: 'cascade' }),
  titleAr:              text('titleAr'),
  titleEn:              text('titleEn'),
  descriptionAr:        text('descriptionAr'),
  descriptionEn:        text('descriptionEn'),
  startsAt:             timestamp('startsAt', { withTimezone: true }),
  expiresAt:            timestamp('expiresAt', { withTimezone: true }),
  active:               boolean('active').notNull().default(true),
  createdBy:            text('createdBy'),
  createdAt:            now(),
})

export const couponUsage = pgTable('coupon_usage', {
  id:             uuid(),
  couponId:       text('couponId').notNull().references(() => coupon.id, { onDelete: 'cascade' }),
  userId:         text('userId').notNull(),
  orderId:        text('orderId').references(() => order.id),
  discountAmount: numeric('discountAmount', { precision: 12, scale: 2 }).notNull().default('0'),
  createdAt:      now(),
})

// ═══════════════════════════════════════════════════════════════════════════
// SELLER EARNINGS / COMMISSION
// ═══════════════════════════════════════════════════════════════════════════

export const sellerEarning = pgTable('seller_earning', {
  id:                 uuid(),
  supplierId:         text('supplierId').notNull().references(() => supplier.id),
  orderId:            text('orderId').notNull().references(() => order.id),
  grossAmount:        numeric('grossAmount', { precision: 12, scale: 2 }).notNull(),
  commissionRate:     numeric('commissionRate', { precision: 5, scale: 2 }).notNull(),
  commissionAmount:   numeric('commissionAmount', { precision: 12, scale: 2 }).notNull(),
  netEarning:         numeric('netEarning', { precision: 12, scale: 2 }).notNull(),
  status:             text('status').notNull().default('pending'), // pending | settled | reversed
  settledAt:          timestamp('settledAt', { withTimezone: true }),
  createdAt:          now(),
})

// ═══════════════════════════════════════════════════════════════════════════
// ADVERTISEMENTS
// ═══════════════════════════════════════════════════════════════════════════

export const advertisement = pgTable('advertisement', {
  id:          uuid(),
  titleAr:     text('titleAr').notNull(),
  titleEn:     text('titleEn'),
  type:        text('type').notNull(), // banner | popup | product_highlight | category_highlight
  imageUrl:    text('imageUrl').notNull(),
  targetUrl:   text('targetUrl'),
  placement:   text('placement').notNull(), // home_top | home_middle | category_page | search_results | checkout
  priority:    integer('priority').notNull().default(0),
  impressions: integer('impressions').notNull().default(0),
  clicks:      integer('clicks').notNull().default(0),
  supplierId:  text('supplierId').references(() => supplier.id, { onDelete: 'cascade' }),
  status:      text('status').notNull().default('approved'), // pending | approved | rejected
  active:      boolean('active').notNull().default(true),
  startsAt:    timestamp('startsAt', { withTimezone: true }),
  expiresAt:   timestamp('expiresAt', { withTimezone: true }),
  createdAt:   now(),
})

// ═══════════════════════════════════════════════════════════════════════════
// SEO
// ═══════════════════════════════════════════════════════════════════════════

export const seoMeta = pgTable('seo_meta', {
  id:            uuid(),
  entityType:    text('entityType').notNull(), // product | category | supplier | page
  entityId:      text('entityId').notNull(),
  titleAr:       text('titleAr'),
  titleEn:       text('titleEn'),
  descriptionAr: text('descriptionAr'),
  descriptionEn: text('descriptionEn'),
  keywords:      jsonb('keywords').notNull().default('[]'),
  ogImage:       text('ogImage'),
  canonicalUrl:  text('canonicalUrl'),
  noIndex:       boolean('noIndex').notNull().default(false),
  createdAt:     now(),
  updatedAt:     timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

// ═══════════════════════════════════════════════════════════════════════════
// CHAT
// ═══════════════════════════════════════════════════════════════════════════

export const conversation = pgTable('conversation', {
  id:             uuid(),
  type:           text('type').notNull(), // buyer_supplier | buyer_admin | buyer_driver
  orderId:        text('orderId').references(() => order.id),
  participantIds: jsonb('participantIds').notNull().default('[]'),
  lastMessageAt:  timestamp('lastMessageAt', { withTimezone: true }),
  createdAt:      now(),
})

export const chatMessage = pgTable('chat_message', {
  id:             uuid(),
  conversationId: text('conversationId').notNull().references(() => conversation.id, { onDelete: 'cascade' }),
  senderId:       text('senderId').notNull().references(() => user.id),
  body:           text('body').notNull(),
  images:         jsonb('images').notNull().default('[]'),
  readAt:         timestamp('readAt', { withTimezone: true }),
  createdAt:      now(),
})

// ═══════════════════════════════════════════════════════════════════════════
// DIGITAL WALLET
// ═══════════════════════════════════════════════════════════════════════════

export const wallet = pgTable('wallet', {
  id:             uuid(),
  userId:         text('userId').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
  balance:        numeric('balance', { precision: 12, scale: 2 }).notNull().default('0'),
  lifetimeCredit: numeric('lifetimeCredit', { precision: 12, scale: 2 }).notNull().default('0'),
  lifetimeDebit:  numeric('lifetimeDebit', { precision: 12, scale: 2 }).notNull().default('0'),
  currency:       text('currency').notNull().default('USD'),
  createdAt:      now(),
  updatedAt:      timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

export const walletTransaction = pgTable('wallet_transaction', {
  id:           uuid(),
  walletId:     text('walletId').notNull().references(() => wallet.id, { onDelete: 'cascade' }),
  type:         text('type').notNull(), // topup|purchase|refund|bonus|loyalty_convert|cashback|admin_credit|admin_debit
  amount:       numeric('amount', { precision: 12, scale: 2 }).notNull(),
  balanceAfter: numeric('balanceAfter', { precision: 12, scale: 2 }).notNull(),
  reference:    text('reference'),
  note:         text('note'),
  createdBy:    text('createdBy'),
  createdAt:    now(),
})

export const walletBonusRule = pgTable('wallet_bonus_rule', {
  id:         uuid(),
  minTopup:   numeric('minTopup', { precision: 12, scale: 2 }).notNull(),
  bonusType:  text('bonusType').notNull(), // percent | fixed
  bonusValue: numeric('bonusValue', { precision: 12, scale: 2 }).notNull(),
  maxBonus:   numeric('maxBonus', { precision: 12, scale: 2 }),
  active:     boolean('active').notNull().default(true),
  startsAt:   timestamp('startsAt', { withTimezone: true }),
  expiresAt:  timestamp('expiresAt', { withTimezone: true }),
  createdAt:  now(),
})

export const cashbackRule = pgTable('cashback_rule', {
  id:             uuid(),
  type:           text('type').notNull(), // percent | fixed
  value:          numeric('value', { precision: 12, scale: 2 }).notNull(),
  maxCashback:    numeric('maxCashback', { precision: 12, scale: 2 }),
  minOrderAmount: numeric('minOrderAmount', { precision: 12, scale: 2 }).notNull().default('0'),
  scope:          text('scope').notNull().default('global'), // global | supplier | category | first_order
  scopeIds:       jsonb('scopeIds').notNull().default('[]'),
  titleAr:        text('titleAr'),
  titleEn:        text('titleEn'),
  active:         boolean('active').notNull().default(true),
  startsAt:       timestamp('startsAt', { withTimezone: true }),
  expiresAt:      timestamp('expiresAt', { withTimezone: true }),
  createdAt:      now(),
})

// ═══════════════════════════════════════════════════════════════════════════
// REFUND REQUESTS
// ═══════════════════════════════════════════════════════════════════════════

export const refundRequest = pgTable('refund_request', {
  id:                   uuid(),
  ref:                  text('ref').notNull().unique(),
  orderId:              text('orderId').notNull().references(() => order.id),
  userId:               text('userId').notNull(),
  items:                jsonb('items').notNull().default('[]'), // [{ orderLineId, qty, reason }]
  reason:               text('reason').notNull(),
  notes:                text('notes'),
  status:               text('status').notNull().default('pending'), // pending | approved | rejected | processing | refunded | cancelled
  refundAmount:         numeric('refundAmount', { precision: 12, scale: 2 }),
  adminNote:            text('adminNote'),
  reviewedBy:           text('reviewedBy'),
  reviewedAt:           timestamp('reviewedAt', { withTimezone: true }),
  returnTrackingNumber: text('returnTrackingNumber'),
  images:               jsonb('images').notNull().default('[]'),
  createdAt:            now(),
  updatedAt:            timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

// ═══════════════════════════════════════════════════════════════════════════
// STOCK MOVEMENTS
// ═══════════════════════════════════════════════════════════════════════════

export const stockMovement = pgTable('stock_movement', {
  id:          uuid(),
  productId:   text('productId').notNull().references(() => product.id),
  variantId:   text('variantId').references(() => productVariant.id),
  type:        text('type').notNull(), // order_placed | order_cancelled | refund | manual | import
  delta:       integer('delta').notNull(), // positive = in, negative = out
  stockAfter:  integer('stockAfter').notNull(),
  reference:   text('reference'),        // orderId, importId, etc.
  reason:      text('reason'),
  createdBy:   text('createdBy'),
  createdAt:   now(),
})

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCT REVIEWS
// ═══════════════════════════════════════════════════════════════════════════

export const productReview = pgTable('product_review', {
  id:         uuid(),
  productId:  text('productId').notNull().references(() => product.id, { onDelete: 'cascade' }),
  userId:     text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  orderId:    text('orderId').references(() => order.id, { onDelete: 'set null' }),
  rating:     integer('rating').notNull(),              // 1–5
  title:      text('title'),
  body:       text('body').notNull(),
  helpfulCount: integer('helpfulCount').notNull().default(0),
  verified:   boolean('verified').notNull().default(false), // purchased and delivered
  createdAt:  now(),
  updatedAt:  timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

export const reviewReply = pgTable('review_reply', {
  id:        uuid(),
  reviewId:  text('reviewId').notNull().references(() => productReview.id, { onDelete: 'cascade' }),
  userId:    text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  body:      text('body').notNull(),
  createdAt: now(),
})

export const reviewHelpful = pgTable('review_helpful', {
  id:        uuid(),
  reviewId:  text('reviewId').notNull().references(() => productReview.id, { onDelete: 'cascade' }),
  userId:    text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: now(),
})

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCT APPROVAL HISTORY
// ═══════════════════════════════════════════════════════════════════════════

export const productApprovalHistory = pgTable('product_approval_history', {
  id:         text('id').primaryKey(),
  productId:  text('productId').notNull().references(() => product.id, { onDelete: 'cascade' }),
  supplierId: text('supplierId').notNull().references(() => supplier.id),
  status:     text('status').notNull(),
  reason:     text('reason'),
  reviewedBy: text('reviewedBy').references(() => user.id),
  createdAt:  now(),
})

// ═══════════════════════════════════════════════════════════════════════════
// FLASH SALES
// ═══════════════════════════════════════════════════════════════════════════

export const flashSale = pgTable('flash_sale', {
  id:                text('id').primaryKey(),
  name:              text('name').notNull(),
  nameEn:            text('nameEn'),
  startsAt:          timestamp('startsAt', { withTimezone: true }).notNull(),
  endsAt:            timestamp('endsAt', { withTimezone: true }).notNull(),
  discountType:      text('discountType').notNull().default('percentage'),
  discountValue:     numeric('discountValue', { precision: 12, scale: 2 }).notNull(),
  maxDiscountAmount: numeric('maxDiscountAmount', { precision: 12, scale: 2 }),
  active:            boolean('active').notNull().default(true),
  createdBy:         text('createdBy').references(() => user.id),
  createdAt:         timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

export const flashSaleProduct = pgTable('flash_sale_product', {
  id:            text('id').primaryKey(),
  flashSaleId:   text('flashSaleId').notNull().references(() => flashSale.id, { onDelete: 'cascade' }),
  productId:     text('productId').notNull().references(() => product.id, { onDelete: 'cascade' }),
  overridePrice: numeric('overridePrice', { precision: 12, scale: 2 }),
  stockLimit:    integer('stockLimit'),
  soldCount:     integer('soldCount').notNull().default(0),
})

// ═══════════════════════════════════════════════════════════════════════════
// LOYALTY
// ═══════════════════════════════════════════════════════════════════════════

export const loyaltyAccount = pgTable('loyalty_account', {
  id:               text('id').primaryKey(),
  userId:           text('userId').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
  balance:          integer('balance').notNull().default(0),
  lifetimeEarned:   integer('lifetimeEarned').notNull().default(0),
  lifetimeRedeemed: integer('lifetimeRedeemed').notNull().default(0),
  updatedAt:        timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

export const loyaltyTransaction = pgTable('loyalty_transaction', {
  id:            text('id').primaryKey(),
  userId:        text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  orderId:       text('orderId').references(() => order.id),
  type:          text('type').notNull(), // earn | redeem | adjust
  points:        integer('points').notNull(),
  balanceBefore: integer('balanceBefore').notNull(),
  balanceAfter:  integer('balanceAfter').notNull(),
  note:          text('note'),
  createdAt:     now(),
})

// ═══════════════════════════════════════════════════════════════════════════
// REFERRALS
// ═══════════════════════════════════════════════════════════════════════════

export const referralCode = pgTable('referral_code', {
  id:         text('id').primaryKey(),
  userId:     text('userId').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
  code:       text('code').notNull().unique(),
  usageCount: integer('usageCount').notNull().default(0),
  createdAt:  timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
})

export const referral = pgTable('referral', {
  id:            text('id').primaryKey(),
  referrerId:    text('referrerId').notNull().references(() => user.id),
  refereeId:     text('refereeId').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
  code:          text('code').notNull(),
  status:        text('status').notNull().default('pending'),
  referrerBonus: integer('referrerBonus').notNull().default(0),
  refereeBonus:  integer('refereeBonus').notNull().default(0),
  rewardedAt:    timestamp('rewardedAt', { withTimezone: true }),
  createdAt:     timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
})

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const notification = pgTable('notification', {
  id:        text('id').primaryKey(),
  userId:    text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  type:      text('type').notNull(),
  title:     text('title').notNull(),
  body:      text('body').notNull(),
  link:      text('link'),
  read:      boolean('read').notNull().default(false),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
})
export type Notification = typeof notification.$inferSelect

// ═══════════════════════════════════════════════════════════════════════════
// INFERRED TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type User            = typeof user.$inferSelect
export type NewUser         = typeof user.$inferInsert
export type Category        = typeof category.$inferSelect
export type Supplier        = typeof supplier.$inferSelect
export type NewSupplier     = typeof supplier.$inferInsert
export type Product         = typeof product.$inferSelect
export type NewProduct      = typeof product.$inferInsert
export type PriceTier       = typeof priceTier.$inferSelect
export type Address         = typeof address.$inferSelect
export type Order           = typeof order.$inferSelect
export type NewOrder        = typeof order.$inferInsert
export type OrderLine       = typeof orderLine.$inferSelect
export type OrderEvent      = typeof orderEvent.$inferSelect
export type Favorite        = typeof favorite.$inferSelect
export type OrderTemplate   = typeof orderTemplate.$inferSelect
export type SupportTicket   = typeof supportTicket.$inferSelect
export type TicketMessage   = typeof ticketMessage.$inferSelect
export type KycApproval     = typeof kycApproval.$inferSelect
export type Payout          = typeof payout.$inferSelect
export type Transaction     = typeof transaction.$inferSelect
export type Driver          = typeof driver.$inferSelect
export type Country         = typeof country.$inferSelect
export type DeliveryZone    = typeof deliveryZone.$inferSelect
export type AuditLog        = typeof auditLog.$inferSelect
export type AdminCollection = typeof adminCollection.$inferSelect
export type SystemSetting   = typeof systemSetting.$inferSelect
export type ProductVariant  = typeof productVariant.$inferSelect
export type NewProductVariant = typeof productVariant.$inferInsert
export type Coupon          = typeof coupon.$inferSelect
export type CouponUsage     = typeof couponUsage.$inferSelect
export type Wallet             = typeof wallet.$inferSelect
export type NewWallet          = typeof wallet.$inferInsert
export type WalletTransaction  = typeof walletTransaction.$inferSelect
export type NewWalletTransaction = typeof walletTransaction.$inferInsert
export type WalletBonusRule    = typeof walletBonusRule.$inferSelect
export type NewWalletBonusRule = typeof walletBonusRule.$inferInsert
export type CashbackRule       = typeof cashbackRule.$inferSelect
export type NewCashbackRule    = typeof cashbackRule.$inferInsert
export type Conversation       = typeof conversation.$inferSelect
export type NewConversation    = typeof conversation.$inferInsert
export type ChatMessage        = typeof chatMessage.$inferSelect
export type NewChatMessage     = typeof chatMessage.$inferInsert
export type SeoMeta            = typeof seoMeta.$inferSelect
export type NewSeoMeta         = typeof seoMeta.$inferInsert
export type Advertisement      = typeof advertisement.$inferSelect
export type NewAdvertisement   = typeof advertisement.$inferInsert
export type SellerEarning   = typeof sellerEarning.$inferSelect
export type RefundRequest   = typeof refundRequest.$inferSelect
export type StockMovement   = typeof stockMovement.$inferSelect
export type ProductReview   = typeof productReview.$inferSelect
export type NewProductReview = typeof productReview.$inferInsert
export type ReviewReply             = typeof reviewReply.$inferSelect
export type ReviewHelpful           = typeof reviewHelpful.$inferSelect
export type ProductApprovalHistory  = typeof productApprovalHistory.$inferSelect
export type NewProductApprovalHistory = typeof productApprovalHistory.$inferInsert
export type FlashSale               = typeof flashSale.$inferSelect
export type NewFlashSale            = typeof flashSale.$inferInsert
export type FlashSaleProduct        = typeof flashSaleProduct.$inferSelect
export type LoyaltyAccount          = typeof loyaltyAccount.$inferSelect
export type LoyaltyTransaction      = typeof loyaltyTransaction.$inferSelect
export type ReferralCode            = typeof referralCode.$inferSelect
export type Referral                = typeof referral.$inferSelect
