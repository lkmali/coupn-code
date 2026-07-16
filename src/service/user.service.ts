import { MongoUserRepository } from '../database'
import { IUser } from '../typings'
import { badRequest, isNil, notFoundData } from '../utils'
import { Messages } from '../constants'
import { normalizeMobileNumber } from '../constants/patterns'
import { SaveUserDto, UpdateUserDto } from '../dto'
import { LoggerProvider } from '../provider/logger.provider'

const loggerProvider = LoggerProvider.Instance

/** What the browser is allowed to see — device keys stay server-side. */
export interface PublicUser {
  userId: string
  userName: string
  mobileNumber: string
  upiId: string
}

function toPublicUser(user: IUser): PublicUser {
  return {
    userId: String(user._id),
    userName: user.userName,
    mobileNumber: user.mobileNumber,
    upiId: user.upiId,
  }
}

export class UserService {
  private static instance: UserService
  private readonly userRepository: MongoUserRepository

  constructor() {
    this.userRepository = new MongoUserRepository()
  }

  /**
   * Resolve the person behind this browser.
   *
   * machineId (a localStorage UUID) is the primary key and is exact. The
   * fingerprint is only consulted when the UUID misses — i.e. the user cleared
   * site data or is in a fresh browser profile. On a fingerprint hit we adopt
   * the new machineId onto the record so subsequent loads take the exact path
   * and never re-consult the fuzzy signal.
   */
  async findByDevice(machineId?: string, fingerprint?: string): Promise<PublicUser | null> {
    try {
      if (isNil(machineId) && isNil(fingerprint)) {
        throw badRequest(Messages.VALIDATION.MACHINE_ID_REQUIRED)
      }

      if (machineId) {
        const byMachineId = await this.userRepository.getUserInformation({ machineIds: machineId })
        if (!isNil(byMachineId)) return toPublicUser(byMachineId!)
      }

      if (!fingerprint) return null

      const byFingerprint = await this.userRepository.getUserInformation({ fingerprints: fingerprint })
      if (isNil(byFingerprint)) return null

      if (machineId) {
        const relinked = await this.userRepository.updateUserInformation(
          { _id: byFingerprint!._id },
          { $addToSet: { machineIds: machineId } },
        )
        return toPublicUser(relinked ?? byFingerprint!)
      }

      return toPublicUser(byFingerprint!)
    } catch (error: any) {
      loggerProvider.logger.error('findByDevice_Error', {
        error: error.message,
        stack: error.stack,
        machineId,
      })
      throw error
    }
  }

  /**
   * Save what the popup collected.
   *
   * Keyed on mobileNumber, not machineId: someone who clears storage and fills
   * the popup in again must land back on their existing record with the new
   * device appended, rather than forking a second account.
   */
  async saveUser(request: SaveUserDto): Promise<{ message: string; user: PublicUser }> {
    try {
      const mobileNumber = normalizeMobileNumber(request.mobileNumber)
      const deviceKeys = {
        $addToSet: {
          machineIds: request.machineId,
          ...(request.fingerprint ? { fingerprints: request.fingerprint } : {}),
        },
      }

      const existing = await this.userRepository.getUserInformation({ mobileNumber })

      if (!isNil(existing)) {
        const updated = await this.userRepository.updateUserInformation(
          { _id: existing!._id },
          {
            $set: { userName: request.userName, upiId: request.upiId },
            ...deviceKeys,
          },
        )
        return { message: Messages.SUCCESS.USER_CREATED, user: toPublicUser(updated ?? existing!) }
      }

      const created = await this.userRepository.saveUser({
        userName: request.userName,
        mobileNumber,
        upiId: request.upiId,
        machineIds: [request.machineId],
        fingerprints: request.fingerprint ? [request.fingerprint] : [],
        isDelete: false,
      })

      return { message: Messages.SUCCESS.USER_CREATED, user: toPublicUser(created) }
    } catch (error: any) {
      loggerProvider.logger.error('saveUser_Error', {
        error: error.message,
        stack: error.stack,
        machineId: request.machineId,
      })
      throw error
    }
  }

  /**
   * Settings-page edit. The record is located by machineId, so a device can
   * only rewrite an account it is already linked to.
   */
  async updateUser(request: UpdateUserDto): Promise<{ message: string; user: PublicUser }> {
    try {
      const user = await this.userRepository.getUserInformation({ machineIds: request.machineId })
      if (isNil(user)) throw notFoundData(Messages.ERROR.USER_NOT_FOUND)

      const mobileNumber = normalizeMobileNumber(request.mobileNumber)

      if (mobileNumber !== user!.mobileNumber) {
        const clash = await this.userRepository.getUserInformation({ mobileNumber })
        if (!isNil(clash) && String(clash!._id) !== String(user!._id)) {
          throw badRequest(Messages.ERROR.MOBILE_ALREADY_IN_USE)
        }
      }

      const updated = await this.userRepository.updateUserInformation(
        { _id: user!._id },
        { $set: { userName: request.userName, mobileNumber, upiId: request.upiId } },
      )

      return { message: Messages.SUCCESS.USER_PROFILE_UPDATED, user: toPublicUser(updated ?? user!) }
    } catch (error: any) {
      loggerProvider.logger.error('updateUser_Error', {
        error: error.message,
        stack: error.stack,
        machineId: request.machineId,
      })
      throw error
    }
  }

  public static get Instance() {
    if (isNil(this.instance)) this.instance = new this()

    return this.instance
  }
}
