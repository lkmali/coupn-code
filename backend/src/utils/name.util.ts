/**
 * Name sanitization helpers shared by user registration and Exotel agent
 * provisioning. Lives in one place so the name we store and the name we
 * send to external services (Exotel in particular) stay consistent.
 *
 * Background: Exotel's /usermapping API rejects payloads with
 * `Invalid parameter, last_name too short`. The API appears to split
 * AppUsername on whitespace and validate each half, so titles like "Dr."
 * and trailing spaces can blow up the registration call.
 */

// Titles Exotel tends to swallow as the first name; we strip them so the
// real first name lands in the payload. Matched case-insensitively at the
// start of the string only.
const TITLE_PATTERN = /^(dr|mr|mrs|ms|miss|prof|sir|madam|sr|jr)\.?\s+/i

// Canonical list — also used by the UI-level error message to tell the user
// exactly which tokens are blocked. Keep in sync with TITLE_PATTERN.
export const BLOCKED_NAME_TITLES = ['Dr', 'Mr', 'Mrs', 'Ms', 'Miss', 'Prof', 'Sir', 'Madam', 'Sr', 'Jr']

// Full-name rule: 2+ space-separated parts, each part 2–30 chars, starts with a letter,
// and only letters/hyphen/apostrophe. No digits (names never have them) and no trailing punctuation.
// A single `.` inside a part is rejected here — titles are caught earlier by BLOCKED_NAME_TITLES,
// and real names don't need interior periods.
const FULL_NAME_PART = /^[A-Za-z][A-Za-z\-']{1,29}$/

/**
 * Collapse whitespace, strip leading titles, and trim. Use at storage
 * time so `user.userName` is always clean — avoids running sanitize in
 * every downstream consumer.
 */
export function sanitizeUserName(raw: string | null | undefined): string {
  if (!raw) return ''
  return String(raw)
    .replace(/\s+/g, ' ')
    .trim()
    .replace(TITLE_PATTERN, '')
    .trim()
}

/**
 * Returns a human-readable error string if the raw name fails the storage-time rule,
 * or `null` when it's acceptable. Used by the backend DTO validator and mirrored in
 * the frontend so the same error is reached from both sides.
 *
 * Rules (designed so stored names are always Exotel-registerable):
 *   - required
 *   - no leading/trailing whitespace
 *   - at least two space-separated parts (first + last)
 *   - each part 2–30 chars, starts with a letter, letters/hyphen/apostrophe only
 *   - must not start with a title (Dr./Mr./Mrs./Ms./Miss/Prof./Sir/Madam/Sr/Jr)
 */
export function validateFullName(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) return 'Full name is required'
  const original = String(raw)
  if (original.length === 0) return 'Full name is required'
  if (original !== original.trim()) return 'Name must not start or end with a space'
  if (/\s{2,}/.test(original)) return 'Name must have only single spaces between words'

  const parts = original.split(' ')
  // Leading title check — catches "Dr. Ajay Prajapati" before the token-shape check would.
  const firstTokenNoDot = parts[0].replace(/\.$/, '')
  if (BLOCKED_NAME_TITLES.some(t => t.toLowerCase() === firstTokenNoDot.toLowerCase())) {
    return `Please remove the title "${parts[0]}" — enter first and last name only`
  }

  if (parts.length < 2) return 'Enter first and last name (e.g. "Ajay Prajapati")'

  for (const part of parts) {
    if (!FULL_NAME_PART.test(part)) {
      return 'Each part must be 2–30 letters (letters, hyphen, and apostrophe only)'
    }
  }

  return null
}

/**
 * Produce a (first, last) pair safe for Exotel. Exotel rejects short
 * last names, so when the sanitized input is a single word we repeat it
 * as both parts rather than let the request fail.
 *
 * Returns `{ first, last, display }` — `display` is the cleaned full
 * name suitable for AppUsername/ExotelUserName fields.
 */
export function splitNameForExotel(raw: string | null | undefined, fallback = 'Agent'): {
  first: string
  last: string
  display: string
} {
  const clean = sanitizeUserName(raw) || fallback
  const parts = clean.split(' ').filter(Boolean)

  let first = parts[0] || fallback
  let last = parts.slice(1).join(' ')

  // Exotel requires last_name of at least 2 chars. Fall back to the first
  // name so the payload is always accepted; surfaces obviously-missing
  // last names in logs as "first first" rather than silently failing.
  if (!last || last.length < 2) {
    last = first
  }
  if (first.length < 2) {
    first = fallback
  }

  return { first, last, display: `${first} ${last}` }
}
