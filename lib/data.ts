import { RETAIL_MARKUP, type Role } from './config'

export type Category = {
  slug: string
  nameAr: string
  nameEn: string
  icon: string
  parentSlug?: string
  children?: Category[]
}

/** Flat list of all categories (root + sub) */
export function flattenCategories(cats: Category[]): Category[] {
  const result: Category[] = []
  function walk(list: Category[]) {
    for (const c of list) {
      result.push(c)
      if (c.children?.length) walk(c.children)
    }
  }
  walk(cats)
  return result
}

/** Return a category by slug, searching recursively */
export function findCategory(slug: string, cats: Category[] = CATEGORIES): Category | undefined {
  for (const c of cats) {
    if (c.slug === slug) return c
    if (c.children?.length) {
      const found = findCategory(slug, c.children)
      if (found) return found
    }
  }
  return undefined
}

/** Return all descendant slugs (including self) for a category */
export function descendantSlugs(slug: string, cats: Category[] = CATEGORIES): string[] {
  const cat = findCategory(slug, cats)
  if (!cat) return [slug]
  const result: string[] = []
  function walk(c: Category) {
    result.push(c.slug)
    if (c.children?.length) c.children.forEach(walk)
  }
  walk(cat)
  return result
}

export type PriceTier = {
  minQty: number
  pricePerCarton: number // USD base
}

export type MarketConfidence = 'high' | 'medium' | 'low'

export type Supplier = {
  id: string
  nameAr: string
  nameEn: string
  verified: boolean
  rating: number
  logo: string
  descriptionAr: string
  descriptionEn: string
  cityAr: string
  cityEn: string
  since: number
  followerCount?: number
}

export type Product = {
  id: string
  nameAr: string
  nameEn: string
  categorySlug: string
  image: string
  supplierId: string
  supplierAr: string
  supplierEn: string
  verified: boolean
  unitsPerCarton: number
  moq: number // minimum order in cartons
  basePrice: number // USD per carton (best/lowest tier price)
  oldPrice?: number // USD per carton before discount
  tiers: PriceTier[]
  sold: number
  rating: number
  descriptionAr: string
  descriptionEn: string
  // --- Market price comparison (platform differentiator) ---
  marketPrice: number // avg market retail price per carton, USD
  marketSources: number // number of surveyed sources
  marketConfidence: MarketConfidence
  marketUpdatedAt: string // ISO date
}

