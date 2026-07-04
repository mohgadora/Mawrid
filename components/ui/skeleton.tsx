import { cn } from '@/lib/utils'

/** Base shimmer block. All other skeletons compose this. */
export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      aria-hidden="true"
      className={cn('shimmer rounded-md bg-muted', className)}
      {...props}
    />
  )
}
