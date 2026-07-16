/**
 * Shape-only patterns — these mirror new-ui/lib/validations.ts. They check the
 * format of what was typed, not that the number or UPI handle actually exists.
 * Keep the two files in step.
 */
export const USER_NAME_PATTERN = /^[a-zA-Z\s'-]+$/
export const MOBILE_NUMBER_PATTERN = /^(\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/
export const UPI_ID_PATTERN = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/

/** A machine id is a client-minted UUID v4; a fingerprint is a 64-char hex hash. */
export const MACHINE_ID_PATTERN = /^[a-zA-Z0-9-]{8,64}$/
export const FINGERPRINT_PATTERN = /^[a-f0-9]{16,64}$/

/**
 * mobileNumber is the identity key, so "+91 98765 43210" and "9876543210" have
 * to collapse to one value or the dedupe silently creates a second account.
 */
export function normalizeMobileNumber(mobileNumber: string): string {
  const digits = (mobileNumber ?? '').replace(/\D/g, '')
  return digits.length > 10 && digits.startsWith('91') ? digits.slice(-10) : digits
}
