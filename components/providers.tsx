'use client'

import { SWRConfig } from 'swr'
import { I18nProvider } from '@/lib/i18n'
import { CartProvider } from '@/lib/cart'
import { RoleProvider } from '@/lib/role'
import { ThemeProvider } from '@/lib/theme'
import { ToastProvider } from '@/lib/toast'
import { SubscriptionProvider } from '@/lib/subscription'
import { NotificationsProvider } from '@/lib/notifications'
import { RecentlyViewedProvider } from '@/lib/recently-viewed'
import { WishlistProvider } from '@/lib/wishlist'
import { CompareProvider } from '@/lib/compare'
import { SaveForLaterProvider } from '@/lib/save-for-later'
import { MiniCartProvider } from '@/lib/mini-cart'
import { MiniCart } from '@/components/mini-cart'
import { BottomNav } from '@/components/bottom-nav'
import { CompareBar } from '@/components/compare-bar'
import { RouteTransition } from '@/components/route-transition'
import { LiveChat } from '@/components/live-chat'
import { DEMO_FEATURES_ENABLED } from '@/lib/feature-flags'

/**
 * Global SWR config so revisiting a screen shows cached data instantly instead
 * of a fresh skeleton:
 * - `dedupingInterval` collapses repeat requests within a 30s window.
 * - `revalidateOnFocus: false` stops needless refetches when tabbing back.
 * - `keepPreviousData` keeps the last result on screen during key changes,
 *   eliminating skeleton flashes on navigation.
 */
const swrConfig = {
  dedupingInterval: 30_000,
  revalidateOnFocus: false,
  keepPreviousData: true,
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={swrConfig}>
      <ThemeProvider>
        <I18nProvider>
          <SubscriptionProvider>
            <RoleProvider>
              <CartProvider>
                <ToastProvider>
                  <NotificationsProvider>
                    <RecentlyViewedProvider>
                      <WishlistProvider>
                        <SaveForLaterProvider>
                          <MiniCartProvider>
                            <CompareProvider>
                              <RouteTransition>{children}</RouteTransition>
                              <BottomNav />
                              <CompareBar />
                              {DEMO_FEATURES_ENABLED && <LiveChat />}
                              <MiniCart />
                            </CompareProvider>
                          </MiniCartProvider>
                        </SaveForLaterProvider>
                      </WishlistProvider>
                    </RecentlyViewedProvider>
                  </NotificationsProvider>
                </ToastProvider>
              </CartProvider>
            </RoleProvider>
          </SubscriptionProvider>
        </I18nProvider>
      </ThemeProvider>
    </SWRConfig>
  )
}
