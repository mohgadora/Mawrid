import type { Metadata } from 'next'
import { OrderDetailView } from '@/components/views/order-detail-view'

export const metadata: Metadata = {
  title: 'تفاصيل الطلب | مورِد',
  description: 'تتبّع طلبك ومسار حالته لحظة بلحظة.',
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <OrderDetailView id={id} />
}
