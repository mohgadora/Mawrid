import type { Metadata } from 'next'
import { AccountView } from '@/components/views/account-view'

export const metadata: Metadata = {
  title: 'حسابي | مورِد',
  description: 'إدارة ملفك الشخصي والعناوين والفروع والمفضلة وقوالب إعادة الطلب.',
}

export default function AccountPage() {
  return <AccountView />
}
