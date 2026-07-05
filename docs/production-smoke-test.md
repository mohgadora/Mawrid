# Mawrid — Production Smoke Test

فحص سريع قبل تسليم العميل. نفّذ الأوامر بالترتيب، وتحقّق من كل نتيجة متوقّعة.

## 1. البناء والقاعدة

```bash
pnpm install
pnpm typecheck          # متوقّع: 0 أخطاء
pnpm build              # متوقّع: بناء ناجح (يتطلّب وصولاً لـ Google Fonts)
pnpm db:migrate         # متوقّع: "migrations applied successfully" — 23 جدولاً
```

إنشاء أول أدمن (يدوياً، لا يوجد endpoint عام):

```bash
SEED_ADMIN_EMAIL=admin@example.com \
SEED_ADMIN_PASSWORD='StrongPasswordHere' \
pnpm create-admin       # متوقّع: "✅ admin created" (وإعادة التشغيل تُرقّي الموجود)
```

## 2. فحوص أمنية يدوية

| الفحص | الأمر / الإجراء | المتوقّع |
|------|----------------|---------|
| لا باب أدمن عام | `curl -i https://APP/api/create-admin` | **404** |
| حماية admin API لغير المصرّح | استدعاء `GET /api/v1/admin/buyers` بجلسة consumer | **403** |
| وصول الأدمن | نفس الطلب بجلسة admin | **200** |
| تجاهل سعر العميل | أنشئ طلباً بـ `unitPrice: 0.01` في الجسم | السعر المخزَّن = سعر `price_tier` الصحيح |
| منتج معطّل | طلب لمنتج `active=false` | **يُرفض** (PRODUCT_UNAVAILABLE) |
| enum غير صالح | `PATCH /api/v1/admin/approvals/:id` بـ `status:"foo"` | **400** |
| enum مورّد غير صالح | `PATCH /api/v1/admin/suppliers` بـ `status:"foo"` | **400** |
| هاتف غير صالح | إنشاء طلب بهاتف `"abc"` | **400/خطأ تحقّق** |
| SSL إنتاجي | تشغيل بلا `DATABASE_CA_CERT` وبلا `DATABASE_ALLOW_INSECURE_SSL` | **يفشل التشغيل** برسالة واضحة |

## 3. تحقّق SSL (سلوك موحّد بين التطبيق والسكربت)

- إنتاج + `DATABASE_CA_CERT` (PEM inline أو مسار ملف) → اتصال مُتحقَّق منه.
- إنتاج + `DATABASE_ALLOW_INSECURE_SSL=true` (بلا CA) → يعمل مع تحذير واضح.
- إنتاج بلا أيٍّ منهما → **يرمي ويتوقّف** (لا اتصال غير موثّق بصمت).
- `sslmode=disable` → بلا SSL (تطوير فقط).

نفس السياسة مطبّقة في `lib/db/index.ts` و`scripts/create-admin.ts` عبر `lib/db/ssl.ts`.

## 4. متغيّرات البيئة المطلوبة

راجع `.env.example`. الحدّ الأدنى للإنتاج:
`DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, و(`DATABASE_CA_CERT` أو `DATABASE_ALLOW_INSECURE_SSL=true`).
اضبط `RATE_LIMIT_TRUST_PROXY=true` فقط خلف بروكسي موثوق، و`ALLOW_MOCK_FALLBACK=false`.

## 5. حدود المعدّل (Rate limiting) — قيد النشر

المحدِّد الحالي (`lib/rate-limit.ts`) **في الذاكرة**، وهذا مقبول **لنسخة خادم واحدة فقط**.
- لنشر عدة نسخ (PM2 cluster، توسّع أفقي، عدة حاويات) **يجب** استبداله بمخزن مشترك (Redis: `INCR` + `EXPIRE`) وإلا سيكون الحدّ لكل نسخة على حدة ويمكن تجاوزه.
- نقاط الـ AI (`image-search`, `recommendations`) محميّة بـ: فشل مغلق عند غياب `AI_GATEWAY_API_KEY`، وحدّ في الدقيقة + حدّ يومي، مفضّلٌ حسب المستخدم عند توفّر جلسة وإلا حسب IP.
- `RATE_LIMIT_TRUST_PROXY=true` فقط خلف بروكسي موثوق يعيد كتابة `x-forwarded-for`.
