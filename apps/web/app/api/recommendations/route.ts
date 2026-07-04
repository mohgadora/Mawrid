import { NextRequest, NextResponse } from 'next/server'
import { generateText, gateway } from 'ai'
import { PRODUCTS, getProduct } from '@/lib/data'
import type { Role } from '@/lib/config'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const recentIds: string[] = body.recentIds ?? []
    const role: Role = body.role ?? 'consumer'
    const lang: string = body.lang ?? 'en'

    // Build context from recently viewed products
    const recentProducts = recentIds
      .map((id) => getProduct(id))
      .filter(Boolean)
      .slice(0, 5)

    const recentContext =
      recentProducts.length > 0
        ? recentProducts
            .map((p) => `- ${p!.nameEn} (category: ${p!.categorySlug}, price: $${p!.basePrice}/carton)`)
            .join('\n')
        : 'No recent history'

    const allProductIds = PRODUCTS.map((p) => p.id).join(', ')

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

    // Validate IDs and filter
    const recommended = ids
      .map((id) => getProduct(id))
      .filter(Boolean)
      .slice(0, 6)

    // Fallback: if AI returned nothing, use top sellers
    if (recommended.length === 0) {
      const fallback = [...PRODUCTS]
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 6)
      return NextResponse.json({ products: fallback, source: 'fallback' })
    }

    return NextResponse.json({ products: recommended, source: 'ai' })
  } catch (err) {
    console.error('[recommendations]', err)
    // Graceful fallback
    const fallback = [...PRODUCTS].sort((a, b) => b.sold - a.sold).slice(0, 6)
    return NextResponse.json({ products: fallback, source: 'fallback' })
  }
}
