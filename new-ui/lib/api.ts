import { getDeviceIdentity } from './machineId'
import type { UserDetailsFormData } from './validations'

/**
 * Same-origin by default: the Express server serves this static export, so
 * "/api/*" lands on it directly. Point NEXT_PUBLIC_API_URL elsewhere when
 * running `next dev` against a separately-hosted API.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

export interface SavedUser {
  userId: string
  userName: string
  mobileNumber: string
  upiId: string
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = await response.json()
    if (Array.isArray(body?.errors) && body.errors.length) {
      return body.errors.map((e: { error: string }) => e.error).join(', ')
    }
    return body?.message ?? 'Something went wrong. Please try again.'
  } catch {
    return 'Something went wrong. Please try again.'
  }
}

/**
 * Who is this browser? `null` means unknown — the caller should show the popup.
 */
export async function fetchUserForDevice(): Promise<SavedUser | null> {
  const { machineId, fingerprint } = getDeviceIdentity()
  const query = new URLSearchParams({ machineId })
  if (fingerprint) query.set('fingerprint', fingerprint)

  const response = await fetch(`${API_BASE}/api/user?${query.toString()}`)
  if (!response.ok) throw new Error(await parseError(response))

  const body = await response.json()
  return body.user ?? null
}

export async function saveUserDetails(data: UserDetailsFormData): Promise<SavedUser> {
  const { machineId, fingerprint } = getDeviceIdentity()

  const response = await fetch(`${API_BASE}/api/user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, machineId, ...(fingerprint ? { fingerprint } : {}) }),
  })
  if (!response.ok) throw new Error(await parseError(response))

  const body = await response.json()
  return body.user
}

export async function updateUserDetails(data: UserDetailsFormData): Promise<SavedUser> {
  const { machineId } = getDeviceIdentity()

  const response = await fetch(`${API_BASE}/api/user`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, machineId }),
  })
  if (!response.ok) throw new Error(await parseError(response))

  const body = await response.json()
  return body.user
}
