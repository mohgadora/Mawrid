import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, ok, serverError, badRequest } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { supplier, user, product, order, orderLine, sellerEarning } from '@/lib/db/schema'
import { eq, count, sum, desc, inArray } from 'drizzle-orm'
import { writeAuditLog } from '@/lib/audit'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  const { id } = await params
  try {
    const [sup] = await db.select().from(supplier).where(eq(supplier.id, id)).limit(1)
    if (!sup) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Linked user account
    let linkedUser: { id: string; email: string; name: string; emailVerified: boolean; createdAt: Date } | null = null
    if (sup.userId) {
      const [u] = await db
        .select({ id: user.id, email: user.email, name: user.name, emailVerified: user.emailVerified, createdAt: user.createdAt })
        .from(user).where(eq(user.id, sup.userId)).limit(1)
      if (u) linkedUser = u
    }

    // Stats
    const productIds = (
      await db.select({ id: product.id }).from(product).where(eq(product.supplierId, id))
    ).map((p) => p.id)

    const [productCount] = await db.select({ c: count() }).from(product).where(eq(product.supplierId, id))

    let orderCount = 0
    let totalRevenue = 0
    if (productIds.length) {
      const lines = await db.select({ orderId: orderLine.orderId }).from(orderLine).where(inArray(orderLine.productId, productIds))
      const orderIds = [...new Set(lines.map((l) => l.orderId))]
      orderCount = orderIds.length
      const [rev] = await db.select({ total: sum(sellerEarning.grossAmount) }).from(sellerEarning).where(eq(sellerEarning.supplierId, id))
      totalRevenue = Number(rev?.total ?? 0)
    }

    return ok({
      id: sup.id,
      name: sup.name,
      nameAr: sup.nameAr,
      logo: sup.logo,
      bannerUrl: sup.bannerUrl,
      phone: sup.phone,
      email: sup.email,
      address: sup.address,
      city: sup.city,
      country: sup.country,
      status: sup.status,
      verified: sup.verified,
      commissionRate: sup.commissionRate ? Number(sup.commissionRate) : null,
      minOrder: sup.minOrder,
      rating: Number(sup.rating),
      reviewCount: sup.reviewCount,
      socialLinks: (sup.socialLinks as Record<string, string>) ?? {},
      shippingPolicy: sup.shippingPolicy,
      returnPolicy: sup.returnPolicy,
      createdAt: sup.createdAt.toISOString(),
      updatedAt: sup.updatedAt.toISOString(),
      linkedUser,
      stats: {
        products: productCount?.c ?? 0,
        orders: orderCount,
        totalRevenue,
      },
    })
  } catch (err) { return serverError(err) }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req)
  if (guard instanceof NextResponse) return guard
  const { id } = await params
  try {
    const body = await req.json() as Record<string, unknown>

    // Reset password: send email via Better Auth
    if (body.action === 'reset_password') {
      const [sup] = await db.select({ email: supplier.email, userId: supplier.userId }).from(supplier).where(eq(supplier.id, id)).limit(1)
      if (!sup) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      const emailToReset = sup.email ?? (sup.userId
        ? (await db.select({ email: user.email }).from(user).where(eq(user.id, sup.userId)).limit(1))[0]?.email
        : null)

      if (!emailToReset) return badRequest('No email address found for this supplier')

      const baseUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
      await fetch(`${baseUrl}/api/auth/forget-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToReset, redirectTo: `${baseUrl}/partner/sign-in` }),
      })
      await writeAuditLog({ userId: guard.id, action: 'supplier.reset_password', entity: 'supplier', entityId: id })
      return ok({ sent: true, email: emailToReset })
    }

    // Update fields
    const allowed: (keyof typeof supplier.$inferInsert)[] = [
      'nameAr', 'name', 'phone', 'email', 'address', 'city',
      'commissionRate', 'verified', 'status', 'minOrder',
      'shippingPolicy', 'returnPolicy',
    ]
    const updates: Record<string, unknown> = { updatedAt: new Date() }
    for (const key of allowed) {
      if (key in body) updates[key] = body[key as string]
    }

    await db.update(supplier).set(updates as never).where(eq(supplier.id, id))
    await writeAuditLog({ userId: guard.id, action: 'supplier.update', entity: 'supplier', entityId: id })
    return ok({ updated: true })
  } catch (err) { return serverError(err) }
}

export function OPTIONS() { return new Response(null, { status: 204 }) }
