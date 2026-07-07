# Mawrid — PR الجولة الرابعة (إغلاق ملاحظات v3 النهائية)

كل بنود المراجعة الستّة نُفِّذت وتحقّقت **فعلياً** بتشغيل قاعدة PostgreSQL حقيقية.

## 1. أخطاء التحقّق تُرجَع 400 لا 500
- ملف جديد `lib/errors.ts` → `ValidationError` + `isValidationError`.
- `lib/pricing.ts` و`services/orders.ts` يرميان `ValidationError` للأخطاء القابلة للتصحيح (سلة فارغة، أسطر/كمية غير صالحة، عدد أسطر كبير، منتج غير متاح، لا توجد شريحة سعر، هاتف غير صالح، إلغاء طلب مشحون).
- `lib/api-helpers.ts` → `apiError(err)`: يرجع `badRequest(err.message)` للتحقّق و`serverError(err)` لغيره. الرسائل آمنة (بلا stack/تفاصيل داخلية).
- `app/api/v1/orders/route.ts` (POST) و`orders/[id]/cancel/route.ts` يستخدمان `apiError`.
- **تحقّق:** ValidationError → 400، Error عام → 500، منتج غير متاح → 400. ✅

## 2. طريقة دفع غير صالحة تُرفض (400) لا تُحوّل إلى cod
- `services/orders.ts`: `createOrder` يقبل `paymentMethod: string`، ويتحقّق ضد `['cod','card','bank']`، ويرمي `ValidationError` لغير الصالح. لا إعادة كتابة صامتة. ✅

## 3. فحص BETTER_AUTH_SECRET في سكربت الأدمن
- `scripts/create-admin.ts`: في الإنتاج بلا `BETTER_AUTH_SECRET` → رسالة واضحة و`exit(1)`. سلوك SSL عبر `lib/db/ssl.ts` دون تغيير.
- **تحقّق:** إنتاج بلا سرّ → خروج 1 برسالة؛ إنتاج مع سرّ → يكمل. ✅

## 4. تقوية نقاط الـ AI العامة
- `app/api/image-search/route.ts` و`recommendations/route.ts`:
  - **فشل مغلق:** بلا `AI_GATEWAY_API_KEY` → **503** (لا تشغيل). (تحقّق ✅)
  - حدّ **في الدقيقة + حدّ يومي**.
  - **مفضّلٌ حسب المستخدم** (`identityKey`) عند توفّر جلسة، وإلا حسب IP.
  - رسائل خطأ عامة (بلا تسريب المزوّد).
- `lib/rate-limit.ts`: أُضيف `identityKey(req, scope, userId?)`.

## 5. توثيق قيد الـ rate limiting
- `docs/production-smoke-test.md`: المحدِّد في الذاكرة يصلح لنسخة واحدة؛ للنشر متعدد النسخ (PM2 cluster/توسّع أفقي/حاويات) يلزم Redis أو مخزن مشترك.

## 6. الفحوص النهائية
- ✅ `pnpm typecheck` = 0 أخطاء.
- ✅ `pnpm build` يُترجم (يتوقّف فقط عند جلب Google Fonts — قيد شبكة بيئة الفحص).
- ✅ `pnpm db:migrate` → 23 جدولاً على قاعدة نظيفة.
- ✅ `pnpm create-admin` → أنشأ أدمن فعلياً.

## ملفات جديدة
`lib/errors.ts`

## ملفات معدّلة
`lib/pricing.ts`, `services/orders.ts`, `lib/api-helpers.ts`, `app/api/v1/orders/route.ts`, `app/api/v1/orders/[id]/cancel/route.ts`, `scripts/create-admin.ts`, `app/api/image-search/route.ts`, `app/api/recommendations/route.ts`, `lib/rate-limit.ts`, `.env.example`, `docs/production-smoke-test.md`

## مخاطر متبقّية
- **rate limiting في الذاكرة**: يجب استبداله بـ Redis قبل النشر متعدد النسخ (موثّق).
- **`x-forwarded-for`**: فعّل `RATE_LIMIT_TRUST_PROXY=true` فقط خلف بروكسي موثوق.
- **Google Fonts**: يتطلّب `pnpm build` وصولاً لـ fonts.googleapis.com (طبيعي في بيئة الإنتاج).
- يُنصح بتشغيل `docs/production-smoke-test.md` كاملاً على staging مطابق قبل العميل.
