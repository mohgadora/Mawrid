# Mawrid Android — API + Auth Map, Design System, Architecture & Build Plan

**Purpose:** the reference we build the native Android buyer app from.
**Scope:** buyer/customer experience only (browse, search, product detail + variants, cart, checkout, orders, auth, account, wishlist, compare). No admin/partner/supplier/driver dashboards.
**Status of this doc:** derived from the SDLC documents, the `apps/web` Next.js storefront, the shadcn/Base‑UI component layer, and — most importantly — the **real Drizzle migrations** (`0000_high_ego.sql` … `0013_partner_center.sql`), which are authoritative ground truth.

Anything tagged **[CONFIRM]** is inferred from how the web app *calls* the backend, because the literal `lib/api-client.ts`, `lib/data.ts`, `lib/auth-client.ts`, better‑auth server config, and `globals.css` were not in the uploads. These are the first things to verify with your colleague.

---

## 0. The single most important finding: docs vs. code

Two mutually inconsistent architectures exist in what you shared:

| | Arabic SDLC design docs (`docs/sdlc/*`) | The code that actually exists (`apps/web`, Drizzle migrations) |
|---|---|---|
| Backend | FastAPI (Python), modular monolith | **Next.js `app/api` route handlers** |
| DB access | SQLAlchemy + Alembic | **Drizzle ORM** |
| Auth | Phone OTP → short‑lived JWT + refresh cookie | **better‑auth, email/password, session cookie** |
| Buyer client | **Flutter** (`apps/buyer`) | **Next.js web** (`apps/web`), and now your **native Android** |
| Money | Numeric, country currency | `numeric(12,2)`, country currency (SAR default) |

**Decision:** we build against the **code reality** (Next.js + Drizzle + better‑auth), which is exactly what your original project brief described. The SDLC PDFs describe an **abandoned or parallel plan the team did not implement** — treat them as historical context, not a spec. This is the #1 thing to confirm with your colleague in one sentence: *"The live backend is the Next.js/Drizzle/better‑auth app, not the FastAPI/Flutter design — correct?"*

---

## 1. Authentication — how a mobile client logs in and stays logged in

### 1.1 What the schema tells us
better‑auth's standard Drizzle tables are present (`user`, `session`, `account`, `verification`):

- `user`: `id (text)`, `name`, `email (unique)`, `emailVerified`, `image`, **`role` (default `consumer`)**, `phone`, `company`, `vatNumber`, `country (default SA)`, `banned`/`banReason`/`banExpires`.
- `session`: `id`, **`token (unique)`**, `expiresAt`, `ipAddress`, `userAgent`, `userId`.
- `account`: `providerId`, `password` (hash) → **email/password credential provider**.
- `verification`: email verification / password‑reset tokens.

Roles in play: **`consumer`, `merchant`** (both use the store portal), plus `supplier`/`admin`/`driver` (out of scope for us). Pricing and some UI are **role‑gated** (merchants see wholesale + MOQ + tier pricing; consumers see retail).

### 1.2 The mobile auth model — this drives the whole networking layer
The web app calls better‑auth through `authClient` (`signIn.email`, `signUp.email`, `getSession`, `useSession`, `signOut`). better‑auth is **cookie‑session based**: a successful sign‑in sets a signed **session cookie**; every subsequent request is authorized by replaying that cookie. There is **no bearer token** in the storefront.

**Implication for Android (important, and different from most tutorials):**
- Do **not** build the usual "store a JWT in DataStore, add `Authorization: Bearer` via an interceptor" flow.
- Instead: attach a **persistent cookie jar** to OkHttp, persisted to DataStore/EncryptedSharedPreferences, so the session cookie survives app restarts. The auth flow becomes: `POST sign-in/email` → cookie stored by the jar → all later calls carry it automatically → `GET get-session` to hydrate the current user → `POST sign-out` to clear.
- Endpoints (better‑auth default mount is `/api/auth/*`) **[CONFIRM base path]**:
  - `POST /api/auth/sign-in/email` `{ email, password }`
  - `POST /api/auth/sign-up/email` `{ name, email, password }`
  - `GET  /api/auth/get-session` → `{ user, session }`
  - `POST /api/auth/sign-out`
  - Password reset: web uses `/forgot-password` + `/reset-password` pages → better‑auth `forget-password` / `reset-password` endpoints **[CONFIRM]**.

