'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { BRAND, CURRENCY_CONFIG, type CurrencyCode } from './config'

export type Lang = 'ar' | 'en'
export type { CurrencyCode }

export type Country = {
  code: string
  currency: CurrencyCode
  nameAr: string
  nameEn: string
  flag: string
}

export const COUNTRIES: Country[] = [
  { code: 'SA', currency: 'SAR', nameAr: 'السعودية', nameEn: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'AE', currency: 'AED', nameAr: 'الإمارات', nameEn: 'UAE', flag: '🇦🇪' },
  { code: 'KW', currency: 'KWD', nameAr: 'الكويت', nameEn: 'Kuwait', flag: '🇰🇼' },
  { code: 'EG', currency: 'EGP', nameAr: 'مصر', nameEn: 'Egypt', flag: '🇪🇬' },
  { code: 'US', currency: 'USD', nameAr: 'الولايات المتحدة', nameEn: 'United States', flag: '🇺🇸' },
]

type Dict = Record<string, { ar: string; en: string }>

const DICT = {
  tagline: { ar: 'منصة تجارة الجملة رقم 1', en: 'The #1 Wholesale Marketplace' },
  searchPlaceholder: {
    ar: 'ابحث عن منتجات، موردين، تصنيفات...',
    en: 'Search products, suppliers, categories...',
  },
  search: { ar: 'بحث', en: 'Search' },
  login: { ar: 'تسجيل الدخول', en: 'Log in' },
  signup: { ar: 'إنشاء حساب', en: 'Sign up' },
  becomeSupplier: { ar: 'انضم كمورد', en: 'Become a Supplier' },
  cart: { ar: 'السلة', en: 'Cart' },
  account: { ar: 'حسابي', en: 'Account' },
  categories: { ar: 'التصنيفات', en: 'Categories' },
  allCategories: { ar: 'كل التصنيفات', en: 'All Categories' },
  language: { ar: 'اللغة', en: 'Language' },
  country: { ar: 'الدولة والعملة', en: 'Country & Currency' },
  heroTitle: { ar: 'اشترِ بالجملة، وفّر أكثر', en: 'Buy Wholesale, Save More' },
  heroSubtitle: {
    ar: 'قارن أسعار الجملة بمتوسط السوق واشترِ من موردين موثوقين بأفضل الأسعار',
    en: 'Compare wholesale prices to the market average and buy from verified suppliers',
  },
  shopNow: { ar: 'تسوّق الآن', en: 'Shop Now' },
  exploreDeals: { ar: 'اكتشف العروض', en: 'Explore Deals' },
  flashDeals: { ar: 'عروض الجملة', en: 'Wholesale Deals' },
  endsIn: { ar: 'ينتهي خلال', en: 'Ends in' },
  seeAll: { ar: 'عرض الكل', en: 'See all' },
  topSuppliers: { ar: 'موردون مميزون', en: 'Top Suppliers' },
  recommended: { ar: 'مختارة لك', en: 'Recommended for you' },
  perCarton: { ar: 'للكرتون', en: 'per carton' },
  perUnit: { ar: 'للوحدة', en: 'per unit' },
  moq: { ar: 'أقل كمية', en: 'Min. order' },
  cartons: { ar: 'كرتون', en: 'cartons' },
  carton: { ar: 'كرتون', en: 'carton' },
  unitsPerCarton: { ar: 'وحدة/كرتون', en: 'units/carton' },
  addToCart: { ar: 'أضف للسلة', en: 'Add to cart' },
  added: { ar: 'تمت الإضافة', en: 'Added' },
  inStock: { ar: 'متوفر', en: 'In stock' },
  verified: { ar: 'مورد موثّق', en: 'Verified' },
  sold: { ar: 'مبيع', en: 'sold' },
  tieredPricing: { ar: 'أسعار متدرجة حسب الكمية', en: 'Tiered pricing by quantity' },
  quantity: { ar: 'الكمية', en: 'Quantity' },
  save: { ar: 'وفّر', en: 'Save' },
  subtotal: { ar: 'الإجمالي الفرعي', en: 'Subtotal' },
  shipping: { ar: 'الشحن', en: 'Shipping' },
  total: { ar: 'الإجمالي', en: 'Total' },
  checkout: { ar: 'إتمام الطلب', en: 'Checkout' },
  emptyCart: { ar: 'سلة التسوق فارغة', en: 'Your cart is empty' },
  emptyCartDesc: {
    ar: 'ابدأ بإضافة منتجات الجملة إلى سلتك',
    en: 'Start adding wholesale products to your cart',
  },
  continueShopping: { ar: 'مواصلة التسوق', en: 'Continue shopping' },
  remove: { ar: 'إزالة', en: 'Remove' },
  freeShipping: { ar: 'شحن مجاني', en: 'Free shipping' },
  orderProtection: { ar: 'حماية الطلب', en: 'Order protection' },
  fastDelivery: { ar: 'توصيل سريع', en: 'Fast delivery' },
  securePayment: { ar: 'دفع آمن', en: 'Secure payment' },
  description: { ar: 'الوصف', en: 'Description' },
  supplier: { ar: 'المورّد', en: 'Supplier' },
  backToHome: { ar: 'العودة للرئيسية', en: 'Back to home' },
  items: { ar: 'منتجات', en: 'items' },
  each: { ar: 'للكرتون', en: 'each' },
  footerAbout: {
    ar: 'منصة تربط تجار الجملة بالبائعين من سوبرماركت وبقالات، وتقارن الأسعار بمتوسط السوق في عدة دول.',
    en: 'A marketplace connecting wholesalers with retailers, benchmarking prices against the market average across several countries.',
  },
  company: { ar: 'الشركة', en: 'Company' },
  support: { ar: 'الدعم', en: 'Support' },
  forBusiness: { ar: 'للأعمال', en: 'For Business' },
  aboutUs: { ar: 'من نحن', en: 'About us' },
  careers: { ar: 'الوظائف', en: 'Careers' },
  contact: { ar: 'تواصل معنا', en: 'Contact' },
  helpCenter: { ar: 'مركز المساعدة', en: 'Help center' },
  shipping2: { ar: 'الشحن والتوصيل', en: 'Shipping & delivery' },
  returns: { ar: 'الإرجاع', en: 'Returns' },
  sellWithUs: { ar: 'بِع معنا', en: 'Sell with us' },
  deliveryPartner: { ar: 'كن شريك توصيل', en: 'Delivery partner' },
  pricing: { ar: 'الأسعار', en: 'Pricing' },
  rights: { ar: 'جميع الحقوق محفوظة', en: 'All rights reserved' },
  viewProduct: { ar: 'عرض المنتج', en: 'View product' },
  minOrderNote: { ar: 'الحد الأدنى للطلب', en: 'Minimum order' },

  // --- Roles ---
  viewingAs: { ar: 'تتصفح كـ', en: 'Viewing as' },
  roleGuest: { ar: 'زائر', en: 'Guest' },
  roleConsumer: { ar: 'مستهلك', en: 'Consumer' },
  roleMerchant: { ar: 'تاجر موثّق', en: 'Verified merchant' },
  retailPrice: { ar: 'سعر التجزئة', en: 'Retail price' },
  registerAsMerchant: {
    ar: 'سجّل كتاجر لتشاهد أسعار الجملة',
    en: 'Register as a merchant to see wholesale prices',
  },
  wholesaleForMerchants: {
    ar: 'أسعار الجملة متاحة للتجار الموثّقين',
    en: 'Wholesale pricing is available to verified merchants',
  },

  // --- Market price comparison ---
  cheaperThanMarket: { ar: 'أوفر من السوق بـ', en: 'Cheaper than market by' },
  marketIndicator: { ar: 'مؤشر السوق', en: 'Market Indicator' },
  marketAvg: { ar: 'متوسط السوق', en: 'Market average' },
  platformPrice: { ar: 'سعر المنصة', en: 'Our price' },
  marketSources: { ar: 'مصدر', en: 'sources' },
  dataConfidence: { ar: 'دقة البيانات', en: 'Data confidence' },
  confidenceHigh: { ar: 'عالية', en: 'High' },
  confidenceMedium: { ar: 'متوسطة', en: 'Medium' },
  confidenceLow: { ar: 'منخفضة', en: 'Low' },
  lastUpdated: { ar: 'آخر تحديث', en: 'Updated' },
  last30Days: { ar: 'اتجاه السوق (آخر 30 يوماً)', en: 'Market trend (last 30 days)' },
  premiumLock: { ar: 'حصري لمشتركي البريميوم', en: 'Exclusive to Premium members' },
  unlockPremium: { ar: 'اشترك في البريميوم', en: 'Unlock Premium' },
  savedVsMarket: { ar: 'وفّرت مقابل متوسط السوق', en: 'saved vs. market average' },
  belowMarket: { ar: 'أقل من السوق', en: 'below market' },

  // --- Tier UX ---
  addMoreForTier: { ar: 'أضف', en: 'Add' },
  extraCartonsToSave: { ar: 'كرتون إضافية لتوفّر', en: 'more cartons to save' },
  currentTier: { ar: 'شريحتك الحالية', en: 'Your current tier' },

  // --- Home / sections ---
  mostSavings: { ar: 'الأكثر توفيراً مقابل السوق', en: 'Biggest savings vs. market' },
  mostSavingsDesc: {
    ar: 'منتجات بأكبر فارق سعري مقارنة بمتوسط السوق',
    en: 'Products with the largest gap below the market average',
  },

  // --- Filters / category ---
  filters: { ar: 'التصفية', en: 'Filters' },
  sortBy: { ar: 'ترتيب حسب', en: 'Sort by' },
  sortSavings: { ar: 'الأعلى توفيراً', en: 'Most savings' },
  sortPriceLow: { ar: 'السعر: الأقل أولاً', en: 'Price: low to high' },
  sortPriceHigh: { ar: 'السعر: الأعلى أولاً', en: 'Price: high to low' },
  sortRating: { ar: 'الأعلى تقييماً', en: 'Top rated' },
  sortSold: { ar: 'الأكثر مبيعاً', en: 'Best selling' },
  allSuppliers: { ar: 'كل الموردين', en: 'All suppliers' },
  priceRange: { ar: 'نطاق السعر', en: 'Price range' },
  clearFilters: { ar: 'مسح التصفية', en: 'Clear filters' },
  results: { ar: 'نتيجة', en: 'results' },
  noResults: { ar: 'لا توجد منتجات مطابقة', en: 'No matching products' },
  noResultsDesc: {
    ar: 'جرّب تعديل التصفية أو البحث بكلمات أخرى',
    en: 'Try adjusting your filters or search terms',
  },

  // --- Search suggestions ---
  suggestProducts: { ar: 'منتجات', en: 'Products' },
  suggestCategories: { ar: 'تصنيفات', en: 'Categories' },
  noSuggestions: { ar: 'لا توجد اقتراحات', en: 'No suggestions' },

  // --- Supplier profile ---
  memberSince: { ar: 'عضو منذ', en: 'Member since' },
  location: { ar: 'الموقع', en: 'Location' },
  productsCount: { ar: 'المنتجات', en: 'Products' },
  viewSupplier: { ar: 'عرض المورّد', en: 'View supplier' },
  supplierProducts: { ar: 'منتجات المورّد', en: 'Supplier products' },
  yearsActive: { ar: 'سنوات النشاط', en: 'Years active' },
  years: { ar: 'سنة', en: 'years' },
  rating: { ar: 'التقييم', en: 'Rating' },

  // --- Async states ---
  errorTitle: { ar: 'حدث خطأ ما', en: 'Something went wrong' },
  errorDesc: {
    ar: 'تعذّر تحميل البيانات. تحقّق من اتصالك وحاول مرة أخرى.',
    en: 'We could not load this data. Check your connection and try again.',
  },
  retry: { ar: 'إعادة المحاولة', en: 'Retry' },
  loading: { ar: '��ارٍ ال��حميل...', en: 'Loading...' },
  notFound: { ar: 'غير موجود', en: 'Not found' },
  page: { ar: 'صفحة', en: 'Page' },
  prev: { ar: 'السابق', en: 'Previous' },
  next: { ar: 'التالي', en: 'Next' },
  brand: { ar: 'العلامة التجارية', en: 'Brand' },
  apply: { ar: 'تطبيق', en: 'Apply' },
  close: { ar: 'إغلاق', en: 'Close' },

  // --- Filters extra ---
  showFilters: { ar: 'عرض التصفية', en: 'Show filters' },
  allBrands: { ar: 'كل العلامات', en: 'All brands' },
  min: { ar: 'من', en: 'Min' },
  max: { ar: 'إلى', en: 'Max' },

  // --- Search page ---
  searchResultsFor: { ar: 'نتائج البحث عن', en: 'Search results for' },
  searchPrompt: { ar: 'ابحث عن منتجات', en: 'Search products' },
  searchPromptDesc: {
    ar: 'اكتب اسم منتج أو مورد أو تصنيف في شريط البحث بالأعلى',
    en: 'Type a product, supplier, or category in the search bar above',
  },
  noSearchResults: { ar: 'لا توجد نتائج', en: 'No results found' },
  noSearchResultsDesc: {
    ar: 'لم نعثر على منتجات تطابق بحثك. جرّب كلمات مختلفة.',
    en: 'We could not find products matching your search. Try different keywords.',
  },

  // --- Checkout ---
  checkoutTitle: { ar: 'إتمام الطلب', en: 'Checkout' },
  stepAddress: { ar: 'العنوان', en: 'Address' },
  stepDelivery: { ar: 'التوصيل', en: 'Delivery' },
  stepPayment: { ar: 'الدفع والمراجعة', en: 'Payment & review' },
  savedAddresses: { ar: 'العناوين المحفوظة', en: 'Saved addresses' },
  addNewAddress: { ar: 'إضافة عنوان جديد', en: 'Add new address' },
  deliverTo: { ar: 'التوصيل إلى', en: 'Deliver to' },
  selectSlot: { ar: 'اختر موعد التوصيل', en: 'Select a delivery slot' },
  deliverySlot: { ar: 'موعد التوصيل', en: 'Delivery slot' },
  today: { ar: 'اليوم', en: 'Today' },
  tomorrow: { ar: 'غداً', en: 'Tomorrow' },
  morning: { ar: '9 ص - 12 م', en: '9 AM - 12 PM' },
  afternoon: { ar: '12 م - 4 م', en: '12 PM - 4 PM' },
  evening: { ar: '4 م - 8 م', en: '4 PM - 8 PM' },
  paymentMethod: { ar: 'طريقة الدفع', en: 'Payment method' },
  cod: { ar: 'الدفع عند الاستلام', en: 'Cash on delivery' },
  card: { ar: 'بطاقة ائتمان', en: 'Credit card' },
  bank: { ar: 'تحويل بنكي', en: 'Bank transfer' },
  cardName: { ar: 'الاسم على البطاقة', en: 'Name on card' },
  cardNumber: { ar: 'رقم البطاقة', en: 'Card number' },
  cardExpiry: { ar: 'تاريخ الانتهاء', en: 'Expiry' },
  cardCvc: { ar: 'الرمز', en: 'CVC' },
  bankNote: {
    ar: 'ستصلك تفاصيل الحساب البنكي بعد تأكيد الطلب.',
    en: 'Bank account details will be sent after you confirm the order.',
  },
  orderSummary: { ar: 'ملخص الطلب', en: 'Order summary' },
  reviewOrder: { ar: 'مراجعة الطلب', en: 'Review your order' },
  placeOrder: { ar: 'تأكيد الطلب', en: 'Place order' },
  back: { ar: 'رجوع', en: 'Back' },
  continue: { ar: 'متابعة', en: 'Continue' },
  orderPlacedTitle: { ar: 'تم تأكيد طلبك!', en: 'Order confirmed!' },
  orderPlacedDesc: {
    ar: 'سيتواصل معك المورد لتأكيد التفاصيل والتوصيل.',
    en: 'The supplier will contact you to confirm details and delivery.',
  },
  viewOrder: { ar: 'عرض الطلب', en: 'View order' },
  emptyCheckout: { ar: 'لا يمكن إتمام طلب فارغ', en: 'Cannot checkout an empty cart' },

  // --- Orders ---
  myOrders: { ar: 'طلباتي', en: 'My orders' },
  orders: { ar: 'الطلبات', en: 'Orders' },
  orderRef: { ar: 'رقم الطلب', en: 'Order' },
  orderDate: { ar: 'تاريخ الطلب', en: 'Order date' },
  orderStatus: { ar: 'الحالة', en: 'Status' },
  noOrders: { ar: 'لا توجد طلبات بعد', en: 'No orders yet' },
  noOrdersDesc: {
    ar: 'عند إتمام أول طلب سيظهر هنا مع إمكانية تتبّعه.',
    en: 'Once you place your first order it will appear here with live tracking.',
  },
  trackOrder: { ar: 'تتبّع الطلب', en: 'Track order' },
  orderDetails: { ar: 'تفاصيل الطلب', en: 'Order details' },
  statusTimeline: { ar: 'مسار الطلب', en: 'Order timeline' },
  liveTracking: { ar: 'التتبّع المباشر', en: 'Live tracking' },
  trackingNote: {
    ar: 'يتم تحديث موقع المندوب لحظياً عند خروج الطلب للتوصيل.',
    en: 'The driver location updates in real time once your order is out for delivery.',
  },
  reorder: { ar: 'إعادة الطلب', en: 'Reorder' },
  cancelOrder: { ar: 'إلغاء الطلب', en: 'Cancel order' },
  cancelOrderConfirm: { ar: 'إلغاء هذا الطلب؟', en: 'Cancel this order?' },
  cancelOrderConfirmDesc: {
    ar: 'لا يمكن التراجع عن هذا الإجراء. سيتم إلغاء الطلب نهائياً.',
    en: 'This action cannot be undone. The order will be permanently cancelled.',
  },
  orderItems: { ar: 'منتجات الطلب', en: 'Order items' },
  estimatedDelivery: { ar: 'التوصيل المتوقّع', en: 'Estimated delivery' },
  startShopping: { ar: 'ابدأ التسوّق', en: 'Start shopping' },
  free: { ar: 'مجاني', en: 'Free' },
  marketSavings: { ar: 'وفّرت مقابل السوق', en: 'Market savings' },
  statusPending: { ar: 'قيد الانتظار', en: 'Pending' },
  statusConfirmed: { ar: 'مؤكّد', en: 'Confirmed' },
  statusProcessing: { ar: 'قيد التجهيز', en: 'Processing' },
  statusPacked: { ar: 'تم التغليف', en: 'Packed' },
  statusShipped: { ar: 'تم الشحن', en: 'Shipped' },
  statusOutForDelivery: { ar: 'خرج للتوصيل', en: 'Out for delivery' },
  statusDelivered: { ar: 'تم التسليم', en: 'Delivered' },
  statusCancelled: { ar: 'ملغى', en: 'Cancelled' },

  // --- Auth ---
  welcomeToBrand: { ar: 'مرحباً بك في', en: 'Welcome to' },
  authSubtitle: {
    ar: 'سجّل الدخول أو أنشئ حساباً بالهاتف للبدء',
    en: 'Log in or create an account with your phone to get started',
  },
  phoneNumber: { ar: 'رقم الهاتف', en: 'Phone number' },
  phonePlaceholder: { ar: '5X XXX XXXX', en: '5X XXX XXXX' },
  sendOtp: { ar: 'إرسال رمز التحقق', en: 'Send code' },
  enterOtp: { ar: 'أدخل رمز التحقق', en: 'Enter verification code' },
  otpSentTo: { ar: 'أرسلنا رمزاً مكوّناً من 6 أرقام إلى', en: 'We sent a 6-digit code to' },
  resendOtp: { ar: 'إعادة الإرسال', en: 'Resend code' },
  resendIn: { ar: 'إعادة الإرسال خلال', en: 'Resend in' },
  seconds: { ar: 'ثانية', en: 's' },
  verify: { ar: 'تحقّق', en: 'Verify' },
  changePhone: { ar: 'تغيير الرقم', en: 'Change number' },
  invalidOtp: { ar: 'رمز غير صحيح، أدخل 6 أرقام', en: 'Invalid code, enter 6 digits' },
  chooseAccountType: { ar: 'اختر نوع الحساب', en: 'Choose account type' },
  consumerRegister: { ar: 'حساب مستهلك', en: 'Consumer account' },
  consumerRegisterDesc: {
    ar: 'تسجيل سريع لتصفّح المنتجات والشراء بأسعار التجزئة',
    en: 'Quick sign-up to browse and buy at retail prices',
  },
  merchantRegister: { ar: 'حساب تاجر', en: 'Merchant account' },
  merchantRegisterDesc: {
    ar: 'توثيق تجاري لفتح أسعار الجملة المتدرّجة',
    en: 'Business verification to unlock tiered wholesale pricing',
  },
  fullName: { ar: 'الاسم الكامل', en: 'Full name' },
  businessName: { ar: 'اسم النشاط التجاري', en: 'Business name' },
  crNumber: { ar: 'رقم السجل التجاري', en: 'CR number' },
  vatNumber: { ar: 'الرقم الضريبي', en: 'VAT number' },
  uploadVatDoc: { ar: 'إرفاق شهادة ضريبة القيمة المضافة', en: 'Upload VAT certificate' },
  fileSelected: { ar: 'تم اختيار الملف', en: 'File selected' },
  createAccount: { ar: 'إنشاء الحساب', en: 'Create account' },
  kycNote: {
    ar: 'تتم مراجعة بيانات التوثيق خلال 24 ساعة عادةً.',
    en: 'Verification details are typically reviewed within 24 hours.',
  },
  quickRegister: { ar: 'تسجيل سريع', en: 'Quick register' },

  // --- Account ---
  myAccount: { ar: 'حسابي', en: 'My account' },
  profile: { ar: 'الملف الشخصي', en: 'Profile' },
  addresses: { ar: 'العناوين', en: 'Addresses' },
  branches: { ar: 'الفروع', en: 'Branches' },
  favorites: { ar: 'المفضلة', en: 'Favorites' },
  reorderTemplates: { ar: 'قوالب إعادة الطلب', en: 'Reorder templates' },
  editProfile: { ar: 'تعديل الملف', en: 'Edit profile' },
  saveChanges: { ar: 'حفظ التغييرات', en: 'Save changes' },
  cancel: { ar: 'إلغاء', en: 'Cancel' },
  name: { ar: 'الاسم', en: 'Name' },
  email: { ar: 'البريد الإلكتروني', en: 'Email' },
  accountType: { ar: 'نوع الحساب', en: 'Account type' },
  defaultLabel: { ar: 'افتراضي', en: 'Default' },
  deleteAddress: { ar: 'حذف العنوان', en: 'Delete address' },
  deleteAddressConfirm: { ar: 'حذف هذا ال��نوان؟', en: 'Delete this address?' },
  deleteAddressConfirmDesc: {
    ar: 'سيتم حذف العنوان نهائياً من حسابك.',
    en: 'This address will be permanently removed from your account.',
  },
  addAddress: { ar: 'إضافة عنوان', en: 'Add address' },
  addressLabel: { ar: 'اسم العنوان', en: 'Address label' },
  addressLine: { ar: 'العنوان التفصيلي', en: 'Street address' },
  city: { ar: 'المدينة', en: 'City' },
  noFavorites: { ar: 'لا توجد منتجات مفضّلة', en: 'No favorites yet' },
  noFavoritesDesc: {
    ar: 'أضف منتجاتك المفضّلة للوصول إليها بسرعة لاحقاً.',
    en: 'Save products you love to find them quickly later.',
  },
  manager: { ar: 'المسؤول', en: 'Manager' },
  useTemplate: { ar: 'استخدام القالب', en: 'Use template' },
  addAllToCart: { ar: 'إضافة الكل للسلة', en: 'Add all to cart' },
  logout: { ar: 'تسجيل الخروج', en: 'Log out' },
  templateItems: { ar: 'منتجات', en: 'items' },
  manageAccount: { ar: 'إدارة حسابك ومعلوماتك', en: 'Manage your account and details' },
  preferences: { ar: 'التفضيلات', en: 'Preferences' },
  quickLinks: { ar: 'روابط سريعة', en: 'Quick links' },
  premiumMember: { ar: 'عضو بريميوم', en: 'Premium member' },
  premiumTitle: { ar: 'عضوية بريميوم', en: 'Premium membership' },
  premiumDesc: {
    ar: 'اطّلع على اتجاهات أسعار السوق والتحليلات الحصرية لتشتري في الوقت المناسب.',
    en: 'Unlock market price trends and exclusive analytics to buy at the right time.',
  },
  premiumActive: { ar: 'اشتراكك مفعّل', en: 'Your subscription is active' },
  manageSubscription: { ar: 'إدارة الاشتراك', en: 'Manage subscription' },
  cancelSubscription: { ar: 'إلغاء الاشتراك', en: 'Cancel subscription' },
  cancelSubscriptionConfirm: { ar: 'إلغاء اشتراك البريميوم؟', en: 'Cancel Premium subscription?' },
  cancelSubscriptionConfirmDesc: {
    ar: 'ستفقد الوصول إلى تحليلات السوق الحصرية فوراً.',
    en: 'You will immediately lose access to exclusive market analytics.',
  },
  toastPremiumCancelled: { ar: 'تم إلغاء البريميوم', en: 'Premium cancelled' },
  logoutConfirm: { ar: 'تسجيل الخروج؟', en: 'Log out?' },
  logoutConfirmDesc: {
    ar: 'سيتم إنهاء جلستك والعودة إلى وضع التصفّح كزائر.',
    en: 'Your session will end and you will return to guest browsing.',
  },
  toastLoggedOut: { ar: 'تم تسجيل الخروج', en: 'Logged out' },
  memberSinceShort: { ar: 'عضو منذ 2021', en: 'Member since 2021' },
  saving: { ar: 'جارٍ الحفظ...', en: 'Saving...' },
  savedAddressesCount: { ar: 'عنوان محفوظ', en: 'saved' },
  branchesCount: { ar: 'فرع', en: 'branches' },
  favoritesCount: { ar: 'منتج مفضّل', en: 'favorites' },

  // --- RFQ ---
  rfqTitle: { ar: 'طلب عرض سعر بالجملة', en: 'Request a bulk quote' },
  rfqSubtitle: {
    ar: 'اطلب أسعاراً من عدة موردين لكميات كبيرة ووفّر أكثر.',
    en: 'Get prices from multiple suppliers for large quantities and save more.',
  },
  requestQuote: { ar: 'طلب عرض سعر', en: 'Request quote' },
  productName: { ar: 'اسم المنتج المطلوب', en: 'Product needed' },
  requiredQty: { ar: 'الكمية المطلوبة (كرتون)', en: 'Required quantity (cartons)' },
  targetPrice: { ar: 'السعر المستهدف للكرتون', en: 'Target price per carton' },
  notes: { ar: 'ملاحظات', en: 'Notes' },
  optional: { ar: 'اختياري', en: 'optional' },
  submitRfq: { ar: 'إرسال الطلب', en: 'Submit request' },
  receivedQuotes: { ar: 'العروض المستلمة', en: 'Received quotes' },
  noQuotes: { ar: 'لا توجد طلبات عروض', en: 'No quote requests' },
  noQuotesDesc: {
    ar: 'أرسل أول طلب عرض سعر لتصلك عروض الموردين هنا.',
    en: 'Submit your first request and supplier offers will appear here.',
  },
  statusSubmitted: { ar: 'قيد الاستلام', en: 'Submitted' },
  statusQuoted: { ar: 'وردت عروض', en: 'Quoted' },
  statusExpired: { ar: 'منتهٍ', en: 'Expired' },
  responsesReceived: { ar: 'عرض مستلم', en: 'offers received' },
  bestOffer: { ar: 'أفضل عرض', en: 'Best offer' },
  viewOffers: { ar: 'عرض العروض', en: 'View offers' },

  // --- Toasts ---
  toastAddedToCart: { ar: 'تمت الإضافة إلى السلة', en: 'Added to cart' },
  toastRemoved: { ar: 'تمت الإزالة من السلة', en: 'Removed from cart' },
  toastFavoriteAdded: { ar: 'أُضيف إلى المفضلة', en: 'Added to favorites' },
  toastFavoriteRemoved: { ar: 'أُزيل من المفضلة', en: 'Removed from favorites' },
  toastOrderPlaced: { ar: 'تم تأكيد الطلب بنجاح', en: 'Order placed successfully' },
  toastOrderCancelled: { ar: 'تم إلغاء الطلب', en: 'Order cancelled' },
  toastQuoteSent: { ar: 'تم إرسال طلب العرض', en: 'Quote request sent' },
  toastAddressAdded: { ar: 'تمت إضافة العنوان', en: 'Address added' },
  toastAddressRemoved: { ar: 'تم حذف العنوان', en: 'Address removed' },
  toastProfileSaved: { ar: 'تم حفظ التغييرات', en: 'Changes saved' },
  toastPremiumUnlocked: { ar: 'تم تفعيل البريميوم', en: 'Premium unlocked' },
  toastTemplateAdded: { ar: 'تمت إضافة القالب ��لى السلة', en: 'Template added to cart' },
  toastCartMerged: { ar: 'تم دمج سلتك السابقة', en: 'Your previous cart was merged' },

  // --- Stepper / stock ---
  lowStock: { ar: 'كمية محدودة', en: 'Low stock' },
  maxStockReached: { ar: 'وصلت للحد الأقصى المتاح', en: 'Maximum available reached' },
  belowMoq: { ar: 'أقل من الحد الأدنى للطلب', en: 'Below minimum order' },

  // --- Theme ---
  toggleTheme: { ar: 'تبديل المظهر', en: 'Toggle theme' },
  lightMode: { ar: 'الوضع الفاتح', en: 'Light mode' },
  darkMode: { ar: 'الوضع الداكن', en: 'Dark mode' },

  // --- Bottom nav ---
  navHome: { ar: 'الرئيسية', en: 'Home' },
  navOrders: { ar: 'طلباتي', en: 'Orders' },

  // --- Coupons ---
  couponTitle: { ar: 'كوبون الخصم', en: 'Discount coupon' },
  couponPlaceholder: { ar: 'أدخل كود الكوبون', en: 'Enter coupon code' },
  couponApply: { ar: 'تطبيق', en: 'Apply' },
  couponApplied: { ar: 'تم تطبيق الكوبون', en: 'Coupon applied' },
  couponRemove: { ar: 'إزالة', en: 'Remove' },
  couponDiscount: { ar: 'خصم الكوبون', en: 'Coupon discount' },
  couponInvalid: { ar: 'كود الكوبون غير صالح', en: 'Invalid coupon code' },
  couponExpired: { ar: 'انتهت صلاحية هذا الكوبون', en: 'This coupon has expired' },
  couponMinNotMet: { ar: 'الحد الأدنى للطلب غير مستوفى', en: 'Minimum order not met' },
  couponMerchantOnly: { ar: 'هذا الكوبون للتجار الموثّقين فقط', en: 'This coupon is for verified merchants only' },
  couponFreeShipApplied: { ar: 'شحن مجاني بالكوبون', en: 'Free shipping via coupon' },
  availableCoupons: { ar: 'عروض متاحة لك', en: 'Available offers' },
  couponUse: { ar: 'استخدام', en: 'Use' },
  couponMinLabel: { ar: 'حد أدنى', en: 'Min' },
  couponTap: { ar: 'اضغط لتطبيق الكوبون', en: 'Tap to apply' },

  // --- Notifications ---
  notifications: { ar: 'الإشعارات', en: 'Notifications' },
  notificationsDesc: { ar: 'تحديثات طلباتك والعروض وتنبيهات الأسعار', en: 'Order updates, offers and price alerts' },
  markAllRead: { ar: 'تعليم الكل كمقروء', en: 'Mark all as read' },
  noNotifications: { ar: 'لا توجد إشعارات', en: 'No notifications' },
  noNotificationsDesc: { ar: 'ستظهر هنا تحديثات طلباتك والعروض الجديدة', en: 'Order updates and new offers will appear here' },
  notifAll: { ar: 'الكل', en: 'All' },
  notifUnread: { ar: 'غير المقروءة', en: 'Unread' },
  notifFilterOrders: { ar: 'الطلبات', en: 'Orders' },
  notifFilterOffers: { ar: 'العروض', en: 'Offers' },
  notifFilterPrices: { ar: 'الأسعار', en: 'Prices' },
  toastAllRead: { ar: 'تم تعليم كل الإشعارات كمقروءة', en: 'All notifications marked as read' },
  justNow: { ar: 'الآن', en: 'Just now' },
  minutesAgo: { ar: 'دقيقة', en: 'min ago' },
  hoursAgo: { ar: 'ساعة', en: 'h ago' },
  daysAgo: { ar: 'يوم', en: 'd ago' },
  priceDropAlert: { ar: 'انخفض السعر', en: 'Price dropped' },
  viewOffer: { ar: 'عرض العرض', en: 'View offer' },
} satisfies Dict

