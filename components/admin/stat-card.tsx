import { type LucideProps } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatusChip } from '@/components/order-status'
import type { OrderStatus } from '@/lib/order-types'

/**
 * Maps arbitrary admin-domain status strings to a valid OrderStatus so every
 * status indicator in the admin reuses the same <StatusChip /> from the storefront.
 *
 *  admin "active"      → OrderStatus "confirmed"
 *  admin "inactive"    → OrderStatus "cancelled"
 *  admin "pending"     → OrderStatus "pending"
 *  admin "suspended"   → OrderStatus "cancelled"
 *  admin "approved"    → OrderStatus "delivered"
 *  admin "rejected"    → OrderStatus "cancelled"
 *  admin "open"        → OrderStatus "pending"
 *  admin "in_progress" → OrderStatus "processing"
 *  admin "resolved"    → OrderStatus "delivered"
 *  admin "closed"      → OrderStatus "cancelled"
 *  admin "completed"   → OrderStatus "delivered"
 *  admin "settled"     → OrderStatus "delivered"
 *  admin "processed"   → OrderStatus "packed"
 *  admin "current"     → OrderStatus "confirmed"
 *  admin "urgent"      → OrderStatus "pending"
 */
const ADMIN_STATUS_MAP: Record<string, OrderStatus> = {
  active: 'confirmed',
  inactive: 'cancelled',
  pending: 'pending',
  suspended: 'cancelled',
  approved: 'delivered',
  rejected: 'cancelled',
  open: 'pending',
  in_progress: 'processing',
  resolved: 'delivered',
  closed: 'cancelled',
  completed: 'delivered',
  settled: 'delivered',
  processed: 'packed',
  current: 'confirmed',
  urgent: 'pending',
  high: 'processing',
  medium: 'shipped',
  low: 'packed',
  enabled: 'confirmed',
  disabled: 'cancelled',
}

export function AdminStatusChip({
  status,
  size = 'sm',
}: {
  status: string
  size?: 'sm' | 'md'
}) {
  const mapped: OrderStatus = ADMIN_STATUS_MAP[status] ?? 'pending'
  return <StatusChip status={mapped} size={size} />
}

type Props = {
  label: string
  value: string | number
  growth?: number
  icon: React.ComponentType<LucideProps>
  className?: string
}

export function StatCard({ label, value, growth, icon: Icon, className }: Props) {
  const positive = growth !== undefined && growth >= 0
  return (
    <div className={cn('rounded-xl border border-border bg-card p-4', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          {growth !== undefined && (
            <p className={cn('mt-0.5 text-xs font-medium', positive ? 'text-success' : 'text-destructive')}>
              {positive ? '+' : ''}{growth}% مقارنة بالشهر السابق
            </p>
          )}
        </div>
        <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  )
}
