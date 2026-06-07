import { cloneDeep, get, set } from 'lodash'
import { EncryptionService } from '../service/encryption.service'

/**
 * Centralised handling of secret fields inside the organization configuration.
 *
 * Three concerns, three field sets:
 *  - ENCRYPT_PATHS  → encrypted at rest (decrypted only for internal use).
 *  - MASK_PATHS     → never returned raw to the client; replaced by a masked
 *                     hint in API responses. (Superset of ENCRYPT_PATHS.)
 *  - PRESERVE_PATHS → on save, an absent / blank / still-masked incoming value
 *                     keeps the previously stored value instead of wiping it.
 *
 * NOTE: `exotelConfiguration.webhookToken` is intentionally excluded — it is a
 * plaintext routing key for inbound Exotel webhooks and the admin must be able
 * to read it, so it is neither encrypted nor masked.
 */

/** Secrets encrypted at rest. Consumers must read them through the decrypting getters. */
export const ENCRYPT_PATHS = ['openaiApiKey', 'geminiAIConfiguration.apiKey'] as const

/** Secrets masked in client responses (and preserved-on-unchanged when saving). */
export const MASK_PATHS = [
  'openaiApiKey',
  'geminiAIConfiguration.apiKey',
  'metaAttributes.appSecret',
  'metaAttributes.userAccessToken',
  'metaAttributes.whatsapp.token',
  'exotelConfiguration.customerSecret',
  'exotelConfiguration.appSecret',
  'exotelConfiguration.apiKey',
  'exotelConfiguration.apiToken',
] as const

const encryption = EncryptionService.Instance

/** A value the client could not have meaningfully edited (blank or a masked hint). */
function isUnchangedSecret(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true
  if (typeof value !== 'string') return false
  // Masked hints contain the ellipsis or bullet glyphs we render; encrypted
  // envelopes carry the enc prefix. Real API keys contain none of these.
  return value.includes('…') || value.includes('•') || encryption.isEncryptedSecret(value)
}

/** Encrypt the at-rest secret fields of a config before persisting. Returns a clone. */
export function encryptConfigSecrets<T extends object>(config: T): T {
  const out = cloneDeep(config)
  for (const path of ENCRYPT_PATHS) {
    const value = get(out, path)
    if (typeof value === 'string' && value !== '') {
      set(out as object, path, encryption.encryptSecret(value))
    }
  }
  return out
}

/** Decrypt the at-rest secret fields so internal callers see real values. Returns a clone. */
export function decryptConfigSecrets<T extends object>(config: T | null): T | null {
  if (!config) return config
  const out = cloneDeep(config)
  for (const path of ENCRYPT_PATHS) {
    const value = get(out, path)
    if (typeof value === 'string' && value !== '') {
      set(out as object, path, encryption.decryptSecret(value))
    }
  }
  return out
}

/**
 * Build a client-safe view: every masked field is replaced by a short masked
 * hint (e.g. `sk_test_…uUmI`) so the raw secret never leaves the server.
 * Operates on a (decrypted) config and returns a clone.
 */
export function maskConfigSecrets<T extends object>(config: T | null): T | null {
  if (!config) return config
  const out = cloneDeep(config)
  for (const path of MASK_PATHS) {
    const value = get(out, path)
    if (typeof value === 'string' && value !== '') {
      set(out as object, path, encryption.maskSecret(value))
    }
  }
  return out
}

/**
 * Merge incoming secrets with the previously stored ones: when the client sends
 * a blank / still-masked value (i.e. did not re-enter the secret), keep what was
 * already stored so masked round-trips never overwrite a real secret. Mutates
 * and returns `incoming`. `existing` is the raw (encrypted-at-rest) stored doc.
 */
export function preserveUnchangedSecrets<T extends object>(incoming: T, existing: object | null): T {
  if (!existing) return incoming
  for (const path of MASK_PATHS) {
    if (isUnchangedSecret(get(incoming, path))) {
      const prior = get(existing, path)
      if (prior !== undefined) set(incoming as object, path, prior)
    }
  }
  return incoming
}
