import { NextRequest, NextResponse } from 'next/server'
import { generateText, gateway } from 'ai'
import { PRODUCTS } from '@/lib/data'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('image') as File | null
    const lang = (formData.get('lang') as string) ?? 'en'

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
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
