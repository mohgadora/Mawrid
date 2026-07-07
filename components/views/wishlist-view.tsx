'use client'

import { Heart, Trash2 } from 'lucide-react'
import { useWishlist } from '@/lib/wishlist'
import { useI18n } from '@/lib/i18n'
import { ProductCard } from '@/components/product-card'
import { EmptyState } from '@/components/empty-state'
import { useProducts } from '@/lib/use-products'

export function WishlistView() {
  const { ids, clear } = useWishlist()
  const { t, lang } = useI18n()
  const { products: allProducts } = useProducts()

  const products = ids
    .map((id) => allProducts.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined)
    .filter(Boolean)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-24 lg:pb-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground text-balance">
            {lang === 'ar' ? 'المفضلة' : 'Wishlist'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {products.length > 0
              ? lang === 'ar'
                ? `${products.length} منتج محفوظ`
                : `${products.length} saved product${products.length !== 1 ? 's' : ''}`
              : lang === 'ar'
              ? 'لا توجد منتجات محفوظة'
              : 'No saved products'}
          </p>
        </div>
        {products.length > 0 && (
          <button
            onClick={clear}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
            {lang === 'ar' ? 'مسح الكل' : 'Clear all'}
          </button>
        )}
      </header>

      {products.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={lang === 'ar' ? 'قائمة المفضلة فارغة' : 'Your wishlist is empty'}
          description={
            lang === 'ar'
              ? 'احفظ المنتجات التي تعجبك للشراء لاحقاً'
              : 'Save products you like to buy them later'
          }
          actionLabel={t('continueShopping')}
          actionHref="/"
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
