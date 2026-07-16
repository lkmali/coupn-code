/**
 * Device identity for this browser.
 *
 * Two signals, deliberately ranked:
 *
 *  1. `machineId` — a UUID minted once and kept in localStorage. Exact and
 *     collision-free, but dies when the user clears site data.
 *  2. `fingerprint` — a hash of stable-ish browser traits. Survives a data
 *     clear, but is NOT unique: two identical devices can hash the same. It is
 *     only ever a fallback, and the server re-links the fresh machineId on a
 *     fingerprint hit so later loads take the exact path again.
 *
 * We key on the machine rather than the IP because IPs move (mobile data, wifi
 * hand-off, CGNAT) and would re-prompt a returning user constantly.
 */

const MACHINE_ID_KEY = 'coupon.machineId'

function safeLocalStorage(): Storage | null {
  try {
    const probe = '__probe__'
    window.localStorage.setItem(probe, probe)
    window.localStorage.removeItem(probe)
    return window.localStorage
  } catch {
    // Safari private mode and hardened privacy settings throw on access.
    return null
  }
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // crypto.randomUUID needs a secure context; fall back for plain-http dev hosts.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const rand = (Math.random() * 16) | 0
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8
    return value.toString(16)
  })
}

/**
 * The stable id for this browser. Minted on first call and reused thereafter.
 * Returns '' during SSR, where there is no storage to read.
 */
export function getMachineId(): string {
  if (typeof window === 'undefined') return ''

  const store = safeLocalStorage()
  if (!store) return uuid() // no persistence available — popup will show each visit

  const existing = store.getItem(MACHINE_ID_KEY)
  if (existing) return existing

  const minted = uuid()
  store.setItem(MACHINE_ID_KEY, minted)
  return minted
}

/**
 * Canvas rendering differs subtly by GPU/driver/font stack, which is the single
 * highest-entropy trait available without a library. Wrapped because some
 * privacy modes poison or block it.
 */
function canvasTrait(): string {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return 'no-canvas'
    ctx.textBaseline = 'top'
    ctx.font = "14px 'Arial'"
    ctx.fillStyle = '#f60'
    ctx.fillRect(125, 1, 62, 20)
    ctx.fillStyle = '#069'
    ctx.fillText('coupon-fp', 2, 15)
    return canvas.toDataURL()
  } catch {
    return 'canvas-blocked'
  }
}

/** FNV-1a — small, dependency-free, good enough to condense traits into a key. */
function hash(input: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  // Widen to 16 hex chars by hashing again in reverse with swapped seeds, so the
  // value is roomy enough to not collide purely on hash width.
  let h2 = 0x01000193
  for (let i = input.length - 1; i >= 0; i--) {
    h2 ^= input.charCodeAt(i)
    h2 = Math.imul(h2, 0x811c9dc5)
  }
  const a = (h >>> 0).toString(16).padStart(8, '0')
  const b = (h2 >>> 0).toString(16).padStart(8, '0')
  return `${a}${b}`
}

/**
 * A hash of this browser's traits. Same device -> same value across a data
 * clear. Different devices of the same model can collide — treat as a hint.
 * Returns '' during SSR.
 */
export function getFingerprint(): string {
  if (typeof window === 'undefined') return ''

  const nav = window.navigator
  const traits = [
    nav.userAgent,
    nav.language,
    (nav.languages || []).join(','),
    String(nav.hardwareConcurrency ?? ''),
    String((nav as Navigator & { deviceMemory?: number }).deviceMemory ?? ''),
    String(nav.maxTouchPoints ?? ''),
    `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
    String(new Date().getTimezoneOffset()),
    Intl.DateTimeFormat().resolvedOptions().timeZone ?? '',
    canvasTrait(),
  ].join('|')

  return hash(traits)
}

export interface DeviceIdentity {
  machineId: string
  fingerprint: string
}

export function getDeviceIdentity(): DeviceIdentity {
  return { machineId: getMachineId(), fingerprint: getFingerprint() }
}