export const CATEGORIES: Category[] = [
  {
    slug: 'food',
    nameAr: 'المواد الغذائية',
    nameEn: 'Food',
    icon: 'utensils',
    children: [
      {
        slug: 'grains',
        nameAr: 'حبوب وأرز',
        nameEn: 'Grains & Rice',
        icon: 'wheat',
        parentSlug: 'food',
        children: [
          { slug: 'rice', nameAr: 'أرز', nameEn: 'Rice', icon: 'wheat', parentSlug: 'grains' },
          { slug: 'pasta', nameAr: 'مكرونة ومعكرونة', nameEn: 'Pasta & Noodles', icon: 'wheat', parentSlug: 'grains' },
          { slug: 'flour', nameAr: 'دقيق وطحين', nameEn: 'Flour & Grain', icon: 'wheat', parentSlug: 'grains' },
        ],
      },
      {
        slug: 'meats',
        nameAr: 'لحوم ودواجن وأسماك',
        nameEn: 'Meat, Poultry & Fish',
        icon: 'beef',
        parentSlug: 'food',
        children: [
          { slug: 'chicken', nameAr: 'دجاج', nameEn: 'Chicken', icon: 'beef', parentSlug: 'meats' },
          { slug: 'redmeat', nameAr: 'لحوم حمراء', nameEn: 'Red Meat', icon: 'beef', parentSlug: 'meats' },
          { slug: 'fish', nameAr: 'أسماك ومأكولات بحرية', nameEn: 'Fish & Seafood', icon: 'fish', parentSlug: 'meats' },
        ],
      },
      {
        slug: 'canned',
        nameAr: 'معلبات',
        nameEn: 'Canned Food',
        icon: 'archive',
        parentSlug: 'food',
        children: [
          { slug: 'canned-vegetables', nameAr: 'خضروات معلبة', nameEn: 'Canned Vegetables', icon: 'archive', parentSlug: 'canned' },
          { slug: 'canned-fruits', nameAr: 'فواكه معلبة', nameEn: 'Canned Fruits', icon: 'archive', parentSlug: 'canned' },
          { slug: 'canned-fish', nameAr: 'أسماك معلبة', nameEn: 'Canned Fish', icon: 'archive', parentSlug: 'canned' },
        ],
      },
      {
        slug: 'oils',
        nameAr: 'زيوت وسمن',
        nameEn: 'Oils & Ghee',
        icon: 'droplet',
        parentSlug: 'food',
        children: [
          { slug: 'vegetable-oils', nameAr: 'زيوت نباتية', nameEn: 'Vegetable Oils', icon: 'droplet', parentSlug: 'oils' },
          { slug: 'ghee', nameAr: 'سمن وزبدة', nameEn: 'Ghee & Butter', icon: 'droplet', parentSlug: 'oils' },
        ],
      },
      {
        slug: 'dairy',
        nameAr: 'ألبان ومنتجاتها',
        nameEn: 'Dairy Products',
        icon: 'milk',
        parentSlug: 'food',
        children: [
          { slug: 'milk', nameAr: 'حليب', nameEn: 'Milk', icon: 'milk', parentSlug: 'dairy' },
          { slug: 'cheese', nameAr: 'جبن', nameEn: 'Cheese', icon: 'milk', parentSlug: 'dairy' },
          { slug: 'yogurt', nameAr: 'زبادي وكريمة', nameEn: 'Yogurt & Cream', icon: 'milk', parentSlug: 'dairy' },
        ],
      },
      {
        slug: 'sugar',
        nameAr: 'سكر ومحليات',
        nameEn: 'Sugar & Sweeteners',
        icon: 'candy',
        parentSlug: 'food',
        children: [
          { slug: 'white-sugar', nameAr: 'سكر أبيض', nameEn: 'White Sugar', icon: 'candy', parentSlug: 'sugar' },
          { slug: 'honey', nameAr: 'عسل طبيعي', nameEn: 'Natural Honey', icon: 'candy', parentSlug: 'sugar' },
        ],
      },
    ],
  },
  {
    slug: 'beverages',
    nameAr: 'مشروبات',
    nameEn: 'Beverages',
    icon: 'cup-soda',
    children: [
      { slug: 'soft-drinks', nameAr: 'مشروبات غازية', nameEn: 'Soft Drinks', icon: 'cup-soda', parentSlug: 'beverages' },
      { slug: 'juices', nameAr: 'عصائر', nameEn: 'Juices', icon: 'cup-soda', parentSlug: 'beverages' },
      { slug: 'water', nameAr: 'مياه معدنية', nameEn: 'Water', icon: 'cup-soda', parentSlug: 'beverages' },
      { slug: 'hot-drinks', nameAr: 'شاي وقهوة', nameEn: 'Tea & Coffee', icon: 'cup-soda', parentSlug: 'beverages' },
    ],
  },
  {
    slug: 'snacks',
    nameAr: 'وجبات خفيفة وحلويات',
    nameEn: 'Snacks & Sweets',
    icon: 'cookie',
    children: [
      { slug: 'chips', nameAr: 'رقائق وشيبس', nameEn: 'Chips & Crisps', icon: 'cookie', parentSlug: 'snacks' },
      { slug: 'chocolate', nameAr: 'شوكولاتة وحلوى', nameEn: 'Chocolate & Candy', icon: 'cookie', parentSlug: 'snacks' },
      { slug: 'biscuits', nameAr: 'بسكويت وكيك', nameEn: 'Biscuits & Cake', icon: 'cookie', parentSlug: 'snacks' },
    ],
  },
  {
    slug: 'cleaning',
    nameAr: 'منظفات وعناية',
    nameEn: 'Cleaning & Care',
    icon: 'spray-can',
    children: [
      { slug: 'laundry', nameAr: 'غسيل وملابس', nameEn: 'Laundry', icon: 'spray-can', parentSlug: 'cleaning' },
      { slug: 'dishwash', nameAr: 'غسيل أواني', nameEn: 'Dishwashing', icon: 'spray-can', parentSlug: 'cleaning' },
      { slug: 'floor-cleaning', nameAr: 'تنظيف أرضيات', nameEn: 'Floor Cleaning', icon: 'spray-can', parentSlug: 'cleaning' },
    ],
  },
]

