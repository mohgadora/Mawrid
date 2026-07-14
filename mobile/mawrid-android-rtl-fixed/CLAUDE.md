# Mawrid — Native Android Buyer App (CLAUDE.md)

Native Android buyer app for **Mawrid (مورِد)**, a B2B/B2C wholesale marketplace.
Kotlin + Jetpack Compose, MVVM (ViewModel + StateFlow), Hilt, Retrofit +
kotlinx.serialization, Coil, Navigation Compose, DataStore. minSdk 26, target/compile 35.
Android-only for now; keep domain/pricing framework-free so a KMP/iOS target is possible later.

Read this file first every session. Where it disagrees with
`Mawrid_Android_API_Auth_Architecture.md`, THIS file wins (that older doc describes an
abandoned FastAPI/Flutter design in places).

---

## Project location & build

- App lives at `~/Documents/Claude/Projects/Mawrid/mawrid-android` (package `com.mawrid.app`).
  NOT a git repo. The session cwd may be an unrelated app — always use absolute paths.
- The project sits under an **iCloud-synced Documents folder**, which drops conflict-copy
  files into `build/` mid-build and corrupts Gradle/D8. The root `build.gradle.kts` therefore
  **redirects build output to `~/.mawrid-build` — LEAVE THAT IN PLACE.**
  APK: `~/.mawrid-build/Mawrid/app/outputs/apk/debug/app-debug.apk`.
- Build (shell cwd resets between commands, so pass `-p`):
  `P=~/Documents/Claude/Projects/Mawrid/mawrid-android; "$P/gradlew" -p "$P" assembleDebug`
- **Kotlin gotcha:** never write a literal `/*` inside a comment (e.g. `/api/v1/*`) — Kotlin
  treats it as a nested comment and the build fails with "Unclosed comment".
- `compileSdk = 35` warns under AGP 8.5.2 (harmless).

## Backend (do not re-derive)

- Next.js + Drizzle + **better-auth** on **port 3600**. Emulator→host = `http://10.0.2.2:3600`
  (the debug `API_BASE_URL` default). Live VPS = `http://213.136.68.39:3600`.
- All `/api/v1` responses are wrapped `{ data: T }`; errors `{ error: string }`.
- **AUTH IS COOKIE-BASED, not Bearer.** Sign-in sets a `better-auth.session_token` cookie,
  captured by `SessionCookieJar` and replayed on every call. (The server's bearer plugin is
  NOT enabled — ignore any "Bearer" claim in the older doc.)
- **Money:** all prices are USD. Card shows `product.basePrice` (cheapest tier). Detail/cart use
  the qty-applicable tier. Consumer price = `wholesale × 1.15` (RETAIL_MARKUP). **Shipping is a
  flat $15 fee and must NOT get the markup.** Free-shipping threshold compares the *retail*
  subtotal. Display FX from USD: SAR 3.75, AED 3.67, KWD 0.31, EGP 48. Server is
  price-authoritative at checkout. Product `image` is a RELATIVE path (prefix with base origin).
- `GET /products/{id}` **404s on the VPS** — the app falls back to the list endpoint by design.
- Create-order address field is `line1` (not `street`); payment is `cod|card|bank`.
- Test account (VPS): `claude-test-buyer-24762@mawrid-test.local` / `TestPass!2026`.

## Design

Brand primary is warm **orange** (`#F04827` light / `#FF5636` dark). Cairo font. Arabic RTL
default + English.

---

## Status — verified working (on emulator, against live VPS)

- Clean `assembleDebug` (exit 0).
- Product list, navigation + bottom nav, product detail (tiers/MOQ/qty stepper),
  detail-404→list fallback, cart line math, sign-in (cookie auth), and authed endpoints
  (profile/orders/addresses/favorites all 200).
- Shipping-markup bug FIXED: `CartSummary.totalUsd` = retail(subtotal) + flat shipping;
  shipping/total render with `formatFinal` (FX only, no markup); free-shipping threshold uses
  the retail subtotal. Verified on-device: subtotal + shipping = total.
- **Checkout FULLY verified end-to-end on-device:** add-to-cart → checkout (saved address +
  COD) → `POST /orders` 201 → order-detail screen → order appears at top of orders list.
  NOTE: the server returns FREE shipping (shippingUsd:0) even below the app's $500 preview
  threshold, so the cart preview total over-estimates vs the authoritative order total — the
  order detail/list correctly show the server total via `formatFinal`.
