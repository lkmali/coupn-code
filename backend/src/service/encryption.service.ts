import { createCipheriv, createDecipheriv } from 'crypto'
import { isNil } from 'lodash'
import { encryptionConfig } from '../config'
import { internalError } from '../utils'
import { LoggerProvider } from '../provider'
import { Messages } from '../constants'

const loggerProvider = LoggerProvider.Instance

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
