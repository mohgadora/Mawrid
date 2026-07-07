import { NextRequest } from 'next/server'
import { getApiUser, unauthorized, ok, apiError, badRequest } from '@/lib/api-helpers'
import { removeAddress, updateAddress } from '@/services/account'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  try {
    const { id } = await params
    const body = await req.json().catch(() => null)
    if (!body) return badRequest('request body is required')
    return ok(await updateAddress(id, body, user))
  } catch (err) {
    return apiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  try {
    const { id } = await params
    await removeAddress(id, user)
    return ok({ deleted: true })
  } catch (err) {
    return apiError(err)
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