export const SUPPLIERS: Supplier[] = [
  {
    id: 'al-wadi',
    nameAr: 'مجموعة الوادي للأغذية',
    nameEn: 'Al Wadi Foods Group',
    verified: true,
    rating: 4.8,
    logo: '/placeholder-logo.png',
    descriptionAr: 'مورّد رائد للحبوب والأرز الفاخر يخدم تجار الجملة منذ أكثر من عقدين.',
    descriptionEn: 'Leading supplier of premium grains and rice serving wholesalers for over two decades.',
    cityAr: 'الرياض',
    cityEn: 'Riyadh',
    since: 2001,
  },
  {
    id: 'al-nakheel',
    nameAr: 'شركة النخيل للزيوت',
    nameEn: 'Al Nakheel Oils Co.',
    verified: true,
    rating: 4.7,
    logo: '/placeholder-logo.png',
    descriptionAr: 'متخصصون في زيوت الطهي النقية والسمن بجودة تصديرية.',
    descriptionEn: 'Specialists in pure cooking oils and ghee at export-grade quality.',
    cityAr: 'جدة',
    cityEn: 'Jeddah',
    since: 2008,
  },
  {
    id: 'gulf-beverage',
    nameAr: 'موزّعو الخليج للمشروبات',
    nameEn: 'Gulf Beverage Distributors',
    verified: true,
    rating: 4.9,
    logo: '/placeholder-logo.png',
    descriptionAr: 'أكبر موزّع للمشروبات الغازية والعصائر في المنطقة.',
    descriptionEn: 'The region’s largest distributor of soft drinks and juices.',
    cityAr: 'الدمام',
    cityEn: 'Dammam',
    since: 2005,
  },
  {
    id: 'al-hasad',
    nameAr: 'مصنع الحصاد للتعليب',
    nameEn: 'Al Hasad Canning Factory',
    verified: false,
    rating: 4.5,
    logo: '/placeholder-logo.png',
    descriptionAr: 'مصنع تعليب حديث للخضار والبقوليات بصلاحية طويلة.',
    descriptionEn: 'Modern canning factory for vegetables and legumes with long shelf life.',
    cityAr: 'القاهرة',
    cityEn: 'Cairo',
    since: 2014,
  },
  {
    id: 'al-safa',
    nameAr: 'شركة الصفاء للمنظفات',
    nameEn: 'Al Safa Cleaning Co.',
    verified: true,
    rating: 4.6,
    logo: '/placeholder-logo.png',
    descriptionAr: 'منتجات تنظيف مركّزة عالية الفعالية للأسواق والمنازل.',
    descriptionEn: 'Concentrated high-efficiency cleaning products for markets and homes.',
    cityAr: 'الرياض',
    cityEn: 'Riyadh',
    since: 2010,
  },
  {
    id: 'al-thouq',
    nameAr: 'مصنع الذوق للوجبات',
    nameEn: 'Al Thouq Snacks Factory',
    verified: true,
    rating: 4.8,
    logo: '/placeholder-logo.png',
    descriptionAr: 'تشكيلة واسعة من الوجبات الخفيفة الأكثر مبيعاً في البقالات.',
    descriptionEn: 'A wide range of best-selling snacks for grocery stores.',
    cityAr: 'الكويت',
    cityEn: 'Kuwait City',
    since: 2012,
  },
  {
    id: 'green-pastures',
    nameAr: 'ألبان المراعي الخضراء',
    nameEn: 'Green Pastures Dairy',
    verified: true,
    rating: 4.7,
    logo: '/placeholder-logo.png',
    descriptionAr: 'ألبان ومنتجات حليب طويلة الأجل من مزارع موثوقة.',
    descriptionEn: 'Dairy and long-life milk products from trusted farms.',
    cityAr: 'أبوظبي',
    cityEn: 'Abu Dhabi',
    since: 2003,
  },
  {
    id: 'east-sugar',
    nameAr: 'مصفاة الشرق للسكر',
    nameEn: 'East Sugar Refinery',
    verified: false,
    rating: 4.6,
    logo: '/placeholder-logo.png',
    descriptionAr: 'سكر أبيض مكرر ومحليات بأسعار تنافسية للجملة.',
    descriptionEn: 'Refined white sugar and sweeteners at competitive wholesale prices.',
    cityAr: 'القاهرة',
    cityEn: 'Cairo',
    since: 2016,
  },
]

