/**
 * lib/template.ts — pure {{variable}} template rendering (no DB, no I/O).
 * Used by email templates and notification templates. Extracted so the
 * substitution rules are unit-tested.
 */

/** Replaces {{key}} tokens with values. Unknown keys render as empty strings. */
export function renderTemplate(text: string, variables: Record<string, string | number> = {}): string {
  return String(text ?? '').replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key: string) => {
    const v = variables[key]
    return v == null ? '' : String(v)
  })
}
