'use client'

import { Heart } from 'lucide-react'
import { useWishlist } from '@/lib/wishlist'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface WishlistButtonProps {
  productId: string
  className?: string
  size?: 'sm' | 'md'
}

export function WishlistButton({ productId, className, size = 'md' }: WishlistButtonProps) {
  const { toggle, isWishlisted } = useWishlist()
  const { lang } = useI18n()
  const active = isWishlisted(productId)

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    toggle(productId)
  }

  const label = active
    ? lang === 'ar' ? 'إزالة من المفضلة' : 'Remove from wishlist'
    : lang === 'ar' ? 'أضف للمفضلة' : 'Add to wishlist'

  return (
    <button
      onClick={handleClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'grid place-items-center rounded-full border transition-all',
        size === 'sm'
          ? 'size-7 border-border bg-background/80 backdrop-blur-sm hover:bg-background'
          : 'size-9 border-border bg-background/80 backdrop-blur-sm hover:bg-background',
        active && 'border-red-400/60 bg-red-50 dark:bg-red-950/40',
        className,
      )}
    >
      <Heart
        className={cn(
          'transition-all',
          size === 'sm' ? 'size-3.5' : 'size-4',
          active
            ? 'fill-red-500 text-red-500'
            : 'text-muted-foreground',
        )}
      />
    </button>
  )
}
