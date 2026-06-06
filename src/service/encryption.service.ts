import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
import { isNil } from 'lodash'
import { encryptionConfig, secretCryptoConfig } from '../config'
import { internalError } from '../utils'
import { LoggerProvider } from '../provider'
import { Messages } from '../constants'

const loggerProvider = LoggerProvider.Instance

// --- Secret-at-rest encryption (AES-256-GCM) -------------------------------
// Used for third-party secrets stored in the configuration DB (e.g. per-org
// Stripe API keys). Kept separate from the legacy CBC encrypt/decrypt above so
// turning secret encryption on never alters OTP cipher behaviour.
const SECRET_ENC_PREFIX = 'enc:v1:'
const SECRET_ALGORITHM = 'aes-256-gcm'
let warnedMissingSecretKey = false

export class EncryptionService {
  private static instance: EncryptionService
  encrypt(plainText: string) {
    try {
      if (encryptionConfig.isEnable) {
        const cipher = createCipheriv(
          encryptionConfig.algorithm,
          encryptionConfig.key,
          this.toString(encryptionConfig.iv).slice(0, 16),
        )
        let encrypted = cipher.update(plainText)
        encrypted = Buffer.concat([encrypted, cipher.final()])
        return encrypted.toString('hex')
      }
      return plainText
    } catch (error: any) {
      loggerProvider.logger.error('encrypt_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }

  decrypt(cipherText: string, error?: any) {
    try {
      if (encryptionConfig.isEnable) {
        const encryptedText = Buffer.from(cipherText, 'hex')
        const decipher = createDecipheriv(
          encryptionConfig.algorithm,
          encryptionConfig.key,
          this.toString(encryptionConfig.iv).slice(0, 16),
        )
        let decrypted = decipher.update(encryptedText)
        decrypted = Buffer.concat([decrypted, decipher.final()])
        return decrypted.toString()
      }
      return cipherText
    } catch (_error: any) {
      loggerProvider.logger.error('decrypt_Error', { error: _error.message, stack: _error.stack })
      throw !isNil(error) ? error : internalError(Messages.ENCRYPTION.DECRYPTION_ERROR)
    }
  }

  toString(data: any) {
    try {
      return data.toString('hex')
    } catch (error: any) {
      loggerProvider.logger.error('toString_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }

  // ===================== Secret-at-rest (AES-256-GCM) =====================
  // Envelope format:  `enc:v1:<ivHex>:<authTagHex>:<cipherHex>`
  // - Independent of the legacy CBC encrypt/decrypt and of `encryptionConfig`.
  // - The 32-byte AES key is derived from STRIPE_SECRETS_KEY via SHA-256, so any
  //   sufficiently random env value (base64, hex, passphrase) works.
  // - Backward compatible: a value without the `enc:v1:` prefix is treated as
  //   plaintext, so encryption can be enabled later without a migration.

  private deriveSecretKey(): Buffer | null {
    if (!secretCryptoConfig.isEnable || !secretCryptoConfig.key) {
      if (!warnedMissingSecretKey) {
        warnedMissingSecretKey = true
        loggerProvider.logger.warn(
          'EncryptionService: STRIPE_SECRETS_KEY is not set — third-party secrets will be stored UNENCRYPTED. ' +
            'Set STRIPE_SECRETS_KEY to encrypt secrets at rest.',
        )
      }
      return null
    }
    return createHash('sha256').update(secretCryptoConfig.key).digest()
  }

  isEncryptedSecret(value: string | undefined | null): boolean {
    return typeof value === 'string' && value.startsWith(SECRET_ENC_PREFIX)
  }

  /** Encrypt a plaintext secret. Empty/nil input and already-encrypted input are returned unchanged. */
  encryptSecret(plainText: string | undefined | null): string {
    try {
      if (plainText === undefined || plainText === null || plainText === '') return ''
      if (this.isEncryptedSecret(plainText)) return plainText
      const key = this.deriveSecretKey()
      if (!key) return plainText

      const iv = randomBytes(12) // 96-bit nonce recommended for GCM
      const cipher = createCipheriv(SECRET_ALGORITHM, key, iv)
      const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
      const authTag = cipher.getAuthTag()
      return `${SECRET_ENC_PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
    } catch (error: any) {
      loggerProvider.logger.error('encryptSecret_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }

  /** Decrypt a value produced by {@link encryptSecret}. Plaintext (no prefix) is returned unchanged. */
  decryptSecret(cipherText: string | undefined | null): string {
    try {
      if (cipherText === undefined || cipherText === null || cipherText === '') return ''
      if (!this.isEncryptedSecret(cipherText)) return cipherText

      const key = this.deriveSecretKey()
      if (!key) {
        throw new Error('Encrypted secret present but STRIPE_SECRETS_KEY is not configured')
      }

      const [, , ivHex, tagHex, dataHex] = cipherText.split(':')
      if (!ivHex || !tagHex || !dataHex) throw new Error('Malformed encrypted secret')

      const decipher = createDecipheriv(SECRET_ALGORITHM, key, Buffer.from(ivHex, 'hex'))
      decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
      const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()])
      return decrypted.toString('utf8')
    } catch (error: any) {
      loggerProvider.logger.error('decryptSecret_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }

  /** Mask a (plaintext) secret for safe display, e.g. `sk_live_…9aZq`. Never returns the full key. */
  maskSecret(value: string | undefined | null): string {
    if (!value) return ''
    const plain = this.isEncryptedSecret(value) ? '••••' : value
    if (plain.length <= 8) return '••••'
    const secondUnderscore = plain.indexOf('_') > 0 ? plain.indexOf('_', plain.indexOf('_') + 1) + 1 : 4
    return `${plain.slice(0, secondUnderscore)}…${plain.slice(-4)}`
  }

  public static get Instance() {
    try {
      if (isNil(this.instance)) this.instance = new this()

      return this.instance
    } catch (error: any) {
      loggerProvider.logger.error('Instance_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }
}
