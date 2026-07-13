import { NextRequest } from 'next/server'
import { ok, apiError } from '@/lib/api-helpers'
import { getProductVariants } from '@/services/variants'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const data = await getProductVariants(id)
    return ok(data)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
