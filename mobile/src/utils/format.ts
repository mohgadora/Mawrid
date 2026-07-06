const currencySymbols: Record<string, string> = {
  SAR: 'ر.س',
  USD: '$',
  AED: 'د.إ',
  EGP: 'ج.م',
}

const exchangeRates: Record<string, number> = {
  SAR: 1,
  USD: 0.267,
  AED: 0.98,
  EGP: 13.05,
}

export function formatPrice(amount: number, currency = 'SAR', lang = 'ar'): string {
  const rate = exchangeRates[currency] ?? 1
  const converted = amount * rate
  const symbol = currencySymbols[currency] ?? currency
  const formatted = converted.toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  return lang === 'ar' ? `${formatted} ${symbol}` : `${symbol}${formatted}`
}

export function formatDate(dateStr: string, lang = 'ar'): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str
}
