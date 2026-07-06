#!/usr/bin/env bash
# Regenerates docs/API.md and docs/DATABASE.md from the codebase so they never
# drift. Run:  pnpm docs:gen
# Note: no `set -e` — grep returns non-zero on no-match (routes without a given
# HTTP method), which is expected and must not abort generation.
set -u
cd "$(dirname "$0")/.."
mkdir -p docs

# ── API reference ────────────────────────────────────────────────────────────
{
  echo "# مرجع الـ API — Mawrid"
  echo ""
  echo "> يُولَّد آليًا من شجرة \`app/api\`. لا تُحرّره يدويًا — شغّل \`pnpm docs:gen\`."
  echo ""
  echo "جميع المسارات تحت \`/api/v1\` تُعيد \`{ data }\` عند النجاح و \`{ error }\` عند الفشل، وتستخدم \`resolveActor()\`/\`requireAdmin()\` للمصادقة."
  echo ""
  echo "| المسار | الطرق |"
  echo "|---|---|"
  for f in $(find app/api -name route.ts | sort); do
    path=$(echo "$f" | sed -E 's#^app##; s#/route\.ts$##; s#\[([a-zA-Z.]+)\]#:\1#g')
    methods=$(grep -oE "export (async )?function (GET|POST|PATCH|PUT|DELETE)" "$f" | grep -oE "GET|POST|PATCH|PUT|DELETE" | sort -u | tr '\n' ' ' | sed 's/ $//')
    [ -z "$methods" ] && methods="—"
    echo "| \`$path\` | $methods |"
  done
} > docs/API.md

# ── Database reference ───────────────────────────────────────────────────────
{
  echo "# مرجع قاعدة البيانات — Mawrid"
  echo ""
  echo "> يُولَّد آليًا من \`lib/db/schema.ts\`. عدد الجداول: $(grep -c "pgTable(" lib/db/schema.ts). الهجرات في \`drizzle/\`."
  echo ""
  echo "| الجدول | متغيّر Drizzle |"
  echo "|---|---|"
  grep -oE "export const [a-zA-Z]+ = pgTable\('[a-z_]+'" lib/db/schema.ts | sed -E "s/export const ([a-zA-Z]+) = pgTable\('([a-z_]+)'/| \`\2\` | \`\1\` |/"
} > docs/DATABASE.md

echo "Generated docs/API.md and docs/DATABASE.md"
