/**
 * Phone-number helpers for the call-routing pipeline.
 *
 * Users add numbers in PhoneRouting in many shapes (`+91 98765 43210`,
 * `919876543210`, `9876543210`, `09876543210`). Exotel's webhook delivers
 * the called number in yet another shape. Without normalization, the
 * stored value and the inbound value rarely match string-for-string and
 * the routing lookup silently misses — leaving the lead unassigned.
 *
 *  - `canonicalizePhoneNumber` is used on save so new rows are uniform.
 *  - `getPhoneNumberVariants` is used on lookup so legacy rows saved in
 *    a non-canonical shape still match a newly-arrived webhook payload.
 */

const INDIA_COUNTRY_CODE = '91'

function extractIndianCore(input: unknown): string | null {
  const digits = String(input ?? '').replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith(INDIA_COUNTRY_CODE) && digits.length === 12) {
    return digits.slice(2)
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return digits.slice(1)
  }
  if (digits.length === 10) return digits
  return null
}

/** Canonical storage form: `91XXXXXXXXXX`. */
export function canonicalizePhoneNumber(input: string): string {
  const core = extractIndianCore(input)
  if (core) return `${INDIA_COUNTRY_CODE}${core}`
  return String(input ?? '').trim()
}

/** Every plausible stored shape for the same number, for `$in` lookups. */
export function getPhoneNumberVariants(input: string): string[] {
  const trimmed = String(input ?? '').trim()
  const core = extractIndianCore(input)
  if (!core) {
    const digits = trimmed.replace(/\D/g, '')
    return Array.from(new Set([trimmed, digits].filter(Boolean)))
  }
  return Array.from(
    new Set([
      `${INDIA_COUNTRY_CODE}${core}`,
      `+${INDIA_COUNTRY_CODE}${core}`,
      core,
      `0${core}`,
      `+${core}`,
    ]),
  )
}