- **Sign-out FIXED:** `AuthApi.signOut` now sends an `EmptyBody` (`{}`), and a new OkHttp
  interceptor in `NetworkModule` sets `Origin: <request origin>` on every request. better-auth
  rejected sign-out with 415 (no content-type), then 403 (Missing/Invalid Origin) — both needed.
  The trusted origin must equal the API base origin. Verified on-device: sign-out → 200, app
  returns to signed-out state; sign-in still 200 (Origin doesn't break sign-in or catalog).
- **Home card "من" (from) price label added:** `ProductCard` prefixes "من" when
  `basePrice < price-at-MOQ` (truthful only when a cheaper bulk tier exists). Verified on-device.
- **basePrice consistency FIXED (`Mappers.kt`):** the server reports different `basePrice` per
  endpoint (`/products`=18, `/account/favorites`=20 for white-sugar, same tiers). Mapper now
  derives `basePriceUsd = tiers.minOfOrNull { pricePerCarton } ?: basePrice`, so home and wishlist
  agree ("من 77.62"). Verified on-device.
- **Screens driven & verified on-device:** categories (GET 200, hierarchy, tap→filtered search);
  search (query/sort/in-stock filters, empty state); orders list; order detail; order **cancel**
  (`POST /cancel`→re-fetch→status "ملغي"); addresses **add** (`POST` 201) + list; wishlist display
  (`GET /favorites` 200).
- **Search sticky-category FIXED:** `SearchViewModel.clearCategory()` + a removable category chip
  in `SearchScreen` (tap = clear → re-search unscoped). Verified on-device: chip shows the
  category, tapping it drops `&category=` and broadens results. (The bottom-tab `restoreState`
  still brings back the scoped instance, but the chip makes it visible & clearable.)
- **Favorite/unfavorite WIRED:** heart action in `ProductDetailScreen` top bar → optimistic
  `toggleFavorite` (`ProductDetailViewModel` now injects Account/Auth, derives `isFavorite` from
  the favorites list on load; signed-out → routes to login). Verified on-device: POST 200 both
  ways, heart flips, snackbar. NOTE: no remove-button on wishlist cards yet (toggle only from detail).
- **Home state views:** `HomeScreen` now uses shared `LoadingState/ErrorState/EmptyState` (was
  hand-rolled inline). State audit: all list screens use `StateViews`; `AccountScreen` has no
  error path if the profile fetch fails, and `CheckoutScreen` has no loading indicator while
  addresses load (minor).
- **Visual parity (item 6) — home screen ported from the website source** (in
  `~/Downloads/Mawrid-claude-mawrid-store-settings-06uk64/`; spec in `docs/VISUAL_PARITY.md`):
  - **Dark theme forced** (`MawridTheme(darkTheme = true)`) + **Cairo font** (`res/font/cairo_variable.ttf`,
    `Type.kt` builds `CairoFamily` via `FontVariation`, `@OptIn(ExperimentalTextApi::class)`).
  - **Header** (`HomeScreen.MawridHeader`): orange utility strip + dark bar with the "م" logo badge,
    "مورِد" wordmark, bordered search field + filled orange "بحث" button, wishlist heart. Ported from
    `site-header.tsx`/`header-search.tsx`.
  - **Hero carousel + trust badges** (`HomeHero.kt`, from `hero-carousel.tsx`): server banner images
    (`{origin}/banners/*.png` — origin exposed via `HomeViewModel.baseOrigin`), light-wash gradient on
    the RTL start side, tagline pill, title, subtitle, two CTAs, auto-advancing dots (5s); 2×2 trust
    badges. Hero + AI header are full-span items inside the home `LazyVerticalGrid`.
  - **AI section header** (`HomeScreen.AiSectionHeader`, from `ai-recommendations.tsx`): Sparkles chip +
    title + subtitle + "تحديث" refresh chip (re-fetches the list).
  - **Product card** (`ProductCard.kt`, from `product-card.tsx`): bordered card, square image, wishlist
    heart in a circle top-trailing (wired via a per-screen `FavoritesViewModel` → `toggleFavorite`,
    optimistic; signed-out taps no-op), discount/verified badge top-leading, font-black orange price +
    "سعر التجزئة · للكرتون" label, amber star+rating / "أقل كمية: {moq} كرتون" row. (Dropped the "من"
    prefix to match the site.) Verified on-device: heart POST 200, all sections render.
  - Wired new nav: home wishlist icon → `Routes.WISHLIST`.
  - NOT YET: the optional "عروض الجملة" deals card + countdown (`deals-section.tsx`). A phone can't
    mirror the desktop mega-menu — mobile bottom nav kept by design.
- **STAFF PORTAL LOGIN + PARTNER PORTAL (2026-07-09)** (see `docs/PARITY_ROADMAP.md`): admin & partner now
  have their **own login portal** — `ui/auth/PortalLoginScreen` ("بوابة الإدارة والشركاء", reached from the
  buyer sign-in via "دخول الفريق"). It signs in with better-auth, reads the server `role`, and routes:
  admin→`Routes.ADMIN` hub, supplier→`Routes.PARTNER` hub, else signs back out with "ليس حساب إدارة أو شريك".
  **VERIFIED on-device:** buyer creds → sign-in 200 → get-session 200 → sign-out 200 → rejection shown (role
  routing works). Minimal **partner portal** (`ui/partner/*`): `PartnerHubScreen` + generic `partner_list/{key}`
  engine (`PartnerRepository.list` → `getPartnerList(@Path encoded)` → `toSimpleRow`), sections catalogued in
  `PartnerSections` (products/inventory/orders/reviews/earnings/withdrawals/invoices/coupons/ads/notifications/
  support). Partner endpoints are live-but-403 until a supplier account exists. Routes: `portal_login`,
  `partner`, `partner_list/{sectionKey}`.
- **PHASE 6 (2026-07-09) — admin portal, read-only core; build-to-contract** (see `docs/PARITY_ROADMAP.md`):
  new `ui/admin/*` (`AdminHubScreen` KPI dashboard + `AdminListScreens` orders/products/buyers/suppliers/
  approvals), `AdminRepository`, `AdminDto`/`Admin` models. Account menu shows **"لوحة الإدارة" only when
  `profile.role == "admin"`** — VERIFIED on-device the item is hidden for the buyer (gate works); build GREEN.
  **BLOCKER:** every `/api/v1/admin/*` is role-gated → **403** for non-admins, and no admin account exists,
  so the screens themselves are unverifiable (render real data only with an admin session; else clean 403
  error). **Full breadth added via a generic engine:** `getAdminList(@Path encoded)`→`List<JsonObject>` +
  `toSimpleRow()` + one `AdminGenericListScreen`/`AdminGenericViewModel` (`admin_list/{key}`, slashes→`~`)
  render ~28 sections catalogued in `AdminSections`; `postAdminAction()` powers approve/reject on the
  approval-type flows. Generic extractor is a scaffold — per-endpoint field tuning + object-returning routes
  (settings, analytics summaries) come once an admin session exists.
  **PHASE 5 (partner) NOT STARTED** — same blocker: partner endpoints are live-but-403 and the VPS blocks
  even `POST /partner/onboard`, so no supplier account is creatable via the app; awaiting a provisioned role.
- **PHASE 3 (2026-07-09) — messages & content; built+verified** (see `docs/PARITY_ROADMAP.md`):
  new `ui/content` (Blog/BlogPost/Offers), `ui/chat` (Conversations/Chat), `ui/account/BuyerType`;
  `ContentRepository`/`ChatRepository`, `ContentDto`/`ChatDto`, `Content`/`Chat` models. Account menu adds
  المحادثات / عروض وتخفيضات / المدونة / نوع الحساب. **Buyer-type toggle is the standout — FULLY VERIFIED
  on live VPS:** `POST /v1/account/buyer-type` 200 both ways; a new `Money.merchantPricing` flag (persisted
  via `BuyerTypeStore` DataStore, seeded at launch in `MainActivity`) skips the ×1.15 markup for merchants —
  on-device catalog prices dropped exactly ÷1.15 (sugar 77.62→67.5, milk 64.69→56.25) and restored. Flag is
  not reactive to an already-visible screen (re-navigate to reflect). **VPS 404** for conversations/blog/
  clearance/deals (flash-sales 200-empty) → all screens VERIFIED degrading cleanly (error+retry / empty
  state). Blog article + chat thread are build-to-contract (no live data to drive). Home deals card and
  start-chat-from-order deferred.
- **PHASE 4 (2026-07-08) — auth & checkout depth; 5 of 8 built+verified, 3 deferred** (see `docs/PARITY_ROADMAP.md`):
  new `ui/account/` screens (Kyc/Templates/Refunds/VerifyPhone) + `ui/auth/ForgotPassword`;
  `AccountExtrasDto`/`AuthExtrasDto`, `AccountExtras` model, `AccountExtrasMappers`; refund-request dialog on
  OrderDetail (`OrderStatus.isRefundable`); `couponCode` already threaded (Phase 2). **VERIFIED on-device
  against VPS:** Refunds list (200), Templates save/list/reorder (201/200), KYC GET-prefill + POST submit
  (201), Forgot-password (`POST /api/auth/request-password-reset` 200 → success screen). OTP send 404 →
  graceful degrade (works when backend deploys). **Fixed a regression:** the account menu overflowed/clipped
  logout once it grew — `AccountScreen` menu is now `verticalScroll`. **DEFERRED (unverifiable/architecture):**
  real payments (Moyasar, 404 + WebView/gateway), guest orders (cookie-auth conflict), shipping-calculate
  (needs admin `zoneId`; server already price-authoritative). VPS-live: refunds/templates/kyc/reset-password;
  404: otp, payments.
- **PHASE 2 COMPLETE (2026-07-08) — money & rewards, verified on-device** (see `docs/PARITY_ROADMAP.md`):
  new `ui/rewards/` (loyalty/referral/wallet), `PromotionsRepository` (coupon validate + cashback preview),
  checkout gains a coupon field + order-summary card, `couponCode` threaded into `POST /orders`, and
  `ApiErrors.apiMessage()` surfaces the server's `{error}` string. Account menu adds محفظتي / نقاط الولاء /
  ادعُ أصدقاءك. **VPS endpoint availability (deployed build lags source-of-truth branch):** loyalty 200,
  referral 200, `coupons/validate` LIVE (rejects invalid with an Arabic error); wallet, `coupons` list,
  `cashback/preview` all **404** → the app degrades to clean error/hidden states (verified). Loyalty redeem
  and coupon-discount success paths are wired+compile but weren't drivable (test account has 0 points / no
  valid coupon code).
