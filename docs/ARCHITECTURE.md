# هندسة مورِد — الأنماط والاتفاقيات (Conventions)

هذا المرجع يشرح كيف تُبنى كل ميزة في مورِد. **اتبعه بدقة** — التماسك هو ما يجعل المنصة مستقرة وقابلة للصيانة.

## الطبقات (Layers)

```
DB (Postgres)  →  Drizzle schema  →  Services (server-only)  →  API routes (/api/v1)  →  api-client  →  UI (SWR / server components)
```

- **Services** (`services/*.ts`): كل استعلامات Drizzle هنا فقط. تبدأ بـ `import 'server-only'`. لا تُستدعى من مكوّن عميل مباشرة.
- **API routes** (`app/api/v1/**/route.ts`): طبقة رقيقة تستدعي الخدمات، تتعامل مع المصادقة والأخطاء عبر `lib/api-helpers.ts`.
- **api-client** (`lib/api-client.ts`): دوال `fetch` رقيقة يستوردها العميل بأمان (لا كود server-only).
- **UI**: مكوّنات العميل تستخدم `useSWR`؛ مكوّنات الخادم تستدعي الخدمات مباشرة.

## قواعد إلزامية (Definition-of-Done inputs)

| القاعدة | كيف |
|---|---|
| **المال بالسنتات** | استخدم `lib/money.ts` (`toCents`/`fromCents`/`lineTotalCents`) و `lib/discounts.ts`. **ممنوع** الحساب العائم المباشر على العملة. الأسعار مخزّنة `numeric(12,2)` بالدولار. |
| **التحقق على الخادم** | لا تثق بأي مدخل من العميل. ارمِ `ValidationError` من `lib/errors.ts` (رسالة بالعربية أولاً). |
| **المصادقة** | كل مسار: `resolveActor()` (خدمة) أو `getApiUser()`/`requireAdmin()`/`requirePartner()` (route). |
| **الذرّية** | أي عملية تمسّ المال أو المخزون داخل `db.transaction()`، مع `SELECT ... FOR UPDATE` على الصفوف الحرجة (انظر `services/wallet.ts`). |
| **التدقيق** | كل عملية كتابة تُسجّل عبر `writeAuditLog()` من `lib/audit.ts`. |
| **ثنائي اللغة** | كل حقل نصّي معروض: `nameAr` (إلزامي) + `nameEn` (اختياري). |
| **الأنواع** | كل جدول يصدّر `type X = typeof x.$inferSelect` و `NewX = typeof x.$inferInsert`. |

## إضافة ميزة جديدة (Checklist)

1. **Migration**: ملف SQL في `drizzle/` (استخدم `CREATE TABLE IF NOT EXISTS` و `ADD COLUMN IF NOT EXISTS` — النشر يعيد تطبيقها).
2. **Schema**: أضف الجدول في `lib/db/schema.ts` وصدّر أنواعه.
3. **Service**: منطق الأعمال في `services/`.
4. **API**: مسار في `app/api/v1/` يستدعي الخدمة.
5. **api-client**: دالة fetch للعميل.
6. **UI**: صفحة/مكوّن (حالات تحميل + خطأ + فراغ إلزامية).
7. **Test**: منطق حسابي حرج → اختبار في `lib/*.test.ts`.
8. تحقّق: `pnpm typecheck && pnpm test && pnpm build`، ثم `pnpm docs:gen`.

## الأوامر (Commands)

| الأمر | الغرض |
|---|---|
| `pnpm dev` | خادم التطوير (منفذ 3600) |
| `pnpm typecheck` | فحص الأنواع (لا أخطاء مسموحة) |
| `pnpm test` | اختبارات الوحدة (Vitest) |
| `pnpm build` | بناء الإنتاج |
| `pnpm docs:gen` | إعادة توليد مرجع API + قاعدة البيانات |
| `pnpm db:migrate` | تطبيق هجرات Drizzle (بيئة التطوير) |

## النشر (Deployment)

النشر عبر `scripts/deploy.sh` (Contabo + PM2): يسحب الكود → يثبّت الاعتماديات → **يطبّق `patch-db.sql` ثم كل هجرات `drizzle/*.sql` بالترتيب** (idempotent، فلا انحراف في المخطط) → يبني → يعيد تشغيل PM2. النشر التلقائي عبر `scripts/webhook-server.js` على دفعات فرع `main`.

## المراجع

- [مرجع الـ API](./API.md) — كل المسارات (مُولّد آليًا).
- [مرجع قاعدة البيانات](./DATABASE.md) — كل الجداول (مُولّد آليًا).