export const PRODUCTS: Product[] = [
  {
    id: 'rice-basmati',
    nameAr: 'أرز بسمتي فاخر - كيس 5 كجم',
    nameEn: 'Premium Basmati Rice - 5kg Sack',
    categorySlug: 'grains',
    image: '/products/rice-sack.png',
    supplierId: 'al-wadi',
    supplierAr: 'مجموعة الوادي للأغذية',
    supplierEn: 'Al Wadi Foods Group',
    verified: true,
    unitsPerCarton: 4,
    moq: 5,
    basePrice: 38,
    oldPrice: 46,
    tiers: [
      { minQty: 5, pricePerCarton: 42 },
      { minQty: 20, pricePerCarton: 40 },
      { minQty: 50, pricePerCarton: 38 },
    ],
    sold: 3200,
    rating: 4.8,
    descriptionAr:
      'أرز بسمتي هندي فاخر طويل الحبة، معبأ في أكياس 5 كجم، الكرتون يحتوي على 4 أكياس. مثالي لتجار التجزئة والمطاعم.',
    descriptionEn:
      'Premium long-grain Indian basmati rice, packed in 5kg sacks, 4 sacks per carton. Ideal for retailers and restaurants.',
    marketPrice: 49,
    marketSources: 14,
    marketConfidence: 'high',
    marketUpdatedAt: '2026-06-30',
  },
  {
    id: 'sunflower-oil',
    nameAr: 'زيت دوار الشمس - 1.5 لتر',
    nameEn: 'Sunflower Cooking Oil - 1.5L',
    categorySlug: 'oils',
    image: '/products/cooking-oil.png',
    supplierId: 'al-nakheel',
    supplierAr: 'شركة النخيل للزيوت',
    supplierEn: 'Al Nakheel Oils Co.',
    verified: true,
    unitsPerCarton: 12,
    moq: 10,
    basePrice: 24,
    oldPrice: 29,
    tiers: [
      { minQty: 10, pricePerCarton: 27 },
      { minQty: 30, pricePerCarton: 25.5 },
      { minQty: 80, pricePerCarton: 24 },
    ],
    sold: 5400,
    rating: 4.7,
    descriptionAr:
      'زيت دوار الشمس النقي 100%، عبوة 1.5 لتر، الكرتون يحتوي على 12 عبوة. مناسب للقلي والطهي اليومي.',
    descriptionEn:
      '100% pure sunflower oil, 1.5L bottles, 12 bottles per carton. Perfect for frying and daily cooking.',
    marketPrice: 31,
    marketSources: 18,
    marketConfidence: 'high',
    marketUpdatedAt: '2026-07-01',
  },
  {
    id: 'soft-drinks',
    nameAr: 'مشروبات غازية متنوعة - 24 علبة',
    nameEn: 'Assorted Soft Drinks - 24 Cans',
    categorySlug: 'beverages',
    image: '/products/soft-drinks.png',
    supplierId: 'gulf-beverage',
    supplierAr: 'موزّعو الخليج للمشروبات',
    supplierEn: 'Gulf Beverage Distributors',
    verified: true,
    unitsPerCarton: 24,
    moq: 8,
    basePrice: 9.5,
    oldPrice: 12,
    tiers: [
      { minQty: 8, pricePerCarton: 11 },
      { minQty: 25, pricePerCarton: 10 },
      { minQty: 60, pricePerCarton: 9.5 },
    ],
    sold: 12400,
    rating: 4.9,
    descriptionAr:
      'تشكيلة مشروبات غازية منعشة، 24 علبة 330 مل في الكرتون. من العلامات الأكثر مبيعاً.',
    descriptionEn:
      'Refreshing assorted soft drinks, 24 x 330ml cans per carton. Best-selling brands.',
    marketPrice: 13.5,
    marketSources: 21,
    marketConfidence: 'high',
    marketUpdatedAt: '2026-07-02',
  },
  {
    id: 'canned-tomatoes',
    nameAr: 'طماطم معلبة - 24 علبة',
    nameEn: 'Canned Tomatoes - 24 Cans',
    categorySlug: 'canned',
    image: '/products/canned-goods.png',
    supplierId: 'al-hasad',
    supplierAr: 'مصنع الحصاد للتعليب',
    supplierEn: 'Al Hasad Canning Factory',
    verified: false,
    unitsPerCarton: 24,
    moq: 6,
    basePrice: 13,
    tiers: [
      { minQty: 6, pricePerCarton: 15 },
      { minQty: 20, pricePerCarton: 14 },
      { minQty: 50, pricePerCarton: 13 },
    ],
    sold: 2100,
    rating: 4.5,
    descriptionAr:
      'طماطم مقشرة معلبة، 24 علبة 400 جرام في الكرتون. جودة عالية وصلاحية طويلة.',
    descriptionEn:
      'Peeled canned tomatoes, 24 x 400g cans per carton. High quality with long shelf life.',
    marketPrice: 16,
    marketSources: 9,
    marketConfidence: 'medium',
    marketUpdatedAt: '2026-06-27',
  },
  {
    id: 'laundry-detergent',
    nameAr: 'مسحوق غسيل - 5 كجم',
    nameEn: 'Laundry Detergent - 5kg',
    categorySlug: 'cleaning',
    image: '/products/detergent.png',
    supplierId: 'al-safa',
    supplierAr: 'شركة الصفاء للمنظفات',
    supplierEn: 'Al Safa Cleaning Co.',
    verified: true,
    unitsPerCarton: 4,
    moq: 5,
    basePrice: 28,
    oldPrice: 34,
    tiers: [
      { minQty: 5, pricePerCarton: 32 },
      { minQty: 20, pricePerCarton: 30 },
      { minQty: 50, pricePerCarton: 28 },
    ],
    sold: 1850,
    rating: 4.6,
    descriptionAr:
      'مسحوق غسيل مركّز عالي الفعالية، عبوة 5 كجم، 4 عبوات في الكرتون.',
    descriptionEn:
      'Concentrated high-efficiency laundry powder, 5kg packs, 4 packs per carton.',
    marketPrice: 37,
    marketSources: 12,
    marketConfidence: 'high',
    marketUpdatedAt: '2026-06-29',
  },
  {
    id: 'chips-snacks',
    nameAr: 'رقائق بطاطس متنوعة - 30 كيس',
    nameEn: 'Assorted Potato Chips - 30 Bags',
    categorySlug: 'snacks',
    image: '/products/snacks.png',
    supplierId: 'al-thouq',
    supplierAr: 'مصنع الذوق للوجبات',
    supplierEn: 'Al Thouq Snacks Factory',
    verified: true,
    unitsPerCarton: 30,
    moq: 10,
    basePrice: 7,
    oldPrice: 9,
    tiers: [
      { minQty: 10, pricePerCarton: 8.5 },
      { minQty: 30, pricePerCarton: 7.5 },
      { minQty: 70, pricePerCarton: 7 },
    ],
    sold: 8700,
    rating: 4.8,
    descriptionAr:
      'تشكيلة رقائق بطاطس بنكهات متعددة، 30 كيس في الكرتون. الأكثر طلباً في البقالات.',
    descriptionEn:
      'Assorted flavored potato chips, 30 bags per carton. Top seller in grocery stores.',
    marketPrice: 9.8,
    marketSources: 16,
    marketConfidence: 'high',
    marketUpdatedAt: '2026-07-01',
  },
  {
    id: 'uht-milk',
    nameAr: 'حليب طويل الأجل - 12 علبة',
    nameEn: 'Long-life UHT Milk - 12 Boxes',
    categorySlug: 'dairy',
    image: '/products/milk.png',
    supplierId: 'green-pastures',
    supplierAr: 'ألبان المراعي الخضراء',
    supplierEn: 'Green Pastures Dairy',
    verified: true,
    unitsPerCarton: 12,
    moq: 8,
    basePrice: 15,
    oldPrice: 18,
    tiers: [
      { minQty: 8, pricePerCarton: 17 },
      { minQty: 25, pricePerCarton: 16 },
      { minQty: 60, pricePerCarton: 15 },
    ],
    sold: 6300,
    rating: 4.7,
    descriptionAr:
      'حليب كامل الدسم طويل الأجل، 12 علبة 1 لتر في الكرتون. صلاحية تصل إلى 6 أشهر.',
    descriptionEn:
      'Full-cream long-life milk, 12 x 1L boxes per carton. Shelf life up to 6 months.',
    marketPrice: 19.5,
    marketSources: 15,
    marketConfidence: 'high',
    marketUpdatedAt: '2026-06-28',
  },
  {
    id: 'white-sugar',
    nameAr: 'سكر أبيض ناعم - كيس 1 كجم',
    nameEn: 'Fine White Sugar - 1kg Bag',
    categorySlug: 'sugar',
    image: '/products/sugar.png',
    supplierId: 'east-sugar',
    supplierAr: 'مصفاة الشرق للسكر',
    supplierEn: 'East Sugar Refinery',
    verified: false,
    unitsPerCarton: 20,
    moq: 5,
    basePrice: 18,
    tiers: [
      { minQty: 5, pricePerCarton: 20 },
      { minQty: 20, pricePerCarton: 19 },
      { minQty: 50, pricePerCarton: 18 },
    ],
    sold: 4100,
    rating: 4.6,
    descriptionAr:
      'سكر أبيض ناعم مكرر، كيس 1 كجم، 20 كيس في الكرتون.',
    descriptionEn:
      'Refined fine white sugar, 1kg bags, 20 bags per carton.',
    marketPrice: 21,
    marketSources: 8,
    marketConfidence: 'low',
    marketUpdatedAt: '2026-06-24',
  },
]

