import { clone, delay, makeId, readStore, writeStore } from './core'

export type QuoteStatus = 'submitted' | 'quoted' | 'expired'

export type Quote = {
  id: string
  ref: string
  createdAt: string
  productAr: string
  productEn: string
  categorySlug: string
  qty: number
  targetPriceUsd?: number
  notes?: string
  status: QuoteStatus
  /** Number of supplier quotes received (mocked). */
  responses: number
  bestPriceUsd?: number
}

const STORE_KEY = 'mawrid_quotes'

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function seed(): Quote[] {
  return [
    {
      id: makeId('rfq'),
      ref: 'RFQ-1042',
      createdAt: daysAgo(2),
      productAr: 'أرز بسمتي فاخر - كميات كبيرة',
      productEn: 'Premium basmati rice - bulk',
      categorySlug: 'grains',
      qty: 500,
      targetPriceUsd: 36,
      status: 'quoted',
      responses: 4,
      bestPriceUsd: 35,
    },
    {
      id: makeId('rfq'),
      ref: 'RFQ-1039',
      createdAt: daysAgo(5),
      productAr: 'زيت دوار الشمس - 1.5 لتر',
      productEn: 'Sunflower oil - 1.5L',
      categorySlug: 'oils',
      qty: 300,
      status: 'submitted',
      responses: 1,
    },
  ]
}

function load(): Quote[] {
  const existing = readStore<Quote[] | null>(STORE_KEY, null)
  if (existing) return existing
  const seeded = seed()
  writeStore(STORE_KEY, seeded)
  return seeded
}

export async function getQuotes(): Promise<Quote[]> {
  const quotes = load().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  return delay(clone(quotes))
}

export type NewQuoteInput = {
  productAr: string
  productEn: string
  categorySlug: string
  qty: number
  targetPriceUsd?: number
  notes?: string
}

export async function createQuote(input: NewQuoteInput): Promise<Quote> {
  const quote: Quote = {
    id: makeId('rfq'),
    ref: `RFQ-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: new Date().toISOString(),
    status: 'submitted',
    responses: 0,
    ...input,
  }
  const quotes = load()
  quotes.unshift(quote)
  writeStore(STORE_KEY, quotes)
  return delay(clone(quote), 500)
}
