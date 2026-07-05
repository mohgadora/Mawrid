import { NextRequest } from 'next/server'
import { getApiUser, unauthorized, notFound, ok, apiError } from '@/lib/api-helpers'
import { getOrderById } from '@/services/orders'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getApiUser(req)
  if (!user) return unauthorized()
  try {
    const { id } = await params
    const order = await getOrderById(id, user)
    if (!order) return notFound('Order not found')
    return ok(order)
  } catch (err) {
    return apiError(err)
  }
}