**Open questions to confirm with your colleague (auth):**
1. Is the better‑auth cookie usable by a native client (correct `Domain`/`Path`, `SameSite`, `Secure`), or do they need to enable better‑auth's **bearer‑token / mobile plugin** so we can use an `Authorization` header instead? *(Either works; it changes our OkHttp setup, so decide up front.)*
2. Exact base path of the auth handler and the reset‑password request/verify contract.
3. Any CORS / trusted‑origins config that would reject a non‑browser origin.

---

## 2. API map (buyer surface)

Base URL is configurable (your choice: local vs deployed). Web calls live under **`/api/v1/*`** for domain data and **`/api/*`** for AI. Exact verbs/paths/response shapes below are reconstructed from the `lib/api-client` *call sites* — **[CONFIRM against `lib/api-client.ts`]**.

### 2.1 Catalog & search
| Purpose | Client fn (observed) | Inferred endpoint | Request | Response |
|---|---|---|---|---|
| Search / browse | `searchProductsApi` | `GET /api/v1/products` | `q, category, sortBy(relevance\|newest\|price_asc\|price_desc\|rating), page, limit, inStock, minPrice, maxPrice` | `{ products[], total, page, totalPages }` |
| Category + products | `getCategoryWithProducts(slug)` | `GET /api/v1/categories/{slug}` | slug | `{ category, products[] }` |
| Supplier + products | `getSupplierWithProducts(id)` | `GET /api/v1/suppliers/{id}` | id | `{ supplier, products[] }` |
| Product detail | (SWR in server/page) | `GET /api/v1/products/{id}` | id | `Product` |
| Variants | `fetchProductVariants(id)` | `GET /api/v1/products/{id}/variants` | id | `Variant[]` |
| Categories tree | (also static `CATEGORIES`) | `GET /api/v1/categories` | — | `Category[]` |

### 2.2 Reviews & Q&A
| Purpose | Client fn | Inferred endpoint |
|---|---|---|
| List reviews | `fetchProductReviews(id)` | `GET /api/v1/products/{id}/reviews` → `{ reviews[], distribution[], averageRating, totalCount, userHelpfulIds[] }` |
| Add review | `submitReviewApi(id,{rating,title,body})` | `POST /api/v1/products/{id}/reviews` |
| Helpful toggle | `toggleReviewHelpfulApi(id,reviewId)` | `POST …/reviews/{reviewId}/helpful` |
| Supplier reply | `submitReviewReplyApi(id,reviewId,body)` | `POST …/reviews/{reviewId}/replies` |

*(Q&A on the product page is currently seeded client‑side — likely not yet a real endpoint. [CONFIRM])*

### 2.3 Account
| Purpose | Client fn | Inferred endpoint |
|---|---|---|
| Profile | `fetchProfile` / `updateProfileApi({name,phone})` | `GET/PATCH /api/v1/account/profile` → `{ name, email, phone, role }` (email read‑only) |
| Addresses | `fetchAddresses` / `addAddressApi` / `updateAddressApi(id)` / `removeAddressApi(id)` | `GET/POST/PATCH/DELETE /api/v1/account/addresses[/{id}]` |
| Favorites | `fetchFavorites` / `toggleFavoriteApi(id)` | `GET /api/v1/account/favorites`, `POST …/favorites/{id}/toggle` |
| Reorder templates | `fetchTemplates` | `GET /api/v1/account/templates` |
| Merchant KYC | `submitMerchantKycApi({company,crNumber,vatNumber})` / `fetchMerchantKycStatus` | `POST/GET /api/v1/account/kyc` → `{ status: draft\|pending\|approved\|rejected }` |

