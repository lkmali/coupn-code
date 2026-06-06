import { compare, genSalt, hash } from 'bcryptjs'
import { envConfig } from '../config'
import { isEmpty, isNil } from '../utils'
import { LoggerProvider } from '../provider'

const loggerProvider = LoggerProvider.Instance

export class PasswordService {
  async hashPassword(password: string, fixedSalt?: string): Promise<string> {
    try {
      const randomSalt = isNil(fixedSalt) || isEmpty(fixedSalt)
      if (!randomSalt && String(fixedSalt).length < 6) throw new Error('Illegal salt length: 6 != 16')
      const salt = randomSalt
        ? await genSalt(envConfig.PASSWORD_ROUNDS)
        : this.genSaltFixed(String(fixedSalt), envConfig.PASSWORD_ROUNDS)
      return hash(password, salt)
    } catch (error: any) {
      loggerProvider.logger.error('hashPassword_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }

  async comparePassword(providedPass: string, storedPass: string): Promise<boolean> {
    try {
      if (isNil(providedPass) || isNil(storedPass)) return Promise.resolve(false)
      const passwordIsMatched = await compare(providedPass, storedPass)
      return passwordIsMatched
    } catch (error: any) {
      loggerProvider.logger.error('comparePassword_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }

  genSaltFixed(value: string, rounds = 10): string {
    try {
      if (rounds < 4) rounds = 4
      else if (rounds > 31) rounds = 31
      const salt = []
      salt.push('$2a$')
      if (rounds < 10) salt.push('0')
      salt.push(rounds.toString())
      salt.push('$')
      salt.push(Buffer.from(value).toString('base64'))
      return salt.join('')
    } catch (error: any) {
      loggerProvider.logger.error('genSaltFixed_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }
}