export function getProduct(id: string) {
  return PRODUCTS.find((p) => p.id === id)
}

export function getSupplier(id: string) {
  return SUPPLIERS.find((s) => s.id === id)
}

export function productsBySupplier(id: string) {
  return PRODUCTS.filter((p) => p.supplierId === id)
}

export function productsByCategory(slug: string) {
  const slugs = descendantSlugs(slug)
  return PRODUCTS.filter((p) => slugs.includes(p.categorySlug))
}

/** Returns the applicable per-carton wholesale price (USD) for a quantity of cartons. */
export function priceForQty(product: Product, qty: number): number {
  if (!product.tiers.length) return product.basePrice
  let price = product.tiers[0].pricePerCarton
  for (const tier of product.tiers) {
    if (qty >= tier.minQty) price = tier.pricePerCarton
  }
  return price
}

/** Retail (B2C) price per carton (USD) — shown to guests and consumers. */
export function retailPriceUsd(product: Product): number {
  return Math.round(product.basePrice * RETAIL_MARKUP)
}

/** Effective per-carton price for a role: merchants get tiered wholesale, others retail. */
export function priceForRole(product: Product, qty: number, role: Role): number {
  return role === 'merchant' ? priceForQty(product, qty) : retailPriceUsd(product)
}

/** The tier the given quantity currently qualifies for, or null if no tiers defined. */
export function activeTier(product: Product, qty: number): PriceTier | null {
  if (!product.tiers.length) return null
  let active = product.tiers[0]
  for (const tier of product.tiers) {
    if (qty >= tier.minQty) active = tier
  }
  return active
}

