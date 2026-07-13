/**
 * lib/conversation.ts — pure participant-set helpers for chat (no I/O).
 * Conversations are deduped by their normalized participant set, so this logic
 * must be exact.
 */

/** Trims, drops empties, dedupes, and sorts participant ids for stable compare. */
export function normalizeParticipants(ids: string[]): string[] {
  return [...new Set((ids ?? []).map((p) => String(p ?? '').trim()).filter(Boolean))].sort()
}

/** True when two id lists describe the same participant set. */
export function sameParticipants(a: string[], b: string[]): boolean {
  const na = normalizeParticipants(a)
  const nb = normalizeParticipants(b)
  return na.length === nb.length && na.every((x, i) => x === nb[i])
}