### 2.4 Cart, checkout & orders
- **Cart is client‑side state** (a `CartProvider` context + snapshots), not a server resource. Mirror this on Android as a local, persisted cart (Room/DataStore). Items store a product snapshot + qty + optional `variantId`/`variantLabel`.
- **Order placement:** `createOrderApi({ lines:[{productId, qty, variantId?}], address:{label,line1,city,phone}, paymentMethod })` → `{ id }` → navigate to order detail.
  - **The server is price‑authoritative.** The production smoke test confirms it *ignores any client `unitPrice`* and recomputes from `price_tier`, and rejects inactive products (`PRODUCT_UNAVAILABLE`). Android must send only `productId/qty/variantId` and render server‑returned totals — never trust locally computed money at checkout.
  - Payment methods: `cod | card | bank` (checkout UI); DB `order.paymentMethod` default `cod`, `paymentStatus` `unpaid|paid`.
- **Orders history / detail / cancel:** `fetchOrders()` → list; `fetchOrder(id)` → detail incl. `timeline` (from `order_event`); `cancelOrderApi(id)`.
  - Order status flow (real, from `order-status` + schema): `pending → confirmed → processing → packed → shipped → out_for_delivery → delivered` (+ `cancelled`).

### 2.5 Notifications
`getNotificationsApi()` → `{ notifications[], unreadCount }`; `markNotificationReadApi(id)`; `markAllNotificationsReadApi()`. Backed by the `notification` table (`type, title, body, link, read`). Web polls every 30s; on Android prefer pull‑to‑refresh + optional FCM later.

### 2.6 AI features (web‑platform‑specific — plan native equivalents or defer)
- `POST /api/recommendations` `{ recentIds, role, lang }` → `{ products[], source: 'ai'|'fallback' }`.
- `POST /api/image-search` (multipart image + lang) → `{ results[], description }`.
- Voice search uses the **Web Speech API** — no direct RN/Android equivalent; defer or use Android `SpeechRecognizer` later.
- These are rate‑limited and fail closed without `AI_GATEWAY_API_KEY` — treat as optional/enhancement.

---

## 3. Data models (from the real Drizzle schema)

Buyer‑relevant entities (IDs are `text`, money is `numeric(12,2)` in country currency):