/** The next cheaper tier a merchant could unlock, or null if already at the best. */
export function nextTier(product: Product, qty: number): PriceTier | null {
  const upcoming = product.tiers.filter((tier) => tier.minQty > qty)
  return upcoming.length ? upcoming[0] : null
}

/** Whether the platform's best price beats the surveyed market average. */
export function isCheaperThanMarket(product: Product): boolean {
  return product.basePrice < product.marketPrice
}

/** Savings percentage of the best platform price vs. the market average (>= 0). */
export function marketSavingsPct(product: Product): number {
  if (product.marketPrice <= 0) return 0
  return Math.max(0, Math.round((1 - product.basePrice / product.marketPrice) * 100))
}

/** Absolute savings (USD) vs. market for a given price and quantity. */
export function marketSavingsUsd(marketPrice: number, price: number, qty: number): number {
  return Math.max(0, (marketPrice - price) * qty)
}

/** Min/max wholesale price across all products in a list (USD), for range filters. */
export function priceRangeUsd(products: Product[]): [number, number] {
  if (!products.length) return [0, 0]
  let min = products[0].basePrice
  let max = products[0].basePrice
  for (const p of products) {
    if (p.basePrice < min) min = p.basePrice
    if (p.basePrice > max) max = p.basePrice
  }
  return [Math.floor(min), Math.ceil(max)]
}

/**
 * Deterministic 30-day market price history (USD) for the sparkline demo.
 * Seeded by product id so it stays stable across renders and SSR/CSR.
 */
export function marketHistory(product: Product): number[] {
  let seed = 0
  for (const ch of product.id) seed = (seed * 31 + ch.charCodeAt(0)) % 100000
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
  const points: number[] = []
  let value = product.marketPrice * 0.94
  for (let i = 0; i < 30; i++) {
    value += (rand() - 0.45) * product.marketPrice * 0.03
    value = Math.min(product.marketPrice * 1.06, Math.max(product.marketPrice * 0.88, value))
    points.push(Number(value.toFixed(2)))
  }
  points[points.length - 1] = product.marketPrice
  return points
}
