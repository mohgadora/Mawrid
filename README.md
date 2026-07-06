# مورِد (Mawrid)

منصة جملة إلكترونية **B2B/B2C** عربية أولاً (RTL). تسعير بالجملة والتجزئة، محافظ رقمية، كوبونات، مدفوعات، تتبّع سائقين، وبوابات للمشتري والمورد والأدمن.

## التقنيات (Stack)

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · PostgreSQL + Drizzle ORM · better-auth · SWR · pnpm · PM2 + Caddy (Contabo).

## التشغيل محليًا

```bash
pnpm install
cp .env.example .env.local      # املأ DATABASE_URL و BETTER_AUTH_URL و BETTER_AUTH_SECRET
pnpm db:migrate                 # طبّق الهجرات
pnpm dev                        # http://localhost:3600
```

## الأوامر (Scripts)

| الأمر | الغرض |
|---|---|
| `pnpm dev` | خادم التطوير (منفذ 3600) |
| `pnpm typecheck` | فحص الأنواع — يجب أن يمرّ نظيفًا |
| `pnpm test` | اختبارات الوحدة (Vitest) |
| `pnpm test:watch` | الاختبارات في وضع المراقبة |
| `pnpm build` | بناء الإنتاج |
| `pnpm docs:gen` | إعادة توليد `docs/API.md` و`docs/DATABASE.md` |
| `pnpm db:migrate` | تطبيق هجرات Drizzle |
| `pnpm create-admin` | إنشاء حساب أدمن |

## بوابة الجودة (CI)

كل push/PR يمرّ عبر GitHub Actions: **typecheck + test + build** (`.github/workflows/ci.yml`). لا يُدمج كود يكسر أيًّا منها.

## التوثيق

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — الطبقات، الأنماط الإلزامية، و«تعريف الاكتمال»، وخطوات إضافة ميزة.
- [`docs/API.md`](docs/API.md) — كل مسارات API (مُولّد آليًا).
- [`docs/DATABASE.md`](docs/DATABASE.md) — كل الجداول (مُولّد آليًا).

## النشر (Deploy)

`scripts/deploy.sh` (على السيرفر): يسحب الكود → `pnpm install` → **يطبّق `patch-db.sql` ثم كل هجرات `drizzle/*.sql` بالترتيب** (idempotent — لا انحراف في المخطط) → `pnpm build` → إعادة تشغيل PM2. النشر التلقائي عبر webhook على فرع `main`.

## قواعد ذهبية

- المال **بالسنتات** دائمًا عبر `lib/money.ts` و`lib/discounts.ts` — لا حساب عائم على العملة.
- التحقّق على الخادم فقط (`ValidationError`)؛ كل كتابة تُسجَّل في `audit_log`؛ العمليات المالية/المخزون ذرّية داخل معاملات.
