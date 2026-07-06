import { NextRequest } from 'next/server'
import { getApiUser, unauthorized, badRequest, ok, apiError } from '@/lib/api-helpers'
import { getReorderTemplates, saveReorderTemplate } from '@/services/account'

export async function GET(req: NextRequest) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  try {
    return ok(await getReorderTemplates(user))
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  try {
    const body = await req.json().catch(() => null)
    if (!body?.name || !body?.items?.length) return badRequest('name and items are required')
    return ok(await saveReorderTemplate(body.name, body.items, user), 201)
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
