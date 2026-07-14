# Mawrid — Web → Android Full-Parity Roadmap

**Goal:** make the native Android app match the Mawrid **website's functionality**, feature by
feature. Owner decision (2026-07-07): mirror the **entire platform** — buyer + partner + admin —
buyer surface first.

**Source of truth (web):** repo `mohgadora/Mawrid`, branch **`claude/peaceful-cori-7av7pd`** (most
recent: 2026-07-06, 641 files). Cloned read-only for reference under the session scratchpad.
Port each feature faithfully into Kotlin/Compose; keep the buyer API contracts already proven in
`CLAUDE.md`. The repo's Expo `mobile/` app is only a 9-screen skeleton — NOT the target; the web
buyer surface is.

**Scale (reality check):** web = ~105 pages (25 buyer, 59 admin, 21 partner) + ~190 API routes.
This is a multi-week/-month program. Ship + verify one feature at a time on the emulator; never
claim done without a build+run. Update the checkboxes below as features land.

---

## Already in the app (buyer core — done & verified)
- [x] Home/products, product detail (tiers/MOQ/variants), categories, search
- [x] Cart + checkout (COD) → order 201 → order detail → orders list → cancel
- [x] Auth: cookie sign-in / sign-up / sign-out
- [x] Account, addresses (add+list), wishlist/favorites (+card hearts)
- [x] Visual parity: dark theme, Cairo font, ported home (header, hero, badges, AI section, cards)

---

## PHASE 1 — Buyer: core shopping polish
- [x] **Supplier storefront** (`/supplier/[id]`, `GET /v1/suppliers?slug={id}`). New: `SupplierDto`,
      `Supplier` model, `CatalogRepository.supplier()`, `SupplierViewModel/Screen`, route
      `supplier/{id}`. Product-detail supplier row now links whenever `supplierId` exists (product
      list omits supplier names) → shows "زيارة متجر المورّد". Includes a working follow button
      (`AccountRepository.setFollowing` → POST/DELETE `/v1/shops/{id}/follow`; status GET 404s on the
      VPS build like `products/{id}`, handled → defaults to not-following). Verified on-device.
- [x] **Product reviews: read + write** (`/v1/products/[id]/reviews`). `ReviewDto`/`Review` model,
      `CatalogRepository.reviews()`/`submitReview()`; product detail shows avg + list, "أضف تقييماً"
      opens a star+text dialog (body ≥10 chars per API). READ verified on-device (section, count,
      empty state). WRITE VERIFIED on-device (2026-07-08): 5★ + body → `POST products/uht-milk/reviews`
      201 → auto GET refresh 200 → count 0→1, avg 5.0, review by "Claude Test" rendered + success toast.
      (helpful/reply deferred — reply is partner = Phase 5.)
- [x] **Notifications: list + unread badge** (`/v1/account/notifications`, read-all, mark-one).
      `NotificationDto`/model, `AccountRepository.notifications()/markAllRead()/markRead()`,
      `NotificationsViewModel/Screen`; account menu item shows unread badge (from `AccountViewModel`).
      Verified on-device (GET 200, empty state).
- [x] **Profile edit** (`PATCH /v1/account/profile {name,phone}`). `ProfileEditViewModel/Screen`
      (name/phone editable, email read-only), account menu entry. GET prefill verified on-device (200);
      PATCH save VERIFIED on-device (2026-07-08): edited name → `PATCH` 200 → screen pops back; re-open
      shows the persisted value; edited back → `PATCH` 200. Round-trip confirmed.
- [x] **Following LIST page** (`/v1/account/following`). `AccountRepository.following()`,
      `FollowingViewModel/Screen`, account menu "المتاجر المتابَعة". App correct; NOTE the VPS build
      **404s** this route (deployment quirk like `products/{id}`) → screen shows a clean error+retry.
- [x] **Compare products** (`/compare`). In-memory `CompareStore` (cap 4), compare toggle in the
      product-detail top bar, `CompareViewModel/Screen` (side-by-side attributes), account menu with
      count badge. FULLY VERIFIED on-device (2026-07-08): added 2 products (milk + sugar) from their
      detail top bars → compare SCREEN shows a 2-column side-by-side table (image, name, retail price,
      أقل كمية / التقييم★ / الوحدات per carton / عدد الأسعار), per-column ✕ remove, and "مسح الكل" →
      empty state. FIXED a bug found while driving: the toggle snackbar read `state.isInCompare` AFTER
      `toggleCompare()` (racy stale read → inverted message); now captures intent before toggling like
      the favorite handler. Verified: adding shows "أُضيف إلى المقارنة".