- **PHASE 1 COMPLETE (2026-07-08) — all features verified on-device** (see `docs/PARITY_ROADMAP.md`):
  supplier storefront (+follow), reviews read **+ SUBMIT** (`POST reviews` 201 → refresh), notifications,
  profile edit GET **+ PATCH** save (round-trip), following (VPS 404 → clean retry), compare toggle
  **+ side-by-side SCREEN + clear-all**. Fixed a bug found while driving: the product-detail compare
  toggle's snackbar read `state.isInCompare` *after* `toggleCompare()` (racy stale read → inverted
  "added/removed" text). Now captures `val added = !state.isInCompare` before toggling, mirroring the
  favorite handler (`ProductDetailScreen.kt`).

## Status — open / not yet done

1. **Addresses: add + list only.** No edit or delete (no UI, and `MawridApi` has no update/delete
   address endpoints — needs backend work).
2. **Search bottom-tab still restores the category-scoped instance** (mitigated by the clearable
   chip). A full fix needs a distinct unscoped route for the Search tab or resetting on tab click.
3. Minor state gaps: `AccountScreen` profile-fetch error path; `CheckoutScreen` address-load spinner.
4. **Arabic/RTL correctness** (icon mirroring, number/currency direction, LTR leakage) and **visual
   parity with the website** (orange brand, Cairo font): not started. Item 6.

## Running / driving the emulator

- Emulator has a secondary display; launch the app with:
  `am start --display 0 -n com.mawrid.app/.MainActivity`.
- Screenshots can miss the app — the reliable way to read/drive the UI is
  `adb shell uiautomator dump` + parse text/bounds.
- Shell is **zsh**: unquoted `$var` does NOT word-split — compute tap coordinates with `awk`,
  not `set -- $bounds`.

## Working agreement

Verify by actually building and (where useful) running on the emulator — never claim something
works without it. The owner (Ibrahim) is strengthening Android skills: briefly explain
non-obvious Kotlin/Compose choices.