- **product**: `id, sku, name, nameAr, description, descriptionAr, categoryId, supplierId, imageUrl, images[], unitsPerCarton, weight, tags[], marketAvgPrice, stock, active, featured, status(default 'approved')`.
- **price_tier**: `productId, minQty, maxQty, price, sortOrder` — quantity‑break wholesale pricing (merchant‑facing).
- **product_variant**: `id, productId, sku, barcode, price, compareAtPrice, stock, lowStockThreshold, weight, images[], options(jsonb, e.g. {size,color}), isDefault, active`.
- **category**: `id, name, nameAr, slug(unique), icon, parentId (self‑referential tree), sortOrder`.
- **supplier**: `id, name, nameAr, logo, banner, country, city, rating, reviewCount, verified, responseTime, minOrder, commissionRate, phone, email, socialLinks, shipping/returnPolicy, status`.
- **order**: `id, ref(unique), userId, supplierId, status, addressId, shippingAddress(jsonb), paymentMethod, paymentStatus, subtotal, shippingFee, discount, total, notes, estimatedDelivery, deliveredAt`.
- **order_line**: `orderId, productId, productName, productImage, sku, qty, unitPrice, cartonQty, unitsPerCarton, subtotal, variantId, variantSku, variantOptions`.
- **order_event**: `orderId, status, note, createdBy, createdAt` — the status timeline.
- **address**: `userId, label, fullName, phone, line1, line2, city, region, country(SA), postalCode, isDefault`.
- **favorite**: `userId, productId` (unique together) — the wishlist/favorites source of truth server‑side.
- **kyc_approval**: `userId, type(merchant), status, crNumber, vatNumber, documents[]`.
- **product_review / review_reply / review_helpful**: ratings 1–5, `verified` purchase flag, helpful votes (unique per user).
- **notification**, **loyalty_account/loyalty_transaction**, **referral/referral_code**, **coupon/coupon_usage**, **flash_sale/flash_sale_product**, **delivery_zone/shipping_rule** — supporting features (loyalty/vouchers/referral are gated behind a `DEMO_FEATURES_ENABLED` flag in the web app; confirm whether they're in v1 scope for mobile).

**Money note:** the storefront's "USD + `formatPrice`" is a **mock‑data artifact**. Real amounts are `numeric(12,2)` in the country's currency (SAR default; `country` table carries `currency`). On Android, model money as **minor units (Long/cents)** or `BigDecimal` — never `Float`/`Double` — and format per country/locale. The web app already does integer‑cents math in `lib/money` (`toCents/fromCents/sumCents/lineTotalCents`); mirror that.

---

## 4. Design system (to recreate as a Compose theme)

Stack in `apps/web`: **Tailwind + shadcn/ui built on Base UI** (`@base-ui/react/*`), style `base-nova`, base color `neutral`, **OKLCH color tokens**, **RTL‑first** (logical `start/end` properties everywhere), **Arabic default + English**, light/dark themes. Brand: **مَوْرِد / Mawrid**, logo glyph "م", heavy use of `primary`.

**Token names to port to a Compose `MaterialTheme`/custom theme** (semantic, from the components):
`background, foreground, card, card-foreground, popover, popover-foreground, primary, primary-foreground, secondary, secondary-foreground, muted, muted-foreground, accent, accent-foreground, destructive, destructive-foreground, success, success-foreground, border, input, ring, chart-3, chart-4`. Radii/spacing tokens: `--radius-md`, card radius `xl/2xl`, button radius `lg`, pills `full`, `--card-spacing`.

Component taxonomy to build as Compose composables (from `Button`/`Badge` CVA variants): **Button** variants `default | outline | secondary | ghost | destructive | link` × sizes `xs | sm | default | lg | icon`; **Badge/Chip**, **Card**, **Dialog/Sheet (bottom‑sheet)**, **Input/Textarea/Select/Switch/Tabs/Tooltip/Avatar/Skeleton**, plus domain pieces: **ProductCard**, **MarketPriceBadge** ("X% cheaper than market"), **StatusChip/OrderTimeline**, **StockCounter**, **QuantityStepper**, **PriceTierTable**.

**[CONFIRM]** exact OKLCH values live in `app/globals.css` (not uploaded). I'll transcribe them into `Color.kt` verbatim (light + dark) once you send that one file — until then the theme uses placeholders matched to the semantic names.

**RTL:** must be first‑class. Compose supports `LayoutDirection.Rtl`; drive it from the selected language (ar → RTL, en → LTR), mirror icons/chevrons, and use `Arrangement`/`Alignment` that respect direction.

---

## 5. Proposed Android architecture

Kotlin + Jetpack Compose, **MVVM (ViewModel + immutable UiState) + Coroutines/Flow**, Hilt DI, Retrofit + Kotlinx Serialization, OkHttp with **persistent cookie jar**, Coil, Navigation Compose, DataStore, Paging 3 for lists. `minSdk = 26`, target latest stable.

Because **iOS is definitely coming**, we keep a strict layer boundary so the non‑UI layer can later migrate to Kotlin Multiplatform with minimal churn. Concretely: keep `data` + `domain` free of Android‑UI types, put platform specifics (Hilt, DataStore, cookie jar) behind interfaces, and prefer libraries with clean KMP equivalents (Retrofit→Ktor, Hilt→Koin, DataStore→multiplatform‑settings) so the eventual port is mechanical.

```
com.mawrid.app
├── core/
│   ├── network/        # OkHttp + cookie jar, Retrofit, base‑URL provider, error mapping (PRODUCT_UNAVAILABLE etc.)
│   ├── auth/           # SessionManager (better‑auth cookie), AuthInterceptor-free design
│   ├── datastore/      # prefs: language, country/currency, theme, base URL, cart, cookie
│   ├── money/          # Money (minor units / BigDecimal), currency formatting
│   ├── i18n/           # ar/en strings, RTL, locale/country
│   └── designsystem/   # theme (Color/Type/Shape from OKLCH tokens) + composables (Button, Card, ProductCard, …)
├── data/
│   ├── remote/         # Retrofit services + DTOs (mirror api-client contracts)
│   ├── local/          # Room (cart, recently‑viewed, cached catalog) + DataStore
│   └── repository/     # CatalogRepo, ProductRepo, AuthRepo, AccountRepo, OrderRepo, ReviewRepo, NotificationRepo
├── domain/
│   ├── model/          # Product, Variant, PriceTier, Category, Supplier, Cart, Order, Address, Profile …
│   └── usecase/        # e.g. GetProductDetail, PlaceOrder, PriceForRole (merchant vs consumer)
├── ui/
│   ├── navigation/     # NavHost, routes, bottom bar (Home, Categories, Cart, Wishlist, Account)
│   ├── home/  search/  category/  product/  cart/  checkout/  orders/
│   ├── auth/  account/ wishlist/ compare/
│   └── common/         # AsyncContent equivalent (loading/error/empty/success), skeletons
└── di/                 # Hilt modules
```

Cross‑cutting parity with the web `Providers` stack: role (merchant/consumer), theme, i18n/country, cart, wishlist, compare, recently‑viewed, notifications → each becomes a repository/ViewModel‑scoped state holder on Android.

---

## 6. Phased build plan

- **Phase 0 — Foundation.** Scaffold project; Hilt; Compose theme from OKLCH tokens; networking with cookie jar + Kotlinx Serialization; **configurable base URL** via build flavors (`debug`→`10.0.2.2` for emulator / LAN IP for device, `release`→deployed) plus a runtime override in settings; i18n (ar/en) + RTL; money layer.
- **Phase 1 — Product list (first milestone).** Home/catalog + Search screen backed by real `GET /products` (search/sort/paginate with Paging 3), `ProductCard`, role‑aware pricing, skeleton/empty/error states. *This is the "real data on screen" target.*
- **Phase 2 — Product detail + variants.** Detail screen, `fetchProductVariants`, tiered pricing for merchants, market‑price badge, add‑to‑cart.
- **Phase 3 — Auth + Account.** better‑auth sign‑in/up/forgot‑reset via cookie session; session hydration on launch; profile, addresses CRUD, favorites, KYC status.
- **Phase 4 — Cart + Checkout + order placement.** Local persisted cart; 3‑step checkout (address → slot → payment); `createOrderApi`; server‑authoritative totals.
- **Phase 5 — Orders.** History, detail, timeline, cancel, reorder.
- **Phase 6 — Wishlist, Compare, Categories.** Server favorites + local compare (max 3), category tree.
- **Phase 7 — Enhancements.** Reviews/Q&A, notifications (+ optional FCM), loyalty/vouchers/referrals *if in v1 scope*, AI recommendations, native image/voice search.

---

## 7. Risks & open questions to confirm with your colleague

1. **Backend truth:** confirm the live backend is the Next.js/Drizzle/better‑auth app (not FastAPI/Flutter). *(Everything here assumes yes.)*
2. **Mobile auth:** can a native client use the better‑auth session cookie directly, or should they enable the **bearer‑token/mobile plugin**? Exact auth base path + password‑reset contract.
3. **`lib/api-client.ts`:** the exact **paths, HTTP verbs, query params, and JSON response shapes** for every buyer endpoint (my table in §2 is inferred). This is the highest‑value file still outstanding.
4. **Which endpoints are actually live vs. mock.** The storefront runs much of catalog/cart on **static mock data** (`lib/data`), with a `ALLOW_MOCK_FALLBACK` flag and `DemoBanner` ("not connected to the server yet"). Confirm which of products/categories/search/orders/reviews are truly implemented server‑side today, so Phase 1 targets a real endpoint.
5. **Currency/pricing:** confirm amounts are country‑currency `numeric(12,2)` (SAR) end‑to‑end and how role‑based (retail vs wholesale/tier) pricing is returned per user — is it computed server‑side from the session role, or does the client pick?
6. **Design tokens:** send `app/globals.css` so I transcribe exact OKLCH light/dark values.
7. **Feature scope for v1:** are loyalty/vouchers/referrals/compare/Q&A in the first mobile release, or later? (Several are behind `DEMO_FEATURES_ENABLED` on web.)
8. **Web‑only features:** image search (AI) and voice search (Web Speech API) have no drop‑in native equivalent — defer or replace with Android‑native.
9. **Multi‑country/locale:** confirm supported countries/currencies and whether `X-Country`/`Accept-Language` style headers are expected by the API.

---

### Immediate next step
Once you confirm §7.1–§7.4 (backend truth, auth model, the real `api-client.ts` contracts, and which endpoints are live), I'll scaffold the project (Phase 0) and build **Phase 1: a product‑list screen pulling real data**, explaining each step as we go.