### Phase 1 status: COMPLETE — CODE-COMPLETE, BUILDS GREEN, ALL features verified on-device.
### (supplier storefront, reviews read+SUBMIT, notifications, profile GET+PATCH, following 404-handled,
### compare toggle + SCREEN + clear-all). Compare snackbar inversion bug fixed this session.

## PHASE 2 — Buyer: money & rewards  — CODE-COMPLETE, BUILDS GREEN, verified on-device 2026-07-08
New package `ui/rewards/` (Loyalty/Referral/Wallet VM+Screen), `PromotionsRepository` (coupon+cashback),
`RewardsDto`/`WalletDto`/`CouponDto`, `Rewards`/`Wallet`/`CouponValidation` models, `RewardsMappers`,
`ApiErrors.apiMessage()` (surfaces server `{error}`). Account menu: محفظتي / نقاط الولاء / ادعُ أصدقاءك.
**VPS endpoint availability (deployed build lags the source-of-truth branch):** loyalty 200, referral 200,
coupons/validate 200-live (rejects invalid w/ Arabic error); wallet, coupons(list), cashback/preview → 404.
- [x] **Loyalty points + redeem** (`GET /v1/account/loyalty`, `POST /redeem`). `LoyaltyViewModel/Screen`:
      balance card (رصيد النقاط) + مكتسبة/مُحوّلة stats + "تحويل النقاط" redeem dialog + ledger (آخر العمليات).
      VERIFIED on-device: GET 200, balance 0, empty ledger; redeem button correctly DISABLED at 0 balance
      (POST wired but not drivable without earned points — buyer app can't earn).
- [x] **Referral** (`GET /v1/account/referral`). `ReferralViewModel/Screen`: code card + usage count +
      copy-to-clipboard + native share intent + referred-list. VERIFIED on-device: GET 200, code
      `DRGHDLSJN0QQ`, copy works (clipboard chip) + button contrast fixed (onPrimary border on orange card).
- [x] **Wallet: balance, top-up, transactions** (`GET /v1/wallet`, `/transactions`, `POST /topup`).
      `WalletViewModel/Screen`: balance card + إجمالي الإيداعات/السحوبات + شحن المحفظة top-up dialog + ledger.
      VPS 404s the wallet routes → VERIFIED clean error+retry state on-device (works once VPS deploys them).
- [x] **Coupons: apply/validate at checkout** (`POST /v1/coupons/validate`; `GET /coupons` list 404s).
      `PromotionsRepository.validateCoupon`; checkout gains a "كوبون الخصم" field+apply, applied-state card,
      and an order summary (subtotal/shipping/discount/total); coupon code threaded into `POST /orders`
      (`couponCode`). VERIFIED on-device against LIVE VPS: request sends cart items, invalid code →
      server 400 → friendly Arabic error "رمز الكوبون غير صحيح" surfaced (via `apiMessage`). Success/discount
      path not drivable (no valid coupon code for the test account).
- [x] **Cashback preview** (`POST /v1/cashback/preview`). `PromotionsRepository.cashbackPreview`, auto-fires
      on checkout; shows "ستربح استرجاعاً نقدياً بقيمة …" when >0. VPS 404s → VERIFIED silently hidden on-device.

## PHASE 3 — Buyer: messages & content
**VPS availability (2026-07-09 probe):** buyer-type POST **200 live**; flash-sales/active **200** (empty);
conversations/*, blog, clearance, deals/today all **404** (deploy lags source-of-truth). New: `ContentDto`/
`ChatDto`, `Content`/`Chat` models, `ContentMappers`, `ContentRepository`, `ChatRepository`; screens under
`ui/content` (Blog/BlogPost/Offers) + `ui/chat` (Conversations/Chat) + `ui/account/BuyerType`. Account menu:
المحادثات / عروض وتخفيضات / المدونة / نوع الحساب. Routes: blog, blog/{slug}, offers, conversations,
chat/{id}, buyer_type.
- [x] **Supplier chat** (`GET /v1/conversations`, `/{id}/messages`, `POST /{id}/messages`, `/start`,
      `/{id}/read`). `ChatRepository` (resolves `mine` vs current user id), `ConversationsScreen` (list +
      unread badge) → `ChatScreen` (bubbles + input + auto-scroll). VPS 404 → VERIFIED clean error+retry
      on-device. Start-from-order entry deferred (endpoint 404; wire when deployed).
- [x] **Blog** (`GET /v1/blog`, `/blog/{slug}`). `BlogScreen` (cards) → `BlogPostScreen` (cover + body).
      VPS 404 → VERIFIED clean error+retry on-device.
- [x] **Clearance + deals + flash-sales** (`GET /v1/clearance`, `/deals/today`, `/flash-sales/active`),
      combined `OffersScreen` (deal-of-day card + flash list + clearance rows). Each source independent
      (a 404 doesn't blank the others). flash-sales 200-empty + others 404 → VERIFIED clean empty state
      ("لا توجد عروض نشطة حالياً"). Home deals card still deferred (kept the mobile layout simple).
- [x] **Buyer-type toggle: consumer↔merchant pricing** (`POST /v1/account/buyer-type`). `BuyerTypeScreen`
      (radio + company field for merchant), `BuyerTypeStore` (DataStore) persists the flag and drives a new
      `Money.merchantPricing` (skips the ×1.15 retail markup for merchants); seeded at launch in MainActivity.
      **FULLY VERIFIED on-device against LIVE VPS:** POST 200 both directions; switching to merchant dropped
      catalog prices by exactly ÷1.15 (sugar 77.62→67.5, milk 64.69→56.25 ر.س) and back. Not reactive to an
      already-visible screen — re-navigation reflects the change (documented).

## PHASE 4 — Buyer: auth & checkout depth
**VPS availability (2026-07-08 probe):** refunds/templates/kyc GET+POST **200 live**; forgot-password
(`/api/auth/request-password-reset`) **200 live**; otp/send|verify, payments/create → **404**;
orders/guest → 405; shipping/calculate is a **GET requiring `zoneId`** (admin concept, no buyer path).
New files: `AccountExtrasDto`/`AuthExtrasDto`, `AccountExtras` model, `AccountExtrasMappers`; screens under
`ui/account` (Kyc/Templates/Refunds/VerifyPhone) + `ui/auth/ForgotPassword`. Account menu grew → made
**scrollable** (was overflowing/clipping logout). Routes: refunds, templates, kyc, forgot_password, verify_phone.
- [x] **Refunds/returns** (`GET/POST /v1/account/refunds`). `RefundsViewModel/Screen` (list + status pills);
      refund-request dialog (reason picker + note) on **OrderDetail** when `status.isRefundable`
      (processing/shipped/out_for_delivery/delivered). VERIFIED on-device: list GET 200 (empty state).
      Create: contract-verified via curl (endpoint reached; server 500s for ineligible orders — app surfaces it;
      no refundable order on the test account to drive success).
- [x] **Reorder templates** (`GET/POST /v1/account/templates`). `TemplatesViewModel/Screen`: "احفظ السلة
      كقالب" (enabled when cart non-empty) + list + "إعادة الطلب" (fetches each product → adds to cart).
      FULLY VERIFIED on-device: save POST 201 → refresh 200 → row renders; reorder fetched product
      (`products/{id}` 404 → list fallback) → "أُضيفت N أصناف إلى السلة".
- [x] **KYC (merchant verification)** (`GET/POST /v1/account/kyc`). `KycViewModel/Screen`: status chip
      (none/pending/approved/rejected) + company/CR/VAT form. FULLY VERIFIED on-device: GET prefill (CR/VAT +
      "قيد المراجعة" chip), submit POST 201 → refresh 200.
- [x] **OTP phone verify** (`POST /v1/auth/otp/send|verify`). `VerifyPhoneViewModel/Screen` (phone→code steps),
      reached from ProfileEdit "توثيق رقم الجوال". VPS 404s otp/send → VERIFIED graceful degrade on-device
      ("HTTP 404 Not Found", stays on phone step); works once backend deploys the routes.
- [x] **Forgot password** (`POST /api/auth/request-password-reset`). `ForgotPasswordViewModel/Screen`, linked
      from the sign-in screen ("نسيت كلمة المرور؟"). FULLY VERIFIED on-device: POST 200 → "تحقّق من بريدك"
      success screen. (Reset itself is the emailed tokenized web link — `/reset-password` — not an app screen.)
- [ ] **DEFERRED — pending backend / architecture** (not built; would be unverifiable rework now):
      * Real payments create+callback (`/v1/payments/create|callback`) — 404 on VPS; Moyasar gateway +
        WebView/redirect + callback deep-link, gateway-config dependent. The valuable one — revisit when deployed.
      * Guest orders (`/v1/orders/guest`) — conflicts with the app's cookie-auth buyer model.
      * Shipping calculate (`/v1/shipping/calculate`) — needs an admin `zoneId`; no buyer zone-resolution
        endpoint, and the server is already price-authoritative at order time (flat estimate stays).

## PHASE 5 — Partner/supplier portal (21 pages)
- [ ] Onboard/store, dashboard, products+variants CRUD, inventory (+movements/adjust/export)
- [ ] Orders (status/notes), earnings/withdrawals/invoices, reviews (reply/report)
- [ ] Reports (sales/orders/products/stock/earnings), coupons, ads, subscription, support tickets, KYC

## PHASE 6 — Admin portal (59 pages / 88 routes)
**BLOCKER (2026-07-09):** every `/api/v1/admin/*` route requires `role=admin` (middleware) and returns
**403** otherwise. No admin account is available and there's no self-serve path to one (even supplier
`onboard` is 403 on the VPS), so **nothing here is verifiable on-device** — this phase is build-to-contract.
- [x] **Admin portal — read-only core** (`GET /admin/kpi`, `/orders`, `/products`, `/buyers`, `/suppliers`,
      `/approvals`). New: `AdminDto`, `Admin` models, `AdminMappers`, `AdminRepository`, `ui/admin/*`
      (`AdminHubScreen` = KPI dashboard grid + section nav; `AdminListScreens` = orders/products/buyers/
      suppliers/approvals lists). Routes `admin` + 5 sub-routes. Account menu shows **"لوحة الإدارة"
      ONLY when `profile.role == "admin"`. VERIFIED on-device: the admin item is correctly **hidden** for
      the buyer account (role gate works); build GREEN. Screens render real data only with an admin
      session (else clean 403 error state). Curl-confirmed all endpoints are live-but-403 for non-admins.
- [x] **Admin — full breadth via a generic section engine** (2026-07-09). Rather than 30 bespoke unverifiable
      screens, a single generic path drives them all: `MawridApi.getAdminList(@Path encoded)` →
      `ApiEnvelope<List<JsonObject>>`, `AdminMappers.toSimpleRow()` extracts title/subtitle/trailing from any
      admin row, and one `AdminGenericListScreen` + `AdminGenericViewModel` (nav arg `admin_list/{key}`, slashes
      escaped as `~`) render every section. `AdminSections` catalogs ~28 sections in 5 groups (products-pending,
      refunds, tickets; withdrawals, wallets, wallet-bonuses, loyalty, commissions, referrals; coupons,
      cashback-rules, deals, flash-sales, clearance, ads; suppliers-list, drivers, roles, sessions; blog, seo,
      email-templates, subscription-plans, store-subscriptions, countries, zones, audit) — all listed in the
      admin hub. **Write actions:** `postAdminAction("<base>/<id>/<verb>")` powers approve/reject buttons on the
      approval-type sections (products-pending→products, refunds, finance/withdrawals). BUILD GREEN. Still
      unverifiable (403 without an admin session); the generic extractor is a scaffold — per-endpoint field
      tuning + object-returning routes (settings, analytics summaries) come when an admin account exists.

## STAFF PORTAL LOGIN (2026-07-09) — admin & partner have their own login portal
- [x] **`ui/auth/PortalLoginScreen`** ("بوابة الإدارة والشركاء") — reached from the buyer sign-in via
      "دخول الفريق". Signs in, reads server `role`, routes: admin→admin hub, supplier→partner hub, else
      signs back out + "ليس حساب إدارة أو شريك". VERIFIED on-device: buyer creds correctly rejected
      (sign-in 200 → get-session 200 → sign-out 200 → error). Routes: `portal_login`.

## PHASE 5 — Partner portal: MINIMAL LANDING built; full CRUD deferred (blocked on a supplier account).
- [x] **Minimal partner portal** (`ui/partner/*`): `PartnerHubScreen` + generic `partner_list/{key}` engine
      (`PartnerRepository.list` → `getPartnerList(@Path encoded)` → `toSimpleRow`), sections in
      `PartnerSections` (products, inventory, orders, reviews, earnings, withdrawals, invoices, coupons,
      ads, notifications, support). Gives supplier logins a landing. Live-but-403 until a supplier role exists.
- [ ] **Full partner CRUD (deferred):** store settings, product/variant create/edit, inventory adjust/movements/
      export, order status/notes, earnings/withdrawal requests, invoice detail, review reply/report, reports,
      subscription, support threads, onboarding, KYC. Build+verify once a supplier account is provisioned.
      NOTE: the VPS blocks even `POST /partner/onboard` (403), so no supplier account is creatable via the
      app — owner must promote one (`UPDATE "user" SET role='supplier'` / admin panel).

---

## Working method
1. Read the web source for the feature (`components/*`, `app/**/page.tsx`, `services/*`,
   `app/api/**/route.ts`) + confirm the live JSON shape via curl against the VPS.
2. Add DTO(s) → domain model + mapper → API binding → repository method → ViewModel → screen →
   nav wiring, matching existing app patterns.
3. Build with the VPS base URL, install, drive on the emulator, screenshot/verify, then REVERT the
   base URL to `10.0.2.2`.
4. Tick the box here + note anything non-obvious in `CLAUDE.md`.

## Open scoping notes
- Admin/partner in a *buyer* phone app is unusual (normally separate apps/web-only). Owner chose
  "everything"; revisit if the buyer app should stay shopper-only and partner/admin become separate
  modules or a build flavor.
