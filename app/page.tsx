import { Suspense } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { HeroCarousel } from '@/components/hero-carousel'
import { CategoryGrid } from '@/components/category-grid'
import { DealsSection } from '@/components/deals-section'
import { SavingsSection } from '@/components/savings-section'
import { ProductGrid } from '@/components/product-grid'
import { RecentlyViewedStrip } from '@/components/recently-viewed-strip'
import { AiRecommendations } from '@/components/ai-recommendations'
import { BundlesSection } from '@/components/bundles-section'
import { RequestProductBanner } from '@/components/request-product-banner'

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <HeroCarousel />
        <RecentlyViewedStrip />
        <AiRecommendations />
        <CategoryGrid />
        <RequestProductBanner />
        <DealsSection />
        <BundlesSection />
        <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-6" />}>
          <ProductGrid />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}
