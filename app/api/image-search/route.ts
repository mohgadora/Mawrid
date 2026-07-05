import { NextRequest, NextResponse } from 'next/server'
import { generateText, gateway } from 'ai'
import { getProducts } from '@/services/catalog'
import { rateLimit, identityKey } from '@/lib/rate-limit'
import { getApiUser } from '@/lib/api-helpers'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB سقف حجم الصورة (تحكّم بالتكلفة)
const RATE_PER_MIN = Number(process.env.AI_RATELIMIT_PER_MIN ?? 10)
const RATE_PER_DAY = Number(process.env.AI_RATELIMIT_PER_DAY ?? 100)
const AI_CONFIGURED = Boolean(process.env.AI_GATEWAY_API_KEY)

export async function POST(req: NextRequest) {
  // فشل مغلق: لا نشغّل نقطة AI مكلفة بلا إعداد.
  if (!AI_CONFIGURED) {
    return NextResponse.json({ error: 'AI search is unavailable' }, { status: 503 })
  }

  // حدّ مفضّلٌ حسب المستخدم (وإلا IP): في الدقيقة وفي اليوم.
  const user = await getApiUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const key = identityKey(req, 'image-search', user.id)
  const perMin = rateLimit(`${key}:m`, RATE_PER_MIN, 60_000)
  if (perMin) return perMin
  const perDay = rateLimit(`${key}:d`, RATE_PER_DAY, 24 * 60 * 60_000)
  if (perDay) return perDay

  try {
    const formData = await req.formData()
    const file = formData.get('image') as File | null
    const lang = (formData.get('lang') as string) ?? 'en'

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image too large (max 5MB)' }, { status: 413 })
    }
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      return NextResponse.json({ error: 'Unsupported image type' }, { status: 415 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mediaType = (file.type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp'

    // Ask GPT-4o to identify the product category and key attributes from the image
    const { text } = await generateText({
      model: gateway('openai/gpt-4o'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                'You are a wholesale marketplace product classifier. Look at this image and identify:\n' +
                '1. The product type or category (e.g. rice, cooking oil, soft drinks, canned food, detergent, snacks, milk, sugar)\n' +
                '2. Key product attributes (color, packaging, brand if visible)\n\n' +
                'Respond ONLY with a JSON object like:\n' +
                '{"keywords":["rice","basmati","grains"],"category":"grains","description":"basmati rice in sack packaging"}\n' +
                'No markdown, no extra text.',
            },
            {
              type: 'image',
              image: base64,
              mediaType,
            },
          ],
        },
      ],
    })

    let parsed: { keywords?: string[]; category?: string; description?: string } = {}
    try {
      parsed = JSON.parse(text.trim())
    } catch {
      // Fallback: extract keywords from raw text
      parsed = { keywords: text.toLowerCase().split(/\W+/).filter(Boolean).slice(0, 5), description: text }
    }

    const { keywords = [], category, description = '' } = parsed

    // Score products by matching keywords against name, category, description
    const PRODUCTS = await getProducts()
    const scored = PRODUCTS.map((p) => {
      const haystack = [
        p.nameAr,
        p.nameEn,
        p.categorySlug,
        p.descriptionAr,
        p.descriptionEn,
        p.supplierAr,
        p.supplierEn,
      ]
        .join(' ')
        .toLowerCase()

      let score = 0
      for (const kw of keywords) {
        if (haystack.includes(kw.toLowerCase())) score += 2
      }
      if (category && p.categorySlug === category) score += 5
      // Partial category match
      if (category && p.categorySlug.includes(category)) score += 2
      return { product: p, score }
    })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((s) => s.product)

    return NextResponse.json({
      results: scored,
      description: lang === 'ar' ? `نتائج مطابقة: ${description}` : description,
      keywords,
    })
  } catch (err) {
    console.error('[image-search]', err)
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 })
  }
}
