import { isNil } from 'lodash'
import { UserService } from './user.service'
import { defaultOrganizationInformation } from '../config'
import { LoggerProvider } from '../provider'
import { PermissionService } from './permission.service'

const loggerProvider = LoggerProvider.Instance

export class SeederService {
  private static instance: SeederService
  private readonly userService: UserService
  constructor() {
    this.userService = new UserService()
  }

  public async saveSeedData() {
    try {
      await this.insertClient()
      await this.insertAllPermissions()
    } catch (error: any) {
      loggerProvider.logger.error('saveSeedData_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }

  private async insertAllPermissions() {
    await PermissionService.Instance.seedDefaultsForOrg()
    await PermissionService.Instance.updatePermissionForOldUser()
  }

  private async insertClient(): Promise<void> {
    try {
      await this.userService.addOrigination({
        organizationName: defaultOrganizationInformation.adminName,
        adminEmail: defaultOrganizationInformation.adminEmail,
        adminMobileNumber: defaultOrganizationInformation.adminPhone,
        adminName: defaultOrganizationInformation.adminName,
      })
    } catch (error: any) {
      loggerProvider.logger.error('insertClient_Error', { error: error.message, stack: error.stack })
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
