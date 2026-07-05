/**
 * lib/db/ssl.ts — سياسة SSL موحّدة لقاعدة البيانات، مشتركة بين تطبيق الويب
 * (`lib/db/index.ts`) وسكربتات CLI (`scripts/create-admin.ts`).
 *
 * القواعد:
 *  - sslmode=disable في DATABASE_URL            → بلا SSL (تطوير محلي فقط).
 *  - DATABASE_CA_CERT (محتوى PEM أو مسار ملف)   → SSL مُتحقَّق منه (rejectUnauthorized:true).
 *  - DATABASE_ALLOW_INSECURE_SSL=true           → SSL بلا تحقّق (opt-in صريح) مع تحذير.
 *  - إنتاج بلا أيٍّ ممّا سبق                      → يرمي خطأً (لا اتصال غير موثّق بصمت).
 */
import { readFileSync } from 'node:fs'

export type DbSslConfig = false | { rejectUnauthorized: boolean; ca?: string }

const PEM_PREFIX = '-----BEGIN CERTIFICATE-----'

/** يقرأ شهادة CA سواء كانت محتوى PEM مباشرة أو مساراً لملف على القرص. */
function loadCaCert(value: string): string {
  const v = value.trim()
  if (v.startsWith(PEM_PREFIX)) {
    // محتوى inline — قد يأتي بأسطر مهروبة "\n" من متغيّر بيئة
    return v.includes('\\n') ? v.replace(/\\n/g, '\n') : v
  }
  // خلاف ذلك: مسار ملف
  try {
    return readFileSync(v, 'utf8')
  } catch (err) {
    throw new Error(`[db] Failed to read DATABASE_CA_CERT file at "${v}": ${String(err)}`)
  }
}

/**
 * يرجع إعداد ssl الممرَّر إلى `new Pool({ ssl })`.
 * @param databaseUrl قيمة DATABASE_URL (لفحص sslmode=disable).
 * @param env متغيّرات البيئة (افتراضياً process.env) — لتسهيل الاختبار.
 */
export function getDatabaseSslConfig(
  databaseUrl = process.env.DATABASE_URL ?? '',
  env: NodeJS.ProcessEnv = process.env,
): DbSslConfig {
  const sslDisabled = databaseUrl.includes('sslmode=disable')
  if (sslDisabled) return false

  const isProd = env.NODE_ENV === 'production'
  const caRaw = env.DATABASE_CA_CERT?.trim()
  const allowInsecure = env.DATABASE_ALLOW_INSECURE_SSL === 'true'

  if (caRaw) {
    return { rejectUnauthorized: true, ca: loadCaCert(caRaw) }
  }

  if (isProd && !allowInsecure) {
    throw new Error(
      '[db] Refusing insecure DB connection in production. ' +
        'Provide DATABASE_CA_CERT (verified) or set DATABASE_ALLOW_INSECURE_SSL=true (explicit opt-out).',
    )
  }

  if (isProd && allowInsecure) {
    console.warn(
      '[db] SSL certificate verification is DISABLED (DATABASE_ALLOW_INSECURE_SSL=true). ' +
        'Prefer DATABASE_CA_CERT for a verified connection.',
    )
  }

  return { rejectUnauthorized: false }
}
