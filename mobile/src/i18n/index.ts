import { I18n } from 'i18n-js'
import * as Localization from 'expo-localization'

const translations = {
  ar: {
    // Auth
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    name: 'الاسم الكامل',
    phone: 'رقم الجوال',
    forgotPassword: 'نسيت كلمة المرور؟',
    noAccount: 'ليس لديك حساب؟',
    haveAccount: 'لديك حساب بالفعل؟',
    loginBtn: 'دخول',
    registerBtn: 'إنشاء الحساب',
    loginSuccess: 'مرحباً بك!',
    loginFailed: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',

    // Navigation
    home: 'الرئيسية',
    products: 'المنتجات',
    cart: 'السلة',
    orders: 'طلباتي',
    profile: 'حسابي',

    // Home
    welcome: 'مرحباً',
    featuredProducts: 'منتجات مميزة',
    flashSales: 'تخفيضات محدودة',
    categories: 'الفئات',
    viewAll: 'عرض الكل',
    topDeals: 'أفضل العروض',

    // Products
    search: 'بحث عن منتج...',
    filter: 'تصفية',
    sort: 'ترتيب',
    addToCart: 'أضف للسلة',
    buyNow: 'اشتر الآن',
    inStock: 'متوفر',
    outOfStock: 'نفذ المخزون',
    productDetails: 'تفاصيل المنتج',
    description: 'الوصف',
    specifications: 'المواصفات',
    reviews: 'التقييمات',
    similarProducts: 'منتجات مشابهة',
    minOrder: 'الحد الأدنى للطلب',
    unit: 'وحدة',

    // Cart
    myCart: 'سلة التسوق',
    emptyCart: 'السلة فارغة',
    emptyCartSub: 'ابدأ التسوق وأضف منتجات إلى سلتك',
    total: 'الإجمالي',
    subtotal: 'المجموع',
    shipping: 'الشحن',
    tax: 'الضريبة',
    checkout: 'إتمام الطلب',
    remove: 'حذف',
    quantity: 'الكمية',

    // Orders
    myOrders: 'طلباتي',
    orderNumber: 'رقم الطلب',
    orderDate: 'تاريخ الطلب',
    orderStatus: 'حالة الطلب',
    orderDetails: 'تفاصيل الطلب',
    noOrders: 'لا توجد طلبات بعد',
    noOrdersSub: 'ابدأ التسوق الآن',
    cancelOrder: 'إلغاء الطلب',
    trackOrder: 'تتبع الطلب',

    // Status
    pending: 'قيد الانتظار',
    confirmed: 'مؤكد',
    processing: 'قيد التجهيز',
    shipped: 'تم الشحن',
    delivered: 'تم التوصيل',
    cancelled: 'ملغى',
    completed: 'مكتمل',

    // Profile
    myProfile: 'بياناتي',
    editProfile: 'تعديل البيانات',
    changePassword: 'تغيير كلمة المرور',
    myAddresses: 'عناويني',
    notifications: 'الإشعارات',
    language: 'اللغة',
    currency: 'العملة',
    logout: 'تسجيل الخروج',
    logoutConfirm: 'هل تريد تسجيل الخروج؟',
    save: 'حفظ',
    cancel: 'إلغاء',
    yes: 'نعم',
    no: 'لا',

    // Checkout
    shippingAddress: 'عنوان التوصيل',
    paymentMethod: 'طريقة الدفع',
    cod: 'الدفع عند الاستلام',
    bankTransfer: 'تحويل بنكي',
    placeOrder: 'تأكيد الطلب',
    orderPlaced: 'تم تقديم طلبك بنجاح!',
    orderPlacedSub: 'سيتم التواصل معك قريباً لتأكيد طلبك',

    // Errors
    networkError: 'خطأ في الاتصال بالإنترنت',
    serverError: 'حدث خطأ في السيرفر',
    tryAgain: 'حاول مجدداً',
    required: 'هذا الحقل مطلوب',
    invalidEmail: 'البريد الإلكتروني غير صحيح',
    loading: 'جاري التحميل...',
  },
  en: {
    login: 'Sign In',
    register: 'Create Account',
    email: 'Email',
    password: 'Password',
    name: 'Full Name',
    phone: 'Phone Number',
    forgotPassword: 'Forgot Password?',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    loginBtn: 'Sign In',
    registerBtn: 'Create Account',
    loginSuccess: 'Welcome back!',
    loginFailed: 'Invalid email or password',

    home: 'Home',
    products: 'Products',
    cart: 'Cart',
    orders: 'Orders',
    profile: 'Profile',

    welcome: 'Welcome',
    featuredProducts: 'Featured Products',
    flashSales: 'Flash Sales',
    categories: 'Categories',
    viewAll: 'View All',
    topDeals: 'Top Deals',

    search: 'Search products...',
    filter: 'Filter',
    sort: 'Sort',
    addToCart: 'Add to Cart',
    buyNow: 'Buy Now',
    inStock: 'In Stock',
    outOfStock: 'Out of Stock',
    productDetails: 'Product Details',
    description: 'Description',
    specifications: 'Specifications',
    reviews: 'Reviews',
    similarProducts: 'Similar Products',
    minOrder: 'Min. Order',
    unit: 'unit',

    myCart: 'My Cart',
    emptyCart: 'Your cart is empty',
    emptyCartSub: 'Start shopping and add products to your cart',
    total: 'Total',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    tax: 'Tax',
    checkout: 'Checkout',
    remove: 'Remove',
    quantity: 'Quantity',

    myOrders: 'My Orders',
    orderNumber: 'Order #',
    orderDate: 'Order Date',
    orderStatus: 'Status',
    orderDetails: 'Order Details',
    noOrders: 'No orders yet',
    noOrdersSub: 'Start shopping now',
    cancelOrder: 'Cancel Order',
    trackOrder: 'Track Order',

    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    completed: 'Completed',

    myProfile: 'My Profile',
    editProfile: 'Edit Profile',
    changePassword: 'Change Password',
    myAddresses: 'My Addresses',
    notifications: 'Notifications',
    language: 'Language',
    currency: 'Currency',
    logout: 'Sign Out',
    logoutConfirm: 'Are you sure you want to sign out?',
    save: 'Save',
    cancel: 'Cancel',
    yes: 'Yes',
    no: 'No',

    shippingAddress: 'Shipping Address',
    paymentMethod: 'Payment Method',
    cod: 'Cash on Delivery',
    bankTransfer: 'Bank Transfer',
    placeOrder: 'Place Order',
    orderPlaced: 'Order Placed Successfully!',
    orderPlacedSub: 'We will contact you shortly to confirm your order',

    networkError: 'Network connection error',
    serverError: 'Server error occurred',
    tryAgain: 'Try Again',
    required: 'This field is required',
    invalidEmail: 'Invalid email address',
    loading: 'Loading...',
  },
}

export const i18n = new I18n(translations)
i18n.defaultLocale = 'ar'
i18n.locale = 'ar'
i18n.enableFallback = true

export function setLocale(locale: 'ar' | 'en') {
  i18n.locale = locale
}

export function t(key: string, options?: Record<string, unknown>) {
  return i18n.t(key, options)
}

export function isRTL(lang: string) {
  return lang === 'ar'
}
