/** ميزات العرض التجريبي — مخفية في الإنتاج ما لم يُفعَّل صراحةً. */
export const DEMO_FEATURES_ENABLED =
  process.env.NEXT_PUBLIC_DEMO_FEATURES === 'true' ||
  process.env.NODE_ENV !== 'production'
