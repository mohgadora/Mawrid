import type { Metadata } from 'next'
import { OrdersView } from '@/components/views/orders-view'

export const metadata: Metadata = {
  title: 'طلباتي | مورِد',
  description: 'تابع حالة طلباتك وتتبّعها لحظة بلحظة.',
}

export default function OrdersPage() {
  return <OrdersView />
}
