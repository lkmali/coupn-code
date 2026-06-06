import { randomBytes } from 'crypto'

// Opaque field-key minter — back-end mirror of `frontend/src/lib/fieldKey.ts`.
//
// FormFields normally arrive with a `fieldKey` already minted by the form
// builder UI, but legacy fields and any field saved before that change ships
// won't have one. The save endpoint defensively back-fills missing keys via
// `mintFieldKey()` so every persisted field is guaranteed to have a stable
// id by the time we reach `submitTaskForm` and write to `form_responses`.
//
// Format: "fk_" + 10 base36 chars sourced from `crypto.randomBytes` so the
// id is unguessable if it ever leaks into a URL or log line. Avoids BigInt
// (target is < ES2020 in some build configs) by composing two 32-bit halves.
export function mintFieldKey(): string {
  const buf = randomBytes(8)
  // Two 32-bit unsigned ints — high * 2^32 + low — emitted as base36.
  const hi = (buf[0] << 24 >>> 0) | (buf[1] << 16) | (buf[2] << 8) | buf[3]
  const lo = (buf[4] << 24 >>> 0) | (buf[5] << 16) | (buf[6] << 8) | buf[7]
  // 0xFFFFFFFF * 2^32 fits in a Number (≈ 1.8e19 < Number.MAX_SAFE_INTEGER ≈ 9e15)? No:
  // 2^64 overflows. Concatenate the two halves' base36 strings instead — same
  // entropy (64 bits), still 10+ chars after slicing.
  const s = (hi >>> 0).toString(36).padStart(7, '0') + (lo >>> 0).toString(36).padStart(7, '0')
  return 'fk_' + s.slice(0, 10)
}

export function isFieldKey(s: string | undefined | null): s is string {
  return typeof s === 'string' && /^fk_[0-9a-z]{10}$/.test(s)
}