export type DictKey = keyof typeof DICT

type I18nContextValue = {
  lang: Lang
  dir: 'rtl' | 'ltr'
  currency: CurrencyCode
  country: Country
  brand: string
  brandLogo: string
  setLang: (l: Lang) => void
  setCountry: (code: string) => void
  t: (key: DictKey) => string
  formatPrice: (usd: number) => string
  convert: (usd: number) => number
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar')
  const [countryCode, setCountryCode] = useState<string>('SA')

  useEffect(() => {
    const savedLang = localStorage.getItem('mawrid_lang') as Lang | null
    const savedCountry = localStorage.getItem('mawrid_country')
    if (savedLang) setLangState(savedLang)
    if (savedCountry) setCountryCode(savedCountry)
  }, [])

  const dir: 'rtl' | 'ltr' = lang === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    localStorage.setItem('mawrid_lang', l)
  }, [])

  const setCountry = useCallback((code: string) => {
    setCountryCode(code)
    localStorage.setItem('mawrid_country', code)
  }, [])

  const country = useMemo(
    () => COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0],
    [countryCode],
  )
  const currency = country.currency

  const convert = useCallback(
    (usd: number) => usd * CURRENCY_CONFIG[currency].rate,
    [currency],
  )

  const formatPrice = useCallback(
    (usd: number) => {
      const info = CURRENCY_CONFIG[currency]
      const value = usd * info.rate
      return new Intl.NumberFormat(lang === 'ar' ? 'ar' : 'en-US', {
        style: 'currency',
        currency: info.code,
        currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: info.decimals,
        maximumFractionDigits: info.decimals,
      }).format(value)
    },
    [currency, lang],
  )

  const t = useCallback(
    (key: DictKey) => {
      const entry = DICT[key]
      if (!entry) return String(key)
      return entry[lang]
    },
    [lang],
  )

  const value = useMemo(
    () => ({
      lang,
      dir,
      currency,
      country,
      brand: lang === 'ar' ? BRAND.ar : BRAND.en,
      brandLogo: lang === 'ar' ? BRAND.logoAr : BRAND.logoEn,
      setLang,
      setCountry,
      t,
      formatPrice,
      convert,
    }),
    [lang, dir, currency, country, setLang, setCountry, t, formatPrice, convert],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
