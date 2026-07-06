import { NextRequest, NextResponse } from 'next/server'
import { getProducts } from '@/services/catalog'
import type { Role } from '@/lib/config'
import { rateLimit, identityKey } from '@/lib/rate-limit'
import { getApiUser } from '@/lib/api-helpers'

const RATE_PER_MIN = Number(process.env.AI_RATELIMIT_PER_MIN ?? 10)
const RATE_PER_DAY = Number(process.env.AI_RATELIMIT_PER_DAY ?? 100)
const AI_CONFIGURED = Boolean(process.env.AI_GATEWAY_API_KEY)

export async function POST(req: NextRequest) {
  // بلا إعداد AI نُرجع أفضل المنتجات مبيعاً (fallback بدل 503)
  if (!AI_CONFIGURED) {
    const products = await getProducts()
    return NextResponse.json({ products: [...products].sort((a, b) => b.sold - a.sold).slice(0, 6), source: 'fallback' })
  }

  const user = await getApiUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const key = identityKey(req, 'recommendations', user.id)
  const perMin = rateLimit(`${key}:m`, RATE_PER_MIN, 60_000)
  if (perMin) return perMin
  const perDay = rateLimit(`${key}:d`, RATE_PER_DAY, 24 * 60 * 60_000)
  if (perDay) return perDay

  try {
    const body = await req.json()
    // سقف على المدخلات القادمة من العميل (تحكّم بحجم الـ prompt والتكلفة)
    const recentIds: string[] = Array.isArray(body.recentIds) ? body.recentIds.slice(0, 20) : []
    const role: Role = user.role === 'merchant' ? 'merchant' : 'consumer'

    // Build context from recently viewed products
    const PRODUCTS = await getProducts()
    const recentProducts = recentIds
      .map((id) => PRODUCTS.find((p) => p.id === id))
      .filter(Boolean)
      .slice(0, 5)

    const allProductIds = PRODUCTS.map((p) => p.id).join(', ')

    const recentContext =
      recentProducts.length > 0
        ? recentProducts
            .map((p) => `- ${p!.nameEn} (category: ${p!.categorySlug}, price: $${p!.basePrice}/carton)`)
            .join('\n')
        : 'No recent history'

    // Dynamic import avoids Turbopack stale-cache issues with newly-installed packages
    const { generateText, gateway } = await import('ai')

    const { text } = await generateText({
      model: gateway('openai/gpt-4o-mini'),
      messages: [
        {
          role: 'user',
          content:
            `You are a smart wholesale marketplace recommendation engine.\n\n` +
            `User role: ${role} (${role === 'merchant' ? 'buys in bulk for resale' : 'individual consumer'})\n` +
            `Recently viewed:\n${recentContext}\n\n` +
            `Available product IDs: ${allProductIds}\n\n` +
            `Based on the user's role and browsing history, select the 6 most relevant product IDs.\n` +
            `For merchants: prioritize high-selling, high-margin wholesale staples.\n` +
            `For consumers: prioritize popular, everyday products.\n` +
            `If no history, recommend best-sellers across categories.\n\n` +
            `Respond ONLY with a JSON array of product IDs, e.g.: ["rice-basmati","sunflower-oil"]\n` +
            `No markdown, no explanation.`,
        },
      ],
    })

    let ids: string[] = []
    try {
      ids = JSON.parse(text.trim())
      if (!Array.isArray(ids)) ids = []
    } catch {
      ids = []
    }

    const recommended = ids
      .map((id) => PRODUCTS.find((p) => p.id === id))
      .filter(Boolean)
      .slice(0, 6)

    if (recommended.length === 0) {
      const fallback = [...PRODUCTS].sort((a, b) => b.sold - a.sold).slice(0, 6)
      return NextResponse.json({ products: fallback, source: 'fallback' })
    }

    return NextResponse.json({ products: recommended, source: 'ai' })
  } catch (err) {
    console.error('[recommendations]', err)
    const fallback = await getProducts()
    return NextResponse.json({ products: fallback.sort((a, b) => b.sold - a.sold).slice(0, 6), source: 'fallback' })
  }
}
