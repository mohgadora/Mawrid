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

export type Lang = 'ar' | 'en' | 'hi' | 'bn' | 'tr'
export type { CurrencyCode }

/** Intl locale tag for each UI language — drives Intl.NumberFormat */
export const LANG_LOCALE: Record<Lang, string> = {
  ar: 'ar',
  en: 'en-US',
  hi: 'hi',
  bn: 'bn',
  tr: 'tr',
}

/** Human-readable endonym for each language (shown in the switcher) */
export const LANG_LABEL: Record<Lang, string> = {
  ar: 'العربية',
  en: 'English',
  hi: 'हिन्दी',
  bn: 'বাংলা',
  tr: 'Türkçe',
}

/** All supported languages in display order */
export const LANGS: Lang[] = ['ar', 'en', 'hi', 'bn', 'tr']

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

/**
 * Each entry MUST have `ar` and `en`. Additional langs (`hi`, `bn`, `tr`) are
 * optional — the t() function falls back to `en` then `ar` if missing.
 */
type DictEntry = { ar: string; en: string } & Partial<Record<'hi' | 'bn' | 'tr', string>>

const DICT = {
  tagline: { ar: 'منصة تجارة الجملة رقم 1', en: 'The #1 Wholesale Marketplace', hi: 'नंबर 1 थोक बाज़ार', bn: '১ নম্বর পাইকারি বাজার', tr: '#1 Toptan Pazar' },
  searchPlaceholder: {
    ar: 'ابحث عن منتجات، موردين، تصنيفات...',
    en: 'Search products, suppliers, categories...',
    hi: 'उत्पाद, आपूर्तिकर्ता, श्रेणियाँ खोजें...',
    bn: 'পণ্য, সরবরাহকারী, বিভাগ অনুসন্ধান করুন...',
    tr: 'Ürün, tedarikçi, kategori ara...',
  },
  search: { ar: 'بحث', en: 'Search', hi: 'खोजें', bn: 'খুঁজুন', tr: 'Ara' },
  login: { ar: 'تسجيل الدخول', en: 'Log in', hi: 'लॉग इन', bn: 'লগ ইন', tr: 'Giriş yap' },
  signup: { ar: 'إنشاء حساب', en: 'Sign up', hi: 'साइन अप', bn: 'সাইন আপ', tr: 'Kaydol' },
  password: { ar: 'كلمة المرور', en: 'Password' },
  companyName: { ar: 'اسم المنشأة', en: 'Business name' },

  // ── Auth portals ─────────────────────────────────────────────
  authHubTitle: { ar: 'اختر بوابة الدخول المناسبة', en: 'Choose your sign-in portal' },
  authHubHint: { ar: 'كل بوابة مخصّصة لنوع حساب مختلف — استخدم البوابة الصحيحة لدورك', en: 'Each portal is for a different account type — use the one that matches your role' },
  authPortalStore: { ar: 'متجر الطلبات', en: 'Storefront' },
  authPortalStoreDesc: { ar: 'للمستهلكين وتجار التجزئة والبقالات — تصفّح واطلب بالتجزئة أو الجملة', en: 'For consumers and retail merchants — browse and order' },
  authPortalPartner: { ar: 'بوابة الشركاء', en: 'Partner Hub' },
  authPortalPartnerDesc: { ar: 'للموردين والشركاء — أدر منتجاتك ومتجرك وفواتيرك', en: 'For suppliers and partners — manage products, store, and invoices' },
  authPortalAdmin: { ar: 'لوحة الإدارة', en: 'Admin Console' },
  authPortalAdminDesc: { ar: 'لفريق تشغيل المنصة — إدارة كاملة للنظام', en: 'For platform operators — full system management' },
  authSwitchPortal: { ar: 'بوابة أخرى؟', en: 'Different portal?' },
  authAllPortals: { ar: 'كل البوابات', en: 'All portals' },
  authNoAccount: { ar: 'ليس لديك حساب؟', en: "Don't have an account?" },
  authHasAccount: { ar: 'لديك حساب بالفعل؟', en: 'Already have an account?' },
  authErrorGeneric: { ar: 'حدث خطأ، يرجى المحاولة مرة أخرى', en: 'Something went wrong, please try again' },
  authErrorNotAdmin: { ar: 'هذا الحساب ليس حساب إدارة. استخدم بوابة المتجر أو الشركاء', en: 'This account is not an admin. Use the store or partner portal' },
  authErrorNotPartner: { ar: 'هذا الحساب ليس حساب مورد/شريك. سجّل من بوابة الشركاء', en: 'This is not a partner account. Register via the partner portal' },
  authErrorUsePartnerPortal: { ar: 'حسابك كمورد — سجّل الدخول من بوابة الشركاء', en: 'Your supplier account must sign in via the partner portal' },
  authErrorForbidden: { ar: 'غير مصرّح بالوصول', en: 'Access denied' },
  authSignIn_store: { ar: 'دخول المتجر', en: 'Store sign in' },
  authSignInDesc_store: { ar: 'للمستهلكين وتجار التجزئة والبقالات', en: 'For consumers and retail merchants' },
  authSignUp_store: { ar: 'حساب مشتري جديد', en: 'Create buyer account' },
  authSignUpDesc_store: { ar: 'أنشئ حساباً للتسوق والطلب', en: 'Create an account to shop and order' },
  authSignIn_partner: { ar: 'دخول الشركاء', en: 'Partner sign in' },
  authSignInDesc_partner: { ar: 'للموردين وشركاء المنصة', en: 'For suppliers and platform partners' },
  authSignUp_partner: { ar: 'انضم كشريك/مورد', en: 'Join as partner' },
  authSignUpDesc_partner: { ar: 'أنشئ متجرك وابدأ ببيع منتجاتك', en: 'Set up your store and start selling' },
  authSignIn_admin: { ar: 'دخول الإدارة', en: 'Admin sign in' },
  authSignInDesc_admin: { ar: 'لمديري المنصة فقط', en: 'Platform administrators only' },
  authSignUp_admin: { ar: 'دخول الإدارة', en: 'Admin sign in' },
  authSignUpDesc_admin: { ar: 'لمديري المنصة فقط', en: 'Platform administrators only' },
  authBuyerType: { ar: 'نوع الحساب', en: 'Account type' },
  authBuyerConsumer: { ar: 'مستهلك', en: 'Consumer' },
  authBuyerMerchant: { ar: 'تاجر تجزئة / بقالة', en: 'Retail / grocery' },
  authCrNumber: { ar: 'رقم السجل التجاري', en: 'CR number' },
  partnerNavDashboard: { ar: 'نظرة عامة', en: 'Overview' },
  partnerNavProducts: { ar: 'المنتجات', en: 'Products' },
  partnerNavOrders: { ar: 'الطلبات', en: 'Orders' },
  partnerNavInvoices: { ar: 'الفواتير والمدفوعات', en: 'Invoices & payouts' },
  partnerNavStore: { ar: 'إعدادات المتجر', en: 'Store settings' },
  partnerNavInventory: { ar: 'المخزون', en: 'Inventory' },
  partnerNavWithdrawals: { ar: 'طلبات السحب', en: 'Withdrawals' },
  partnerNavReviews: { ar: 'التقييمات', en: 'Reviews' },
  partnerNavReports: { ar: 'التقارير', en: 'Reports' },
  partnerNavSupport: { ar: 'الدعم الفني', en: 'Support' },
  partnerNavNotifications: { ar: 'التنبيهات', en: 'Notifications' },
  partnerVerified: { ar: 'موثّق', en: 'Verified' },
  partnerPendingVerification: { ar: 'قيد المراجعة', en: 'Pending verification' },
  partnerRevenue: { ar: 'الإيرادات', en: 'Revenue' },
  partnerPendingPayouts: { ar: 'مدفوعات معلّقة', en: 'Pending payouts' },
  partnerStoreHint: { ar: 'يمكنك تحديث بيانات متجرك مباشرة من هنا', en: 'You can update your store details directly here' },
  partnerAddProduct: { ar: 'إضافة منتج', en: 'Add product' },
  partnerEditProduct: { ar: 'تعديل منتج', en: 'Edit product' },
  partnerDeleteProduct: { ar: 'حذف المنتج؟', en: 'Delete product?' },
  partnerResponseTime: { ar: 'وقت الاستجابة', en: 'Response time' },
  imageUrl: { ar: 'رابط الصورة', en: 'Image URL' },
  category: { ar: 'التصنيف', en: 'Category' },
  qty: { ar: 'الكمية', en: 'Qty' },
  printInvoice: { ar: 'طباعة الفاتورة', en: 'Print invoice' },
  forgotPassword: { ar: 'نسيت كلمة المرور؟', en: 'Forgot password?' },
  forgotPasswordDesc: { ar: 'أدخل بريدك وسنرسل رابط إعادة التعيين', en: 'Enter your email and we will send a reset link' },
  forgotPasswordSent: { ar: 'تحقق من بريدك الإلكتروني', en: 'Check your email for the reset link' },
  sendResetLink: { ar: 'إرسال الرابط', en: 'Send reset link' },
  resetPassword: { ar: 'إعادة تعيين كلمة المرور', en: 'Reset password' },
  backToLogin: { ar: 'العودة لتسجيل الدخول', en: 'Back to sign in' },
  merchantKycTitle: { ar: 'توثيق حساب التاجر', en: 'Merchant verification' },
  merchantKycDesc: { ar: 'أرسل بيانات منشأتك للحصول على أسعار الجملة', en: 'Submit your business details for wholesale pricing' },
  submitKyc: { ar: 'إرسال طلب التوثيق', en: 'Submit verification' },
  kycPending: { ar: 'طلب التوثيق قيد المراجعة', en: 'Verification request is under review' },
  kycApproved: { ar: 'حسابك موثّق — تستفيد من أسعار الجملة', en: 'Your account is verified for wholesale pricing' },
  toastKycSubmitted: { ar: 'تم إرسال طلب التوثيق', en: 'Verification request submitted' },
  stock: { ar: 'المخزون', en: 'Stock' },
  price: { ar: 'السعر', en: 'Price' },
  becomeSupplier: { ar: 'انضم كمورد', en: 'Become a Supplier', hi: 'आपूर्तिकर्ता बनें', bn: 'সরবরাহকারী হন', tr: 'Tedarikçi Ol' },
  cart: { ar: 'السلة', en: 'Cart', hi: 'कार्ट', bn: 'কার্ট', tr: 'Sepet' },
  account: { ar: 'حسابي', en: 'Account', hi: 'खाता', bn: 'অ্যাকাউন্ট', tr: 'Hesap' },
  categories: { ar: 'التصنيفات', en: 'Categories', hi: 'श्रेणियाँ', bn: 'বিভাগসমূহ', tr: 'Kategoriler' },
  allCategories: { ar: 'كل التصنيفات', en: 'All Categories', hi: 'सभी श्रेणियाँ', bn: 'সব বিভাগ', tr: 'Tüm Kategoriler' },
  language: { ar: 'اللغة', en: 'Language', hi: 'भाषा', bn: 'ভাষা', tr: 'Dil' },
  country: { ar: 'الدولة والعملة', en: 'Country & Currency', hi: 'देश और मुद्रा', bn: 'দেশ ও মুদ্রা', tr: 'Ülke ve Para Birimi' },
  heroTitle: { ar: 'اشترِ بالجملة، وفّر أكثر', en: 'Buy Wholesale, Save More', hi: 'थोक में खरीदें, अधिक बचाएं', bn: 'পাইকারি কিনুন, বেশি সাশ্রয় করুন', tr: 'Toptan Al, Daha Fazla Tasarruf Et' },
  heroSubtitle: {
    ar: 'قارن أسعار الجملة بمتوسط السوق واشترِ من موردين موثوقين بأفضل الأسعار',
    en: 'Compare wholesale prices to the market average and buy from verified suppliers',
    hi: 'थोक कीमतों की बाज़ार औसत से तुलना करें और सत्यापित आपूर्तिकर्ताओं से खरीदें',
    bn: 'পাইকারি দাম বাজারের গড়ের সাথে তুলনা করুন এবং যাচাইকৃত সরবরাহকারীদের থেকে কিনুন',
    tr: 'Toptan fiyatları piyasa ortalamasıyla karşılaştırın ve güvenilir tedarikçilerden satın alın',
  },
  shopNow: { ar: 'تسوّق الآن', en: 'Shop Now', hi: 'अभी खरीदें', bn: 'এখনই কিনুন', tr: 'Hemen Al' },
  exploreDeals: { ar: 'اكتشف العروض', en: 'Explore Deals', hi: 'ऑफर देखें', bn: 'অফার দেখুন', tr: 'Fırsatları Keşfet' },
  flashDeals: { ar: 'عروض الجملة', en: 'Wholesale Deals', hi: 'थोक ऑफर', bn: 'পাইকারি অফার', tr: 'Toptan Fırsatlar' },
  endsIn: { ar: 'ينتهي خلال', en: 'Ends in', hi: 'समाप्त होगा', bn: 'শেষ হবে', tr: 'Bitiş' },
  seeAll: { ar: 'عرض الكل', en: 'See all', hi: 'सब देखें', bn: 'সব দেখুন', tr: 'Tümünü gör' },
  topSuppliers: { ar: 'موردون مميزون', en: 'Top Suppliers', hi: 'शीर्ष आपूर्तिकर्ता', bn: 'শীর্ষ সরবরাহকারী', tr: 'Öne Çıkan Tedarikçiler' },
  recommended: { ar: 'مختارة لك', en: 'Recommended for you', hi: 'आपके लिए अनुशंसित', bn: 'আপনার জন্য সুপারিশকৃত', tr: 'Size Özel' },
  perCarton: { ar: 'للكرتون', en: 'per carton', hi: 'प्रति कार्टन', bn: 'প্রতি কার্টন', tr: 'karton başına' },
  perUnit: { ar: 'للوحدة', en: 'per unit', hi: 'प्रति इकाई', bn: 'প্রতি ইউনিট', tr: 'birim başına' },
  moq: { ar: 'أقل كمية', en: 'Min. order', hi: 'न्यूनतम ऑर्डर', bn: 'সর্বনিম্ন অর্ডার', tr: 'Min. sipariş' },
  cartons: { ar: 'كرتون', en: 'cartons', hi: 'कार्टन', bn: 'কার্টন', tr: 'karton' },
  carton: { ar: 'كرتون', en: 'carton', hi: 'कार्टन', bn: 'কার্টন', tr: 'karton' },
  unitsPerCarton: { ar: 'وحدة/كرتون', en: 'units/carton', hi: 'इकाइयाँ/कार्टन', bn: 'ইউনিট/কার্টন', tr: 'adet/karton' },
  addToCart: { ar: 'أضف للسلة', en: 'Add to cart', hi: 'कार्ट में जोड़ें', bn: 'কার্টে যোগ করুন', tr: 'Sepete ekle' },
  added: { ar: 'تمت الإضافة', en: 'Added', hi: 'जोड़ा गया', bn: 'যোগ হয়েছে', tr: 'Eklendi' },
  inStock: { ar: 'متوفر', en: 'In stock', hi: 'स्टॉक में है', bn: 'স্টকে আছে', tr: 'Stokta var' },
  verified: { ar: 'مورد موثّق', en: 'Verified', hi: 'सत्यापित', bn: 'যাচাইকৃত', tr: 'Doğrulanmış' },
  sold: { ar: 'مبيع', en: 'sold', hi: 'बेचा गया', bn: 'বিক্রি হয়েছে', tr: 'satıldı' },
  tieredPricing: { ar: 'أسعار متدرجة حسب الكمية', en: 'Tiered pricing by quantity', hi: 'मात्रा अनुसार स्तरीय मूल्य', bn: 'পরিমাণ অনুযায়ী স্তরভিত্তিক মূল্য', tr: 'Miktara göre kademeli fiyatlandırma' },
  quantity: { ar: 'الكمية', en: 'Quantity', hi: 'मात्रा', bn: 'পরিমাণ', tr: 'Miktar' },
  save: { ar: 'وفّر', en: 'Save', hi: 'बचाएं', bn: 'সাশ্রয় করুন', tr: 'Tasarruf et' },
  subtotal: { ar: 'الإجمالي الفرعي', en: 'Subtotal', hi: 'उप-कुल', bn: 'উপ-মোট', tr: 'Ara toplam' },
  shipping: { ar: 'الشحن', en: 'Shipping', hi: 'शिपिंग', bn: 'শিপিং', tr: 'Kargo' },
  total: { ar: 'الإجمالي', en: 'Total', hi: 'कुल', bn: 'মোট', tr: 'Toplam' },
  checkout: { ar: 'إتمام الطلب', en: 'Checkout', hi: 'चेकआउट', bn: 'চেকআউট', tr: 'Ödeme yap' },
  emptyCart: { ar: 'سلة التسوق فارغة', en: 'Your cart is empty', hi: 'आपका कार्ट खाली है', bn: 'আপনার কার্ট খালি', tr: 'Sepetiniz boş' },
  emptyCartDesc: {
    ar: 'ابدأ بإضافة منتجات الجملة إلى سلتك',
    en: 'Start adding wholesale products to your cart',
    hi: 'अपने कार्ट में थोक उत्पाद जोड़ना शुरू करें',
    bn: 'আপনার কার্টে পাইকারি পণ্য যোগ করা শুরু করুন',
    tr: 'Sepetinize toptan ürün eklemeye başlayın',
  },
  continueShopping: { ar: 'مواصلة التسوق', en: 'Continue shopping', hi: 'खरीदारी जारी रखें', bn: 'কেনাকাটা চালিয়ে যান', tr: 'Alışverişe devam et' },
  remove: { ar: 'إزالة', en: 'Remove', hi: 'हटाएं', bn: 'সরান', tr: 'Kaldır' },
  freeShipping: { ar: 'شحن مجاني', en: 'Free shipping', hi: 'मुफ्त शिपिंग', bn: 'বিনামূল্যে শিপিং', tr: 'Ücretsiz kargo' },
  orderProtection: { ar: 'حماية الطلب', en: 'Order protection', hi: 'ऑर्डर सुरक्षा', bn: 'অর্ডার সুরক্ষা', tr: 'Sipariş güvencesi' },
  fastDelivery: { ar: 'توصيل سريع', en: 'Fast delivery', hi: 'तेज़ डिलीवरी', bn: 'দ্রুত ডেলিভারি', tr: 'Hızlı teslimat' },
  securePayment: { ar: 'دفع آمن', en: 'Secure payment', hi: 'सुरक्षित भुगतान', bn: 'নিরাপদ পেমেন্ট', tr: 'Güvenli ödeme' },
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
  roleAdmin: { ar: 'مدير', en: 'Admin' },
  impersonatingAs: { ar: 'أنت تعرض كمتجر', en: 'Viewing as store' },
  exitImpersonation: { ar: 'إنهاء والعودة للإدارة', en: 'Exit to admin' },
  loginAsStore: { ar: 'الدخول كمتجر', en: 'Login as store' },
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
  noSuggestions: { ar: '��ا توجد اقتراحات', en: 'No suggestions' },

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
  checkoutTitle: { ar: 'إتمام الطلب', en: 'Checkout', hi: 'चेकआउट', bn: 'চেকআউট', tr: 'Ödeme' },
  stepAddress: { ar: 'العنوان', en: 'Address', hi: 'पता', bn: 'ঠিকানা', tr: 'Adres' },
  stepDelivery: { ar: 'التوصيل', en: 'Delivery', hi: 'डिलीवरी', bn: 'ডেলিভারি', tr: 'Teslimat' },
  stepPayment: { ar: 'الدفع والمراجعة', en: 'Payment & review', hi: 'भुगतान और समीक्षा', bn: 'পেমেন্ট ও পর্যালোচনা', tr: 'Ödeme ve inceleme' },
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
  myOrders: { ar: 'طلباتي', en: 'My orders', hi: 'मेरे ऑर्डर', bn: 'আমার অর্ডার', tr: 'Siparişlerim' },
  orders: { ar: 'الطلبات', en: 'Orders', hi: 'ऑर्डर', bn: 'অর্ডার', tr: 'Siparişler' },
  orderRef: { ar: 'رقم الطلب', en: 'Order', hi: 'ऑर्डर', bn: 'অর্ডার', tr: 'Sipariş' },
  orderDate: { ar: 'تاريخ الطلب', en: 'Order date', hi: 'ऑर्डर तारीख', bn: 'অর্ডারের তারিখ', tr: 'Sipariş tarihi' },
  orderStatus: { ar: 'الحالة', en: 'Status', hi: 'स्थिति', bn: 'অবস্থা', tr: 'Durum' },
  noOrders: { ar: 'لا توجد طلبات بعد', en: 'No orders yet', hi: 'अभी कोई ऑर्डर नहीं', bn: 'এখনো কোনো অর্ডার নেই', tr: 'Henüz sipariş yok' },
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
  statusPending: { ar: 'قيد الانتظار', en: 'Pending', hi: 'लंबित', bn: 'অপেক্ষমাণ', tr: 'Beklemede' },
  statusConfirmed: { ar: 'مؤكّد', en: 'Confirmed', hi: 'पुष्टि हुई', bn: 'নিশ্চিত হয়েছে', tr: 'Onaylandı' },
  statusProcessing: { ar: 'قيد التجهيز', en: 'Processing', hi: 'प्रक्रियाधीन', bn: 'প্রক্রিয়াধীন', tr: 'İşleniyor' },
  statusPacked: { ar: 'تم التغليف', en: 'Packed', hi: 'पैक किया गया', bn: 'প্যাক হয়েছে', tr: 'Paketlendi' },
  statusShipped: { ar: 'تم الشحن', en: 'Shipped', hi: 'भेजा गया', bn: 'পাঠানো হয়েছে', tr: 'Kargoya verildi' },
  statusOutForDelivery: { ar: 'خرج للتوصيل', en: 'Out for delivery', hi: 'डिलीवरी के लिए निकला', bn: 'ডেলিভারিতে আছে', tr: 'Dağıtımda' },
  statusDelivered: { ar: 'تم التسليم', en: 'Delivered', hi: 'डिलीवर हो गया', bn: 'ডেলিভারি হয়েছে', tr: 'Teslim edildi' },
  statusCancelled: { ar: 'ملغى', en: 'Cancelled', hi: 'रद्द किया गया', bn: 'বাতিল করা হয়েছে', tr: 'İptal edildi' },

  // --- Auth ---
  welcomeToBrand: { ar: 'مرحباً بك في', en: 'Welcome to', hi: 'स्वागत है', bn: 'স্বাগতম', tr: 'Hoş geldiniz' },
  authSubtitle: {
    ar: 'سجّل الدخول أو أنشئ حساباً بالهاتف للبدء',
    en: 'Log in or create an account with your phone to get started',
    hi: 'शुरू करने के लिए अपने फोन से लॉग इन करें या खाता बनाएं',
    bn: 'শুরু করতে আপনার ফোন দিয়ে লগ ইন করুন বা অ্যাকাউন্ট তৈরি করুন',
    tr: 'Başlamak için telefonunuzla giriş yapın veya hesap oluşturun',
  },
  phoneNumber: { ar: 'رقم الهاتف', en: 'Phone number', hi: 'फोन नंबर', bn: 'ফোন নম্বর', tr: 'Telefon numarası' },
  phonePlaceholder: { ar: '5X XXX XXXX', en: '5X XXX XXXX' },
  sendOtp: { ar: 'إرسال رمز التحقق', en: 'Send code', hi: 'कोड भेजें', bn: 'কোড পাঠান', tr: 'Kod gönder' },
  enterOtp: { ar: 'أدخل رمز التحقق', en: 'Enter verification code', hi: 'सत्यापन कोड दर्ज करें', bn: 'যাচাইকরণ কোড লিখুন', tr: 'Doğrulama kodunu girin' },
  otpSentTo: { ar: 'أرسلنا رمزاً مكوّناً من 6 أرقام إلى', en: 'We sent a 6-digit code to', hi: 'हमने 6 अंकों का कोड भेजा', bn: 'আমরা ৬ সংখ্যার কোড পাঠিয়েছি', tr: '6 haneli kod gönderildi' },
  resendOtp: { ar: 'إعادة الإرسال', en: 'Resend code', hi: 'पुनः भेजें', bn: 'পুনরায় পাঠান', tr: 'Tekrar gönder' },
  resendIn: { ar: 'إعادة الإرسال خلال', en: 'Resend in', hi: 'पुनः भेजें', bn: 'পুনরায় পাঠান', tr: 'Tekrar gönder' },
  seconds: { ar: 'ثانية', en: 's' },
  verify: { ar: 'تحقّق', en: 'Verify', hi: 'सत्यापित करें', bn: 'যাচাই করুন', tr: 'Doğrula' },
  changePhone: { ar: 'تغيير الرقم', en: 'Change number', hi: 'नंबर बदलें', bn: 'নম্বর পরিবর্তন করুন', tr: 'Numarayı değiştir' },
  invalidOtp: { ar: 'رمز غير صحيح، أدخل 6 أرقام', en: 'Invalid code, enter 6 digits', hi: 'अमान्य कोड, 6 अंक दर्ज करें', bn: 'অবৈধ কোড, ৬ সংখ্যা লিখুন', tr: 'Geçersiz kod, 6 rakam girin' },
  chooseAccountType: { ar: 'اختر نوع الحساب', en: 'Choose account type', hi: 'खाता प्रकार चुनें', bn: 'অ্যাকাউন্টের ধরন বেছে নিন', tr: 'Hesap türü seçin' },
  consumerRegister: { ar: 'حساب مستهلك', en: 'Consumer account', hi: 'उपभोक्ता खाता', bn: 'ভোক্তা অ্যাকাউন্ট', tr: 'Tüketici hesabı' },
  consumerRegisterDesc: {
    ar: 'تسجيل سريع لتصفّح المنتجات والشراء بأسعار التجزئة',
    en: 'Quick sign-up to browse and buy at retail prices',
    hi: 'खुदरा मूल्यों पर ब्राउज़ करने और खरीदने के लिए त्वरित पंजीकरण',
    bn: 'খুচরা মূল্যে ব্রাউজ ও কিনতে দ্রুত নিবন্ধন',
    tr: 'Perakende fiyatlardan göz atmak ve satın almak için hızlı kayıt',
  },
  merchantRegister: { ar: 'حساب تاجر', en: 'Merchant account', hi: 'व्यापारी खाता', bn: 'ব্যবসায়ী অ্যাকাউন্ট', tr: 'Tüccar hesabı' },
  merchantRegisterDesc: {
    ar: 'توثيق تجاري لفتح أسعار الجملة المتدرّجة',
    en: 'Business verification to unlock tiered wholesale pricing',
    hi: 'स्तरीय थोक मूल्य अनलॉक करने के लिए व्यापार सत्यापन',
    bn: 'স্তরভিত্তিক পাইকারি মূল্য আনলক করতে ব্যবসা যাচাই',
    tr: 'Kademeli toptan fiyatları açmak için iş doğrulaması',
  },
  fullName: { ar: 'الاسم الكامل', en: 'Full name', hi: 'पूरा नाम', bn: 'পুরো নাম', tr: 'Ad soyad' },
  businessName: { ar: 'اسم النشاط التجاري', en: 'Business name', hi: 'व्यापार का नाम', bn: 'ব্যবসার নাম', tr: 'İşletme adı' },
  crNumber: { ar: 'رقم السجل التجاري', en: 'CR number', hi: 'CR नंबर', bn: 'CR নম্বর', tr: 'CR numarası' },
  vatNumber: { ar: 'الرقم الضريبي', en: 'VAT number', hi: 'VAT नंबर', bn: 'VAT নম্বর', tr: 'KDV numarası' },
  uploadVatDoc: { ar: 'إرفاق شهادة ضريبة القيمة المضافة', en: 'Upload VAT certificate', hi: 'VAT प्रमाणपत्र अपलोड करें', bn: 'VAT সনদ আপলোড করুন', tr: 'KDV belgesi yükle' },
  fileSelected: { ar: 'تم اختيار الملف', en: 'File selected', hi: 'फ़ाइल चुनी गई', bn: 'ফাইল নির্বাচিত', tr: 'Dosya seçildi' },
  createAccount: { ar: 'إنشاء الحساب', en: 'Create account', hi: 'खाता बनाएं', bn: 'অ্যাকাউন্ট তৈরি করুন', tr: 'Hesap oluştur' },
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
  toastSaveFailed: { ar: 'تعذّر حفظ التغييرات', en: 'Could not save changes' },
  toastRequiredFields: { ar: 'يرجى تعبئة جميع الحقول المطلوبة', en: 'Please fill in all required fields' },
  toastAddressUpdated: { ar: 'تم تحديث العنوان', en: 'Address updated' },
  toastCountrySaved: { ar: 'تم حفظ بيانات الدولة', en: 'Country saved' },
  toastZoneSaved: { ar: 'تم حفظ المنطقة', en: 'Zone saved' },
  toastApprovalUpdated: { ar: 'تم تحديث حالة الطلب', en: 'Approval updated' },
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

  // --- Driver tracking map ---
  driverMap: { ar: 'خريطة السائقين', en: 'Driver Map', hi: 'ड्राइवर मैप', bn: 'ড্রাইভার ম্যাপ', tr: 'Sürücü Haritası' },
  allDrivers: { ar: 'جميع السائقين', en: 'All Drivers', hi: 'सभी ड्राइवर', bn: 'সকল ড্রাইভার', tr: 'Tüm Sürücüler' },
  driverStatusAvailable: { ar: 'متاح', en: 'Available', hi: 'उपलब्ध', bn: 'উপলব্ধ', tr: 'Müsait' },
  driverStatusBusy: { ar: 'مشغول', en: 'Busy', hi: 'व्यस्त', bn: 'ব্যস্ত', tr: 'Meşgul' },
  driverStatusLate: { ar: 'متأخر', en: 'Late', hi: 'देर', bn: 'দেরি', tr: 'Geç' },
  driverStatusReturning: { ar: 'عائد', en: 'Returning', hi: 'वापस आ रहा है', bn: 'ফিরছে', tr: 'Dönüyor' },
  driverStatusOffline: { ar: 'غير متصل', en: 'Offline', hi: 'ऑफलाइन', bn: 'অফলাইন', tr: 'Çevrimdışı' },
  driverStatusBreak: { ar: 'استراحة', en: 'On break', hi: 'विराम पर', bn: 'বিরতিতে', tr: 'Molada' },
  driverVehicle: { ar: 'المركبة', en: 'Vehicle', hi: 'वाहन', bn: 'যানবাহন', tr: 'Araç' },
  driverPhone: { ar: 'الهاتف', en: 'Phone', hi: 'फोन', bn: 'ফোন', tr: 'Telefon' },
  driverCurrentOrder: { ar: 'الطلب الحالي', en: 'Current order', hi: 'वर्तमान ऑर्डर', bn: 'বর্তমান অর্ডার', tr: 'Mevcut sipariş' },
  driverEta: { ar: 'الوقت المتوقع', en: 'ETA', hi: 'अनुमानित समय', bn: 'আনুমানিক সময়', tr: 'Tahmini varış' },
  driverLateBy: { ar: 'متأخر بـ', en: 'Late by', hi: 'देरी', bn: 'দেরি', tr: 'Gecikme' },
  driverLastUpdated: { ar: 'آخر تحديث', en: 'Last updated', hi: 'अंतिम अपडेट', bn: 'সর্বশেষ আপডেট', tr: 'Son güncelleme' },
  driverNoOrder: { ar: 'لا يوجد طلب', en: 'No active order', hi: 'कोई सक्रिय ऑर्डर नहीं', bn: 'কোনো সক্রিয় অর্ডার নেই', tr: 'Aktif sipariş yok' },
  driverSearchPlaceholder: { ar: 'بحث باسم السائق أو رقمه...', en: 'Search by name or ID...', hi: 'नाम या ID से खोजें...', bn: 'নাম বা ID দিয়ে খুঁজুন...', tr: 'İsim veya ID ile ara...' },
  driverTotal: { ar: 'إجمالي السائقين', en: 'Total Drivers', hi: 'कुल ड्राइवर', bn: 'মোট ড্রাইভার', tr: 'Toplam Sürücü' },
  driverAvailableCount: { ar: 'متاحون', en: 'Available', hi: 'उपलब्ध', bn: 'উপলব্ধ', tr: 'Müsait' },
  driverBusyCount: { ar: 'مشغولون', en: 'Busy', hi: 'व्यस्त', bn: 'ব্যস্ত', tr: 'Meşgul' },
  driverLateCount: { ar: 'متأخرون', en: 'Late', hi: 'देर से', bn: 'দেরিতে', tr: 'Geç' },
  lateByMinutes: { ar: 'دقيقة', en: 'min', hi: 'मिनट', bn: 'মিনিট', tr: 'dk' },
  mapProviderNote: { ar: 'يمكن تغيير مزود الخريطة من الإعدادات', en: 'Map provider can be changed in settings', hi: 'मैप प्रदाता सेटिंग में बदला जा सकता है', bn: 'মানচিত্র প্রদানকারী সেটিংসে পরিবর্তন করুন', tr: 'Harita sağlayıcısı ayarlardan değiştirilebilir' },
  selectDriverToRoute: { ar: 'اختر سائقاً لعرض المسار', en: 'Select a driver to view route', hi: 'मार्ग देखने के लिए ड्राइवर चुनें', bn: 'রুট দেখতে ড্রাইভার নির্বাচন করুন', tr: 'Rota görmek için sürücü seçin' },
  noDriversFound: { ar: 'لا يوجد سائقون مطابقون', en: 'No drivers found', hi: 'कोई ड्राइवर नहीं मिला', bn: 'কোনো ড্রাইভার পাওয়া যায়নি', tr: 'Sürücü bulunamadı' },
  driversPanel: { ar: 'السائقون', en: 'Drivers', hi: 'ड्राइवर', bn: 'ড্রাইভার', tr: 'Sürücüler' },
  mapLegend: { ar: 'المفتاح', en: 'Legend', hi: 'लीजेंड', bn: 'লিজেন্ড', tr: 'Gösterge' },
  filterAll: { ar: 'الكل', en: 'All', hi: 'सभी', bn: 'সব', tr: 'Tümü' },

  // --- Bottom nav ---
  navHome: { ar: 'الرئيسية', en: 'Home', hi: 'होम', bn: 'হোম', tr: 'Ana Sayfa' },
  navOrders: { ar: 'طلباتي', en: 'Orders', hi: 'ऑर्डर', bn: 'অর্ডার', tr: 'Siparişler' },

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

  // --- Social media ---
  followUs: { ar: 'تابعنا', en: 'Follow us' },

  // --- Request unavailable product ---
  requestProductTitle: { ar: 'طلب صنف غير موجود', en: 'Request Unavailable Product' },
  requestProductSubtitle: {
    ar: 'لم تجد ما تبحث عنه؟ أخبرنا وسنبحث عنه من موردينا.',
    en: "Can't find what you need? Tell us and we'll source it from our suppliers.",
  },
  requestProductName: { ar: 'اسم المنتج المطلوب', en: 'Product name' },
  requestProductCategory: { ar: 'التصنيف', en: 'Category' },
  requestProductDesc: { ar: 'وصف إضافي أو مواصفات', en: 'Additional description or specs' },
  requestProductQty: { ar: 'الكمية التقريبية (كرتون)', en: 'Approximate quantity (cartons)' },
  requestProductSubmit: { ar: 'إرسال الطلب', en: 'Submit Request' },
  requestProductSuccess: { ar: 'تم استلام طلبك بنجاح!', en: 'Request received!' },
  requestProductSuccessDesc: {
    ar: 'سيتواصل معك فريقنا خلال 48 ساعة بعروض من موردينا.',
    en: 'Our team will contact you within 48 hours with offers from our suppliers.',
  },
  requestProductCta: { ar: 'طلب صنف غير موجود', en: 'Request Unavailable Product' },
  selectCategory: { ar: 'اختر التصنيف', en: 'Select category' },
  requestAnotherProduct: { ar: 'طلب منتج آخر', en: 'Request another product' },

  // --- Category tree ---
  subCategories: { ar: 'الأقسام الفرعية', en: 'Subcategories' },
  browseAll: { ar: 'تصفح الكل', en: 'Browse all' },

  // ═══ Admin panel ═══════════════════════════════════════════

  // Sidebar / nav
  adminPanel: { ar: 'لوحة الإدارة', en: 'Admin Panel' },
  adminOverview: { ar: 'نظرة عامة', en: 'Overview' },
  adminApprovals: { ar: 'الموافقات', en: 'Approvals' },
  adminOrders: { ar: 'الطلبات', en: 'Orders' },
  adminSuppliers: { ar: 'الموردون', en: 'Suppliers' },
  adminBuyers: { ar: 'المشترون', en: 'Buyers' },
  adminDisputes: { ar: 'النزاعات', en: 'Disputes' },
  adminCatalog: { ar: 'الكتالوج', en: 'Catalog' },
  adminBrands: { ar: 'العلامات التجارية', en: 'Brands' },
  adminAttributes: { ar: 'الخصائص', en: 'Attributes' },
  adminUnits: { ar: 'وحدات القياس', en: 'Units' },
  adminMarketing: { ar: 'التسويق', en: 'Marketing' },
  adminSegments: { ar: 'شرائح الجمهور', en: 'Segments' },
  adminCampaigns: { ar: 'الحملا��', en: 'Campaigns' },
  adminLoyalty: { ar: 'الولاء', en: 'Loyalty' },
  adminReferrals: { ar: 'الإحالة', en: 'Referrals' },
  adminFinance: { ar: 'المالية', en: 'Finance' },
  adminPayouts: { ar: 'المدفوعات', en: 'Payouts' },
  adminTransactions: { ar: 'المعاملات', en: 'Transactions' },
  adminTaxes: { ar: 'الضرائب', en: 'Taxes' },
  adminGeography: { ar: 'الجغرافيا', en: 'Geography' },
  adminCountries: { ar: 'الدول', en: 'Countries' },
  adminZones: { ar: 'مناطق التوصيل', en: 'Delivery Zones' },
  adminShipping: { ar: 'الشحن', en: 'Shipping' },
  adminLogistics: { ar: 'اللوجستيات', en: 'Logistics' },
  adminDriverMap: { ar: 'خريطة السائقين', en: 'Driver Map' },
  adminSupport: { ar: 'الدعم', en: 'Support' },
  adminTickets: { ar: 'التذاكر', en: 'Tickets' },
  adminChats: { ar: 'الدردشات', en: 'Chats' },
  adminApps: { ar: 'التطبيقات', en: 'Apps' },
  adminVersions: { ar: 'الإصدارات', en: 'Versions' },
  adminBanners: { ar: 'البانرات', en: 'Banners' },
  adminAppConfig: { ar: 'الإعدادات عن بُعد', en: 'Remote Config' },
  adminForceUpdate: { ar: 'التحديث الإجباري', en: 'Force Update' },
  adminContent: { ar: 'المحتوى', en: 'Content' },
  adminPages: { ar: 'الصفحات', en: 'Pages' },
  adminFaq: { ar: 'الأسئلة الشائعة', en: 'FAQ' },
  adminAnnouncements: { ar: 'الإعلانات', en: 'Announcements' },
  adminPlatform: { ar: 'المنصة', en: 'Platform' },
  adminIntegrations: { ar: 'التكاملات', en: 'Integrations' },
  adminNotificationsCenter: { ar: 'مركز الإشعارات', en: 'Notifications Center' },
  adminHealth: { ar: 'صحة المنصة', en: 'Platform Health' },
  adminLogs: { ar: 'سجل النظام', en: 'System Logs' },
  adminSecurity: { ar: 'الأمان', en: 'Security' },
  adminRoles: { ar: 'الأدوار والصلاحيات', en: 'Roles & Permissions' },
  adminAudit: { ar: 'سجل التدقيق', en: 'Audit Log' },
  adminApiKeys: { ar: 'مفاتيح API', en: 'API Keys' },
  adminSessions: { ar: 'الجلسات النشطة', en: 'Active Sessions' },
  adminAccount: { ar: 'حسابي', en: 'My Account' },
  adminSettings: { ar: 'إعدادات المنصة', en: 'Platform Settings' },
  adminSettingsGeneral: { ar: 'عام', en: 'General' },
  adminSettingsPayments: { ar: 'الدفع', en: 'Payments' },
  adminSettingsBusiness: { ar: 'الأعمال', en: 'Business' },
  adminCommission: { ar: 'العمولات', en: 'Commissions' },
  adminCoupons: { ar: 'الكوبونات', en: 'Coupons' },
  adminWallets: { ar: 'المحافظ', en: 'Wallets' },
  adminWalletBonuses: { ar: 'بونص الشحن', en: 'Top-up Bonuses' },
  adminCashback: { ar: 'الاسترجاع النقدي', en: 'CashBack' },
  adminSeo: { ar: 'تحسين محركات البحث', en: 'SEO' },
  adminAds: { ar: 'الإعلانات', en: 'Advertisements' },
  adminRefunds: { ar: 'المرتجعات', en: 'Refunds' },
  adminProducts: { ar: 'المنتجات', en: 'Products' },
  adminWithdrawals: { ar: 'طلبات السحب', en: 'Withdrawal Requests' },
  adminReports: { ar: 'التقارير', en: 'Reports' },

  // Partner earnings / withdrawals
  partnerNavEarnings: { ar: 'الأرباح والسحب', en: 'Earnings & Payouts' },
  partnerEarningsBalance: { ar: 'الرصيد المتاح', en: 'Available Balance' },
  partnerEarningsPending: { ar: 'قيد التسوية', en: 'Pending Settlement' },
  partnerEarningsTotal: { ar: 'إجمالي الأرباح', en: 'Total Earnings' },
  partnerWithdrawRequest: { ar: 'طلب سحب', en: 'Request Withdrawal' },
  partnerWithdrawAmount: { ar: 'المبلغ', en: 'Amount' },
  partnerWithdrawMethod: { ar: 'طريقة السحب', en: 'Withdrawal Method' },
  partnerWithdrawIban: { ar: 'رقم IBAN', en: 'IBAN' },
  partnerWithdrawBankName: { ar: 'اسم البنك', en: 'Bank Name' },
  partnerWithdrawNote: { ar: 'ملاحظة', en: 'Note' },
  partnerWithdrawHistory: { ar: 'سجل طلبات السحب', en: 'Withdrawal History' },
  partnerCommissionRate: { ar: 'نسبة العمولة', en: 'Commission Rate' },
  partnerNetEarning: { ar: 'صافي الربح', en: 'Net Earning' },

  // Refunds
  refundRequest: { ar: 'طلب استرجاع', en: 'Refund Request' },
  refundReason: { ar: 'سبب الاسترجاع', en: 'Refund Reason' },
  refundAmount: { ar: 'مبلغ الاسترجاع', en: 'Refund Amount' },
  refundStatus: { ar: 'حالة الطلب', en: 'Request Status' },
  refundItems: { ar: 'المنتجات المرتجعة', en: 'Returned Items' },
  refundAdminNote: { ar: 'ملاحظة الأدمن', en: 'Admin Note' },
  refundApprove: { ar: 'موافقة', en: 'Approve' },
  refundReject: { ar: 'رفض', en: 'Reject' },
  refundProcessed: { ar: 'تمت المعالجة', en: 'Processed' },

  // Header / shared
  backToStore: { ar: 'العودة للمتجر', en: 'Back to Store' },
  adminSearch: { ar: 'بحث في اللوحة...', en: 'Search panel...' },

  // KPI cards
  kpiGmv: { ar: 'إجمالي المبيعات (GMV)', en: 'Gross Merchandise Value' },
  kpiOrders: { ar: 'إجمالي الطلبات', en: 'Total Orders' },
  kpiSuppliers: { ar: 'الموردون النشطون', en: 'Active Suppliers' },
  kpiBuyers: { ar: 'المشترون النشطون', en: 'Active Buyers' },
  kpiRevenue: { ar: 'الإيرادات', en: 'Revenue' },
  kpiPendingApprovals: { ar: 'موافقات معلقة', en: 'Pending Approvals' },
  kpiOpenTickets: { ar: 'تذاكر مفتوحة', en: 'Open Tickets' },
  vsLastMonth: { ar: 'مقارنة بالشهر الماضي', en: 'vs last month' },

  // Approvals
  approvalsTitle: { ar: 'الموافقات المعلقة', en: 'Pending Approvals' },
  approvalType: { ar: 'النوع', en: 'Type' },
  approvalPriority: { ar: 'الأولوية', en: 'Priority' },
  approvalDate: { ar: 'تاريخ التقديم', en: 'Submitted' },
  approvalAction: { ar: 'الإجراء', en: 'Action' },
  approveBtn: { ar: 'قبول', en: 'Approve' },
  rejectBtn: { ar: 'رفض', en: 'Reject' },
  priorityHigh: { ar: 'عالي', en: 'High' },
  priorityMedium: { ar: 'متوسط', en: 'Medium' },
  priorityLow: { ar: 'منخفض', en: 'Low' },
  approvalTypeKyc: { ar: 'تحقق الهوية', en: 'KYC' },
  approvalTypeSupplier: { ar: 'مورد جديد', en: 'New Supplier' },
  approvalTypeProduct: { ar: 'نشر منتج', en: 'Product Publish' },
  approvalTypePromotion: { ar: 'عرض ترويجي', en: 'Promotion' },
  approvalTypeReview: { ar: 'مراجعة', en: 'Review' },
  approvalTypeRefund: { ar: 'استرداد', en: 'Refund' },
  approvalTypePrice: { ar: 'تحديث سعر', en: 'Price Update' },

  // Orders admin
  orderId: { ar: 'رقم الطلب', en: 'Order ID' },
  buyerLabel: { ar: 'المشتري', en: 'Buyer' },
  supplierLabel: { ar: 'المورد', en: 'Supplier' },
  amountLabel: { ar: '��لمبلغ', en: 'Amount' },
  itemsLabel: { ar: 'الأصناف', en: 'Items' },
  dateLabel: { ar: 'التاريخ', en: 'Date' },

  // Suppliers admin
  supplierId: { ar: 'المعرف', en: 'ID' },
  supplierCategory: { ar: 'التصنيف', en: 'Category' },
  supplierOrders: { ar: 'الطلبات', en: 'Orders' },
  supplierRating: { ar: 'التقييم', en: 'Rating' },
  supplierJoined: { ar: '✅ تاريخ الانضمام', en: 'Joined' },
  suspend: { ar: 'تعليق', en: 'Suspend' },
  activate: { ar: 'تفعيل', en: 'Activate' },
  viewProfile: { ar: 'عرض الملف', en: 'View Profile' },

  // Finance
  payoutId: { ar: 'رقم الدفعة', en: 'Payout ID' },
  period: { ar: 'الفترة', en: 'Period' },
  txnType: { ar: 'النوع', en: 'Type' },
  txnParty: { ar: 'الطرف', en: 'Party' },
  txnFee: { ar: 'العمولة', en: 'Fee' },
  txnNet: { ar: 'الصافي', en: 'Net' },

  // Audit
  auditUser: { ar: 'المستخدم', en: 'User' },
  auditAction: { ar: 'الإجراء', en: 'Action' },
  auditTarget: { ar: 'الهدف', en: 'Target' },
  auditIp: { ar: 'عنوان IP', en: 'IP Address' },
  auditTime: { ar: 'الوقت', en: 'Time' },

  // Shared table/page
  addNew: { ar: 'إضافة جديد', en: 'Add New' },
  editItem: { ar: 'تعديل', en: 'Edit' },
  deleteItem: { ar: 'حذف', en: 'Delete' },
  statusLabel: { ar: 'الحالة', en: 'Status' },
  nameLabel: { ar: 'الاسم', en: 'Name' },

  // Status values
  statusActive: { ar: 'نشط', en: 'Active' },
  statusSuspended: { ar: 'معلق', en: 'Suspended' },
  statusPendingApproval: { ar: 'قيد الموافقة', en: 'Pending Approval' },
  statusApproved: { ar: 'مقبول', en: 'Approved' },
  statusRejected: { ar: 'مرفوض', en: 'Rejected' },
  statusCompleted: { ar: 'مكتمل', en: 'Completed' },
  statusOpen: { ar: 'مفتوح', en: 'Open' },
  statusInProgress: { ar: 'قيد المعالجة', en: 'In Progress' },
  statusResolved: { ar: 'محلول', en: 'Resolved' },
  statusClosed: { ar: 'مغلق', en: 'Closed' },
  statusUrgent: { ar: 'عاجل', en: 'Urgent' },
  statusSettled: { ar: 'مسوّى', en: 'Settled' },
  statusProcessed: { ar: 'معالج', en: 'Processed' },
  statusEnabled: { ar: 'مفعّل', en: 'Enabled' },
  statusDisabled: { ar: 'معطّل', en: 'Disabled' },

  // ── Buyers page ──────────────────────────────────────────────
  searchBuyer:    { ar: 'بحث باسم المشتري…', en: 'Search buyer…' },
  buyerId:        { ar: 'الرقم', en: 'ID' },
  buyerName:      { ar: 'الاسم', en: 'Name' },
  buyerType:      { ar: 'النوع', en: 'Type' },
  ordersCount:    { ar: 'الطلبات', en: 'Orders' },
  buyerSpend:     { ar: 'الإنفاق الكلي', en: 'Total Spend' },
  joinedDate:     { ar: 'تاريخ الانضمام', en: 'Joined' },

  // ── Countries page ───────────────────────────────────────────
  countryName:    { ar: '��لدولة', en: 'Country' },
  currency:       { ar: 'العملة', en: 'Currency' },
  vat:            { ar: 'ضريبة القيمة المضافة', en: 'VAT' },
  languages:      { ar: 'اللغات', en: 'Languages' },
  enabledLabel:   { ar: 'مفعّل', en: 'Enabled' },

  // ── Zones page ───────────────────────────────────────────────
  addZone:        { ar: 'منطقة جديدة', en: 'New Zone' },
  addCountry:     { ar: 'إضافة دولة', en: 'Add Country' },
  editCountry:    { ar: 'تعديل الدولة', en: 'Edit Country' },
  editZone:       { ar: 'تعديل المنطقة', en: 'Edit Zone' },
  countryCode:    { ar: 'رمز الدولة', en: 'Country Code' },
  editAddress:    { ar: 'تعديل العنوان', en: 'Edit Address' },
  emailReadOnly:  { ar: 'لا يمكن تغيير البريد من هنا', en: 'Email cannot be changed here' },
  zoneName:       { ar: 'المنطقة', en: 'Zone' },
  zoneCity:       { ar: 'المدينة', en: 'City' },
  deliveryFee:    { ar: 'رسوم التوصيل', en: 'Delivery Fee' },
  minOrder:       { ar: 'الحد الأدنى للطلب', en: 'Min. Order' },

  // ── Roles page ───────────────────────────────────────────────
  editPermissions:     { ar: 'تعديل الصلاحيات', en: 'Edit Permissions' },
  addRole:             { ar: 'إضافة دور جديد', en: 'Add New Role' },
  permissionMatrix:    { ar: 'مصفوفة الصلاحيات', en: 'Permission Matrix' },
  permissionMatrixDesc:{ ar: 'عرض الصلاحيات لكل دور حسب الوحدة', en: 'Permissions per role by module' },
  moduleLabel:         { ar: 'الوحدة', en: 'Module' },

  // ── Support tickets page ─────────────────────────────────────
  searchTickets:  { ar: 'بحث في التذاكر…', en: 'Search tickets…' },
  ticketId:       { ar: 'رقم التذكرة', en: 'Ticket ID' },
  ticketSubject:  { ar: 'الموضوع', en: 'Subject' },
  userLabel:      { ar: 'المستخدم', en: 'User' },
  priorityLabel:  { ar: 'الأولوية', en: 'Priority' },
  openLabel:      { ar: 'فتح', en: 'Open' },

  // Admin shared
  noData:           { ar: 'لا توجد بيانات', en: 'No data available' },
  actionLabel:      { ar: 'إجراء', en: 'Action' },
  exportCsv:        { ar: 'تصدير CSV', en: 'Export CSV' },
  supplierName:     { ar: 'اسم المورد', en: 'Supplier' },

} satisfies Record<string, DictEntry>

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
      return new Intl.NumberFormat(LANG_LOCALE[lang as Lang] ?? 'en-US', {
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
      // Fallback chain: requested lang → English → Arabic (always defined)
      return entry[lang as keyof typeof entry] ?? entry.en ?? entry.ar
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
