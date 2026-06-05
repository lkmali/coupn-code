/**
 * Unit Request Correlation (URC) — a single string that threads through
 * request logs across UI, backend, and agents so a single failing request
 * can be located end-to-end.
 *
 * Format: `<SOURCE>-<epochMs>-<5 random chars>` (e.g. `WEB-1714123456789-a1b2c`)
 *   - SOURCE is a short origin tag: WEB / AGENT / SRV / MCP …
 *   - epochMs is monotonic enough to order requests at a glance
 *   - 5 random chars are enough to disambiguate within the same millisecond
 *
 * The backend accepts an incoming URC via the `X-URC` header, falls back to
 * a generated SRV-URC if missing, and echoes it back on the response so the
 * caller can confirm what the server logged against.
 */

export const URC_HEADER = 'x-urc'

// Sanity check: only accept URCs that look like our spec (max length capped
// to prevent log/header abuse via oversized strings).
const URC_PATTERN = /^[A-Za-z]{2,10}-\d{10,16}-[A-Za-z0-9]{3,10}$/

/** 5 base36 chars — ~60 million values, enough for per-millisecond uniqueness. */
function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7).padEnd(5, '0')
}

/**
 * Build a URC. Callers pick the source tag so log grep-ability works:
 *   - WEB   from the browser axios client
 *   - AGENT from an automated agent/worker making API calls
 *   - MCP   from the MCP tool surface
 *   - SRV   when the backend had to generate its own (no header supplied)
 */
export function generateUrc(source: string): string {
  const tag = String(source || 'SRV').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 10) || 'SRV'
  return `${tag}-${Date.now()}-${randomSuffix()}`
}

/**
 * Returns the incoming URC if it is well-formed, otherwise `null`.
 * Used by the middleware — keeps a malformed client header from polluting
 * logs with arbitrary attacker-supplied strings.
 */
export function parseIncomingUrc(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed || !URC_PATTERN.test(trimmed)) return null
  return trimmed
}
