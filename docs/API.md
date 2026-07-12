# مرجع الـ API — Mawrid

> يُولَّد آليًا من شجرة `app/api`. لا تُحرّره يدويًا — شغّل `pnpm docs:gen`.

جميع المسارات تحت `/api/v1` تُعيد `{ data }` عند النجاح و `{ error }` عند الفشل، وتستخدم `resolveActor()`/`requireAdmin()` للمصادقة.

| المسار | الطرق |
|---|---|
| `/api/auth/:...all` | — |
| `/api/image-search` | POST |
| `/api/recommendations` | POST |
| `/api/v1/account/addresses/:id` | DELETE PATCH |
| `/api/v1/account/addresses` | GET POST |
| `/api/v1/account/buyer-type` | POST |
| `/api/v1/account/favorites/:productId` | POST |
| `/api/v1/account/favorites` | GET |
| `/api/v1/account/following` | GET |
| `/api/v1/account/kyc` | GET POST |
| `/api/v1/account/loyalty/redeem` | POST |
| `/api/v1/account/loyalty` | GET |
| `/api/v1/account/notifications/:id` | DELETE PATCH |
| `/api/v1/account/notifications/read-all` | POST |
| `/api/v1/account/notifications` | GET |
| `/api/v1/account/profile` | GET PATCH |
| `/api/v1/account/referral` | GET |
| `/api/v1/account/refunds` | GET POST |
| `/api/v1/account/templates` | GET POST |
| `/api/v1/admin/ads/:id` | DELETE PATCH |
| `/api/v1/admin/ads` | GET POST |
| `/api/v1/admin/analytics/coupon-report` | GET |
| `/api/v1/admin/analytics/kpi` | GET |
| `/api/v1/admin/analytics/revenue-by-day` | GET |
| `/api/v1/admin/analytics/summary` | GET |
| `/api/v1/admin/analytics/top-products` | GET |
| `/api/v1/admin/analytics/top-suppliers` | GET |
| `/api/v1/admin/analytics/wallet-report` | GET |
| `/api/v1/admin/approvals/:id` | PATCH |
| `/api/v1/admin/approvals` | GET |
| `/api/v1/admin/audit` | GET |
| `/api/v1/admin/blog/:id` | DELETE PATCH |
| `/api/v1/admin/blog` | GET POST |
| `/api/v1/admin/buyers/:id` | PATCH |
| `/api/v1/admin/buyers` | GET |
| `/api/v1/admin/cashback-rules/:id` | DELETE PATCH |
| `/api/v1/admin/cashback-rules` | GET POST |
| `/api/v1/admin/clearance/:id` | DELETE |
| `/api/v1/admin/clearance` | GET POST |
| `/api/v1/admin/collections/:key` | GET PUT |
| `/api/v1/admin/commissions` | GET |
| `/api/v1/admin/countries/:code` | PATCH |
| `/api/v1/admin/countries` | GET POST |
| `/api/v1/admin/coupons/:id` | DELETE PATCH |
| `/api/v1/admin/coupons` | GET POST |
| `/api/v1/admin/deals/:id` | DELETE |
| `/api/v1/admin/deals` | GET POST |
| `/api/v1/admin/drivers/:id/location` | PATCH |
| `/api/v1/admin/drivers/:id` | PATCH |
| `/api/v1/admin/drivers` | GET |
| `/api/v1/admin/email-templates/:id` | DELETE |
| `/api/v1/admin/email-templates/:id/test` | POST |
| `/api/v1/admin/email-templates` | GET POST |
| `/api/v1/admin/finance` | GET |
| `/api/v1/admin/finance/withdrawals/:id/approve` | POST |
| `/api/v1/admin/finance/withdrawals/:id/paid` | POST |
| `/api/v1/admin/finance/withdrawals/:id/reject` | POST |
| `/api/v1/admin/finance/withdrawals/:id` | PATCH |
| `/api/v1/admin/finance/withdrawals` | GET |
| `/api/v1/admin/flash-sales/:id/products/:productId` | DELETE |
| `/api/v1/admin/flash-sales/:id/products` | POST |
| `/api/v1/admin/flash-sales/:id` | DELETE GET PATCH |
| `/api/v1/admin/flash-sales` | GET POST |
| `/api/v1/admin/impersonate` | DELETE GET POST |
| `/api/v1/admin/kpi` | GET |
| `/api/v1/admin/loyalty/:userId/adjust` | POST |
| `/api/v1/admin/loyalty` | GET |
| `/api/v1/admin/notifications/broadcast` | POST |
| `/api/v1/admin/orders/:id/edit` | POST |
| `/api/v1/admin/orders/:id` | GET |
| `/api/v1/admin/orders` | GET |
| `/api/v1/admin/products/:id/approve` | POST |
| `/api/v1/admin/products/:id/reject` | POST |
| `/api/v1/admin/products/:id` | PATCH |
| `/api/v1/admin/products/pending` | GET |
| `/api/v1/admin/products` | GET POST |
| `/api/v1/admin/referrals/:id/reward` | POST |
| `/api/v1/admin/referrals` | GET |
| `/api/v1/admin/refunds/:id/approve` | POST |
| `/api/v1/admin/refunds/:id/process` | POST |
| `/api/v1/admin/refunds/:id/reject` | POST |
| `/api/v1/admin/refunds` | GET |
| `/api/v1/admin/roles` | GET |
| `/api/v1/admin/seo/:id` | DELETE |
| `/api/v1/admin/seo` | GET POST |
| `/api/v1/admin/sessions/:id` | DELETE |
| `/api/v1/admin/sessions` | GET |
| `/api/v1/admin/settings` | GET PATCH |
| `/api/v1/admin/store-subscriptions` | GET |
| `/api/v1/admin/subscription-plans/:id` | DELETE PATCH |
| `/api/v1/admin/subscription-plans` | GET POST |
| `/api/v1/admin/suppliers-list` | GET |
| `/api/v1/admin/suppliers/:id/commission` | PATCH |
| `/api/v1/admin/suppliers/:id` | GET PATCH |
| `/api/v1/admin/suppliers` | GET PATCH |
| `/api/v1/admin/tickets/:id/detail` | GET |
| `/api/v1/admin/tickets/:id/reply` | POST |
| `/api/v1/admin/tickets/:id` | DELETE PATCH |
| `/api/v1/admin/tickets` | GET POST |
| `/api/v1/admin/wallet-bonuses/:id` | DELETE PATCH |
| `/api/v1/admin/wallet-bonuses` | GET POST |
| `/api/v1/admin/wallets/:userId/adjust` | POST |
| `/api/v1/admin/wallets` | GET |
| `/api/v1/admin/zones/:id` | DELETE GET PATCH |
| `/api/v1/admin/zones/:id/rules/:ruleId` | DELETE PATCH |
| `/api/v1/admin/zones/:id/rules` | GET POST |
| `/api/v1/admin/zones` | GET POST |
| `/api/v1/ads/:id/track` | POST |
| `/api/v1/ads` | GET |
| `/api/v1/auth/otp/send` | POST |
| `/api/v1/auth/otp/verify` | POST |
| `/api/v1/blog/:slug` | GET |
| `/api/v1/blog` | GET |
| `/api/v1/cashback/preview` | POST |
| `/api/v1/categories` | GET |
| `/api/v1/clearance` | GET |
| `/api/v1/conversations/:id/messages` | GET POST |
| `/api/v1/conversations/:id/read` | POST |
| `/api/v1/conversations` | GET |
| `/api/v1/conversations/start` | POST |
| `/api/v1/conversations/unread-count` | GET |
| `/api/v1/coupons` | GET |
| `/api/v1/coupons/validate` | POST |
| `/api/v1/deals/today` | GET |
| `/api/v1/flash-sales/active` | GET |
| `/api/v1/orders/:id/cancel` | POST |
| `/api/v1/orders/:id` | GET |
| `/api/v1/orders/guest` | POST |
| `/api/v1/orders` | GET POST |
| `/api/v1/partner/ads` | POST |
| `/api/v1/partner/categories` | GET |
| `/api/v1/partner/coupons/:id` | DELETE |
| `/api/v1/partner/coupons` | GET POST |
| `/api/v1/partner/dashboard` | GET |
| `/api/v1/partner/earnings` | GET |
| `/api/v1/partner/inventory/adjust` | POST |
| `/api/v1/partner/inventory/export` | GET |
| `/api/v1/partner/inventory/movements` | GET |
| `/api/v1/partner/inventory` | GET |
| `/api/v1/partner/invoices/:id` | GET |
| `/api/v1/partner/invoices` | GET |
| `/api/v1/partner/kyc` | GET POST |
| `/api/v1/partner/notifications/:id/read` | PATCH |
| `/api/v1/partner/notifications/read-all` | PATCH |
| `/api/v1/partner/notifications` | GET |
| `/api/v1/partner/onboard` | POST |
| `/api/v1/partner/orders/:id/note` | POST |
| `/api/v1/partner/orders/:id` | GET PATCH |
| `/api/v1/partner/orders/:id/status` | PATCH |
| `/api/v1/partner/orders` | GET |
| `/api/v1/partner/products/:id` | DELETE GET PATCH |
| `/api/v1/partner/products/:id/status` | PATCH |
| `/api/v1/partner/products/:id/variants/:variantId` | DELETE PATCH |
| `/api/v1/partner/products/:id/variants` | GET POST |
| `/api/v1/partner/products` | GET POST |
| `/api/v1/partner/reports/earnings` | GET |
| `/api/v1/partner/reports/orders` | GET |
| `/api/v1/partner/reports/products` | GET |
| `/api/v1/partner/reports/sales` | GET |
| `/api/v1/partner/reports/stock` | GET |
| `/api/v1/partner/reviews/:reviewId/reply` | POST |
| `/api/v1/partner/reviews/:reviewId/report` | POST |
| `/api/v1/partner/reviews` | GET |
| `/api/v1/partner/store` | GET PATCH |
| `/api/v1/partner/subscription` | DELETE GET POST |
| `/api/v1/partner/support/tickets/:id/close` | PATCH |
| `/api/v1/partner/support/tickets/:id/messages` | POST |
| `/api/v1/partner/support/tickets/:id` | GET |
| `/api/v1/partner/support/tickets` | GET POST |
| `/api/v1/partner/withdrawals/:id/cancel` | PATCH |
| `/api/v1/partner/withdrawals` | GET POST |
| `/api/v1/payments/callback` | GET |
| `/api/v1/payments/create` | POST |
| `/api/v1/products/:id/restock-request` | GET POST |
| `/api/v1/products/:id/reviews/:reviewId/helpful` | POST |
| `/api/v1/products/:id/reviews/:reviewId/reply` | POST |
| `/api/v1/products/:id/reviews` | GET POST |
| `/api/v1/products/:id/variants` | GET |
| `/api/v1/products` | GET |
| `/api/v1/products/search` | GET |
| `/api/v1/recommendations` | GET |
| `/api/v1/search/popular` | GET |
| `/api/v1/search/recent` | GET |
| `/api/v1/shipping/calculate` | GET |
| `/api/v1/shops/:id/follow` | DELETE GET POST |
| `/api/v1/subscription-plans` | GET |
| `/api/v1/suppliers` | GET |
| `/api/v1/upload` | POST |
| `/api/v1/wallet` | GET |
| `/api/v1/wallet/topup` | POST |
| `/api/v1/wallet/transactions` | GET |
