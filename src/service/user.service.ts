import {
  IOrganizations,
  IUsers,
  PaginateDataType,
  Role,
  TemplateName,
  UserCredentials,
  UserProfile,
  UserStatus,
} from '../typings'
import {
  generateOrgShortName,
  getPaginateData,
  getMongoSearchQuery,
  hasSome,
  isNil,
  paginate,
  unauthorized,
  badRequest,
  sanitizeUserName,
} from '../utils'
import { Messages } from '../constants'
import { TimezoneUtil } from '../utils/timezone.util'
import {
  MongoUserRepository,
  MongoPasswordRepository,
  MongoOrganizationRepository,
  MongoRoleRepository,
  toObjectId,
  Transactional,
} from '../database'
import {
  RegisterUserDto,
  RegisterOrganizationDto,
  UserListQuery,
  UpdateUserProfileDto,
} from '../dto'
import { NotificationService } from './notification.service'
import { LoggerProvider } from '../provider/logger.provider'
import { PasswordService } from './password.service'
import { v4 as uuidv4 } from 'uuid'
import { pick } from 'lodash'
import { UUIDTypes } from 'uuid'
import { PermissionService } from './permission.service'

const loggerProvider = LoggerProvider.Instance
export class UserService {
  private static instance: UserService
  private readonly userRepository: MongoUserRepository
  private readonly organizationRepository: MongoOrganizationRepository
  private readonly passwordService: PasswordService
  private readonly notificationService: NotificationService
  private readonly permissionService: PermissionService
  private readonly passwordRepository: MongoPasswordRepository
  private readonly roleRepository: MongoRoleRepository
  constructor() {
    this.userRepository = new MongoUserRepository()
    this.organizationRepository = new MongoOrganizationRepository()
    this.passwordRepository = new MongoPasswordRepository()
    this.roleRepository = new MongoRoleRepository()
    this.passwordService = new PasswordService()
    this.notificationService = new NotificationService()
    this.permissionService = new PermissionService()
  }

  async verifyCredentials(credentials: UserCredentials): Promise<UserProfile> {
    try {
      let passwordMatched = false
      const email = credentials.email.toLowerCase()
      const user = await this.userRepository.getUserPassword({ email, isDelete: false })
      if (isNil(user)) throw unauthorized(Messages.ERROR.AUTH_UNSUCCESSFUL)
      if (user === null) throw unauthorized(Messages.ERROR.AUTH_UNSUCCESSFUL)

      // Check if user account is blocked
      if (user.isBlocked) {
        throw unauthorized(Messages.ERROR.ACCOUNT_BLOCKED)
      }

      // Check if user account is inactive
      if (!user.isActive) {
        throw unauthorized(Messages.ERROR.ACCOUNT_INACTIVE)
      }

      passwordMatched = await this.passwordService.comparePassword(credentials.password, user.Password?.password)
      if (!passwordMatched) throw unauthorized(Messages.ERROR.AUTH_UNSUCCESSFUL)
      const userProfile: UserProfile = {
        userId: user._id,
        roles: user.roles,
        email: user.email,
        sessionId: uuidv4(),
        isActive: user.isActive,
        orgId: user.orgId,
      }

      await this.userRepository.updateUserInformation(
        { _id: user._id },
        {
          lastLoginAt: TimezoneUtil.nowUTC(),
        },
      )

      return userProfile
    } catch (error: any) {
      loggerProvider.logger.error('verifyCredentials_Error', {
        error: error.message,
        stack: error.stack,
        email: credentials.email,
      })
      throw error
    }
  }

  
  async validateUserByPhoneNumber(mobileNumber: string): Promise<UserProfile> {
    try {
      const existingUser = await this.userRepository.getUserInformation({
        mobileNumber: mobileNumber,
      })
      if (isNil(existingUser)) throw unauthorized(Messages.ERROR.AUTH_UNSUCCESSFUL)

      // Check if user account is blocked
      if (existingUser!.isBlocked) {
        throw unauthorized(Messages.ERROR.ACCOUNT_BLOCKED)
      }

      // Check if user account is inactive
      if (!existingUser!.isActive) {
        throw unauthorized(Messages.ERROR.ACCOUNT_INACTIVE)
      }

      const userProfile: UserProfile = {
        userId: existingUser!._id,
        roles: existingUser!.roles as Role[],
        email: existingUser!.email ?? '',
        sessionId: uuidv4(),
        isActive: existingUser!.isActive ?? true,
        orgId: existingUser!.orgId,
      }


      return userProfile
    } catch (error: any) {
      loggerProvider.logger.error('validateUserByPhoneNumber_Error', {
        error: error.message,
        stack: error.stack,
        mobileNumber,
      })
      throw error
    }
  }

  async getUser(query: any): Promise<IUsers[]> {
    try {
      const users = await this.userRepository.getUserList(query)

      return users as any
    } catch (error: any) {
      loggerProvider.logger.error('getUser_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }


  async getAllUserList(query: UserListQuery, userProfile: UserProfile): Promise<PaginateDataType<IUsers>> {
    try {
      const filter = {
        ...paginate({
          orderBy: query.orderBy ?? 'DESC',
          sortBy: query.sortBy ?? 'createdAt',
          ...query,
        }),
      }
      let queryFilter: any = {
        orgId: toObjectId(userProfile.orgId),
        ...pick(query, ['isActive'])
      }

      if (query.role) {
        queryFilter = {
          ...queryFilter,
          ...hasSome('roles', [query.role]),
        }
      }

      if (query.search) {
        queryFilter = {
          ...queryFilter,
          ...getMongoSearchQuery(query.search, ['userName', 'mobileNumber', 'email']),
        }
      }
      const count = await this.userRepository.countDocument({ ...queryFilter, isDelete: false })
      const result = await this.userRepository.getUserListWithOthersInfo({ ...queryFilter, isDelete: false }, filter)
      return getPaginateData<IUsers>(count,query.pageNumber, result)
    } catch (error: any) {
      loggerProvider.logger.error('getAllUserList_Error', {
        error: error.message,
        stack: error.stack,
        orgId: userProfile?.orgId,
      })
      throw error
    }
  }

  async registerNewUser(request: RegisterUserDto, userProfile: UserProfile) {
    try {
      await this.validateRolesForUser(request.roles)

      const userWithEmail = await this.userRepository.getUserInformation({
        email: request.email,
        isDelete: false,
      })
      if (!isNil(userWithEmail)) throw unauthorized(Messages.ERROR.EMAIL_ALREADY_EXISTS)
      // Only check for duplicate mobile number within the same org (not email)
      // Email can be duplicated - allows re-adding users with same email after soft delete
      const userWithMobile = await this.userRepository.getUserInformation({
        orgId: toObjectId(userProfile.orgId),
        mobileNumber: request.mobileNumber,
        isDelete: false,
      })
      if (!isNil(userWithMobile)) throw unauthorized(Messages.ERROR.MOBILE_ALREADY_EXISTS)

      await this.saveValidData(request, userProfile)

      return { message: Messages.SUCCESS.USER_CREATED }
    } catch (error: any) {
      loggerProvider.logger.error('registerNewUser_Error', {
        error: error.message,
        stack: error.stack,
        orgId: userProfile.orgId,
        email: request.email,
        mobileNumber: request.mobileNumber,
      })
      throw error
    }
  }

  private async validateRolesForUser(roles: Role[]) {
    const disallowedRoles = [Role.ADMIN]
    for (const role of roles) {
      if (disallowedRoles.includes(role)) {
        throw badRequest(Messages.VALIDATION.ROLE_NOT_ALLOWED)
      }
      const roleRecord = await this.roleRepository.getRole({
        roleKey: role,
        isActive: true,
        isDelete: false,
      })
      if (!roleRecord) throw badRequest(Messages.VALIDATION.ROLE_NOT_FOUND)
    }
  }

  async addOrigination(request: RegisterOrganizationDto, userProfile?: UserProfile) {
    try {
      // Check if email already exists globally (across all organizations)
      const existingUserWithEmail = await this.userRepository.getUserInformation({
        email: request.adminEmail,
        isDelete: false,
      })
      if (!isNil(existingUserWithEmail)) {
        throw badRequest(Messages.ERROR.EMAIL_ALREADY_EXISTS)
      }

      // Check if organization short name already exists
      const orgShortName = generateOrgShortName(request.organizationName)
      const existingOrgWithShortName = await this.organizationRepository.getOrganizationInformation({
        orgShortName,
      })
      if (existingOrgWithShortName) {
        throw unauthorized(Messages.ERROR.ORG_NAME_EXISTS)
      }

      // Mobile number can be same across different organizations, so no mobile check needed
      await this.saveValidOrigination(
        {
          adminMobile: request.adminMobileNumber,
          isDelete: false,
          countryCode: '+91',
          isActive: true,
          orgShortName: generateOrgShortName(request.organizationName),
          createdAt: TimezoneUtil.nowUTC(),
          updatedAt: TimezoneUtil.nowUTC(),
          adminEmail: request.adminEmail,
          orgName: request.organizationName,
          description: request.organizationName,
          createdBy: userProfile?.userId,
          updatedBy: userProfile?.userId,
        } as any,
        {
          mobileNumber: request.adminMobileNumber,
          isDelete: false,
          roles: [Role.ADMIN],
          countryCode: '+91',
          isVerified: true,
          userName: sanitizeUserName(request.adminName),
          isActive: true,
          isBlocked: false,
          isMainAdmin: true,
          createdAt: TimezoneUtil.nowUTC(),
          updatedAt: TimezoneUtil.nowUTC(),
          email: request.adminEmail,
          createdBy: userProfile?.userId,
          updatedBy: userProfile?.userId,
        } as any,
        null,
        userProfile?.email ?? null,
      )

      return { message: Messages.SUCCESS.USER_CREATED }
    } catch (error: any) {
      loggerProvider.logger.error('addOrigination_Error', {
        error: error.message,
        stack: error.stack,
        organizationName: request.organizationName,
        adminEmail: request.adminEmail,
        adminMobileNumber: request.adminMobileNumber,
      })
      throw error
    }
  }

  async addSuperAdmin(request: RegisterOrganizationDto, createdByProfile?: UserProfile) {
    try {
      await this.saveValidOrigination(
        {
          adminMobile: request.adminMobileNumber,
          isDelete: false,
          countryCode: '+91',
          isActive: true,
          createdAt: TimezoneUtil.nowUTC(),
          updatedAt: TimezoneUtil.nowUTC(),
          orgShortName: generateOrgShortName(request.organizationName),
          adminEmail: request.adminEmail,
          orgName: request.organizationName,
          description: request.organizationName,
          createdBy: createdByProfile?.userId,
          updatedBy: createdByProfile?.userId,
        } as any,
        {
          mobileNumber: request.adminMobileNumber,
          isDelete: false,
          roles: [Role.ADMIN],
          countryCode: '+91',
          isVerified: true,
          userName: sanitizeUserName(request.adminName),
          isActive: true,
          isBlocked: false,
          createdAt: TimezoneUtil.nowUTC(),
          updatedAt: TimezoneUtil.nowUTC(),
          email: request.adminEmail,
          createdBy: createdByProfile?.userId,
          updatedBy: createdByProfile?.userId,
        } as any,
        '123456',
        createdByProfile?.email ?? '',
      )

      return { message: Messages.SUCCESS.SUPER_ADMIN_CREATED }
    } catch (error: any) {
      loggerProvider.logger.error('addSuperAdmin_Error', {
        error: error.message,
        stack: error.stack,
        organizationName: request.organizationName,
        adminEmail: request.adminEmail,
        adminMobileNumber: request.adminMobileNumber,
      })
      throw error
    }
  }

  async saveNewUser(data: Omit<IUsers, 'userId'>, options: { session?: any } = {}): Promise<IUsers> {
    try {
      let query = {
        orgId: toObjectId(data.orgId),
        mobileNumber: data.mobileNumber,
      } as any
      if (data.email) {
        query = {
          orgId: toObjectId(data.orgId),
          $or: [{ email: data.email }, { mobileNumber: data.mobileNumber }],
        }
      }

      const user = await this.userRepository.getUserInformation(query)
      if (!isNil(user)) {

        await this.userRepository.updateUserInformation(
          { _id: user!._id },
          {
            roles: [...new Set([...user!.roles, ...data.roles])] as any,
            userName: sanitizeUserName(data.userName),
            updatedAt: TimezoneUtil.nowUTC(),
            updatedBy: data.updatedBy as any,
          },
          options,
        )
        return user as any
      }

      const result = await this.userRepository.saveUser(
        {
          mobileNumber: data.mobileNumber,
          isDelete: false,
          roles: data.roles,
          countryCode: '+91',
          isVerified: true,
          orgId: data.orgId as any,
          userName: sanitizeUserName(data.userName),
          isActive: true,
          isBlocked: false,
          createdAt: TimezoneUtil.nowUTC(),
          updatedAt: TimezoneUtil.nowUTC(),
          email: data.email,
          createdBy: data.createdBy as any,
          updatedBy: data.updatedBy as any,
        },
        options,
      )
      await this.permissionService.assignPermissionNewToUser(result._id as any, result.orgId as any, result.roles, [], options)
      return result as any
    } catch (error: any) {
      loggerProvider.logger.error('saveNewUser_Error', {
        error: error.message,
        stack: error.stack,
        orgId: data.orgId,
        email: data.email,
        mobileNumber: data.mobileNumber,
      })
      throw error
    }
  }

  @Transactional
  private async saveValidOrigination(
    orgData: Omit<IOrganizations, 'orgId'>,
    userData: Omit<IUsers, 'userId' | 'orgId'>,
    password: string | null,
    adminEmail: string | null,
    options: { session?: any } = {},
  ) {
    try {
      const result = await this.organizationRepository.saveOrganization(orgData as any, options)
      const saveData = await this.userRepository.saveUser(
        {
          ...userData,
          orgId: result._id,
        } as any,
        options,
      )
      if (password) {
        await this.upsertPassword(saveData._id, password, options)
      }
      await this.permissionService.updateSingleOriginationWithUser(result as any, saveData as any, options)
      await this.notificationService.sendPasswordMail({
        email: orgData.adminEmail,
        username: orgData.adminEmail,
        adminEmail: adminEmail ?? '',
        type: TemplateName.SET_PASSWORD,
      })
      return { message: Messages.SUCCESS.USER_CREATED }
    } catch (error: any) {
      loggerProvider.logger.error('saveValidOrigination_Error', {
        error: error.message,
        stack: error.stack,
        orgName: orgData.orgName,
        adminEmail: orgData.adminEmail,
        adminMobile: orgData.adminMobile,
      })
      throw error
    }
  }

  @Transactional
  private async saveValidData(
    request: RegisterUserDto,
    userProfile: UserProfile,
    options: { session?: any } = {},
  ) {
    try {
      const cleanUserName = sanitizeUserName(request.userName)
      const result = await this.userRepository.saveUser(
        {
          mobileNumber: request.mobileNumber,
          isDelete: false,
          roles: request.roles,
          countryCode: '+91',
          isVerified: true,
          orgId: userProfile.orgId,
          userName: cleanUserName,
          isActive: true,
          isBlocked: false,
          createdAt: TimezoneUtil.nowUTC(),
          updatedAt: TimezoneUtil.nowUTC(),
          createdBy: userProfile.userId,
          updatedBy: userProfile.userId,
          email: request.email,
        },
        options,
      )
      //await this.passwordRepository.saveUserPassword(result._id, '123456', options)

      // Auto-assign default permissions based on role
      await this.permissionService.assignPermissionNewToUser(result._id as any, result.orgId as any, result.roles, [], options)

      await this.upsertPassword(result.userId, request.password ?? '123456', options)

    //   await this.notificationService.sendPasswordMail({
    //     email: request.email,
    //     username: cleanUserName,
    //     type: TemplateName.SET_PASSWORD,
    //   })

      return { message: Messages.SUCCESS.USER_CREATED }
    } catch (error: any) {
      loggerProvider.logger.error('saveValidData_Error', {
        error: error.message,
        stack: error.stack,
        orgId: userProfile.orgId,
        email: request.email,
        mobileNumber: request.mobileNumber,
        roles: request.roles,
      })
      throw error
    }
  }

  async prepareUserProfileData(email: string): Promise<UserProfile> {
    try {
      const data = await this.userRepository.getUserInformation({
        email,
      })
      if (isNil(data)) throw unauthorized(Messages.ERROR.CHECK_ACCOUNT_WITH_ADMIN)
      return {
        userId: data!._id,
        orgId: data!.orgId,
        roles: data!.roles as Role[],
        email: data!.email,
        sessionId: uuidv4(),
        isActive: data!.isActive,
      }
    } catch (error: any) {
      loggerProvider.logger.error('prepareUserProfileData_Error', {
        error: error.message,
        stack: error.stack,
        email,
      })
      throw error
    }
  }

  async setUserPassword(userId: UUIDTypes, password: string): Promise<{ message: string }> {
    try {
      await this.upsertPassword(userId, password)
      await this.userRepository.updateUserInformation(
        { _id: toObjectId(userId) },
        {
          isVerified: true,
        },
      )

      return { message: Messages.SUCCESS.PASSWORD_SET }
    } catch (error: any) {
      loggerProvider.logger.error('setUserPassword_Error', {
        error: error.message,
        stack: error.stack,
        userId,
      })
      throw error
    }
  }

  async removeUser(query: any): Promise<void> {
    try {
      await this.userRepository.removeUser(query)
    } catch (error: any) {
      loggerProvider.logger.error('removeUser_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async sendResetPasswordLink(email: string): Promise<{ message: string }> {
    try {
      const user = await this.userRepository.getUserInformation({ email })
      if (isNil(user)) throw unauthorized(Messages.ERROR.ACCOUNT_NOT_CREATED)

      if (user!.isBlocked || !user!.isActive || user!.isDelete)
        throw unauthorized(Messages.ERROR.ACCOUNT_BLOCKED_CONTACT_ADMIN)
      await this.notificationService.sendPasswordMail({
        email,
        username: user!.userName ?? '',
        type: TemplateName.RESET_PASSWORD,
      })

      return { message: Messages.SUCCESS.RESET_PASSWORD_LINK_SENT }
    } catch (error: any) {
      loggerProvider.logger.error('sendResetPasswordLink_Error', {
        error: error.message,
        stack: error.stack,
        email,
      })
      throw error
    }
  }

  async getUserProfile(userProfile: UserProfile): Promise<IUsers> {
    try {
      const user = await this.userRepository.getUserInformation({
        _id: toObjectId(userProfile.userId),
        orgId: toObjectId(userProfile.orgId),
      })
      if (isNil(user)) throw unauthorized(Messages.ERROR.USER_NOT_FOUND)
      return user as any
    } catch (error: any) {
      loggerProvider.logger.error('getUserProfile_Error', {
        error: error.message,
        stack: error.stack,
        userId: userProfile.userId,
      })
      throw error
    }
  }

  async getUserById(userId: UUIDTypes, orgId: string): Promise<IUsers> {
    try {
      const user = await this.userRepository.getUserInformation({
        _id: toObjectId(userId),
        orgId: toObjectId(orgId),
      })
      if (isNil(user)) throw badRequest(Messages.ERROR.USER_NOT_FOUND)
      return user as any
    } catch (error: any) {
      loggerProvider.logger.error('getUserById_Error', {
        error: error.message,
        stack: error.stack,
        userId,
      })
      throw error
    }
  }

  @Transactional
  async activateInactiveUser(
    userId: UUIDTypes,
    status: UserStatus,
    userProfile: UserProfile,
    options: { session?: any } = {},
  ): Promise<{ message: string }> {
    try {
      const isActivate = status === UserStatus.ACTIVE ? true : false
      const user = await this.userRepository.getUserInformation({
        _id: toObjectId(userId),
        orgId: toObjectId(userProfile.orgId),
      })
      if (isNil(user)) throw badRequest(Messages.ERROR.USER_NOT_FOUND)

      // Prevent deactivating main admin
      if (!isActivate && user!.isMainAdmin) {
        throw badRequest(Messages.ERROR.CANNOT_DELETE_MAIN_ADMIN)
      }

      await this.userRepository.updateUserInformation(
        { _id: toObjectId(userId) },
        {
          isActive: isActivate,
          updatedBy: userProfile.userId,
          updatedAt: TimezoneUtil.nowUTC(),
        },
        options
      )
      return { message: Messages.SUCCESS.USER_STATUS_UPDATED(status) }
    } catch (error: any) {
      loggerProvider.logger.error('activateUser_Error', {
        error: error.message,
        stack: error.stack,
        userId,
      })
      throw error
    }
  }

  @Transactional
  async updateUserProfile(
    updateDto: UpdateUserProfileDto,
    updateUserId: UUIDTypes,
    userProfile: UserProfile,
    options: { session?: any } = {},
  ): Promise<{ message: string }> {
    try {
      const user = await this.userRepository.getUserInformation({
        _id: toObjectId(updateUserId),
        orgId: toObjectId(userProfile.orgId),
      })
      if (isNil(user)) throw badRequest(Messages.ERROR.USER_NOT_FOUND)
      if (updateDto.mobileNumber && updateDto.mobileNumber !== user!.mobileNumber) {
        const existingMobileUser = await this.userRepository.getUserInformation({
          orgId: toObjectId(userProfile.orgId),
          mobileNumber: updateDto.mobileNumber,
        })
        if (existingMobileUser && String(existingMobileUser._id) !== String(userProfile.userId)) {
          throw badRequest(Messages.ERROR.MOBILE_ALREADY_IN_USE)
        }
      }

      // Prevent role change for main admin
      const isRoleChanged =
        updateDto.roles &&
        (updateDto.roles.length !== user!.roles.length || !updateDto.roles.every(role => user!.roles.includes(role)))

      if (isRoleChanged && user!.isMainAdmin) {
        throw badRequest(Messages.ERROR.CANNOT_UPDATE_MAIN_ADMIN_ROLE)
      }

      // Sanitize once so every downstream consumer in this method (pick) sees the same
      // cleaned name. Keeps the user.userName Exotel-safe.
      if (updateDto.userName !== undefined) {
        updateDto.userName = sanitizeUserName(updateDto.userName)
      }

      // Only update allowed fields (userName, mobileNumber, and roles if admin is changing)
      const updateData: Partial<IUsers> = {
        updatedBy: userProfile.userId,
        updatedAt: TimezoneUtil.nowUTC(),
        ...pick(updateDto, ['userName', 'mobileNumber']),
      }

      // If role is being changed, add roles to update data
      if (isRoleChanged && updateDto.roles) {
        updateData.roles = updateDto.roles
      }

      await this.userRepository.updateUserInformation({ _id: toObjectId(updateUserId) }, updateData as any, options)

      // If role changed, update user permissions based on new role
      if (isRoleChanged && updateDto.roles) {
        await this.permissionService.updateUserPermissionsForRoleChange(
          updateUserId,
          userProfile.orgId,
          updateDto.roles,
          userProfile.userId,
          options,
        )
      }

      return { message: Messages.SUCCESS.USER_PROFILE_UPDATED }
    } catch (error: any) {
      loggerProvider.logger.error('updateUserProfile_Error', {
        error: error.message,
        stack: error.stack,
        userId: userProfile.userId,
      })
      throw error
    }
  }

  async getAllOrganizationsWithUsers(): Promise<IOrganizations[]> {
    try {
      const organizations = await this.organizationRepository.getAllOrganizationsWithUsers()
      return organizations
    } catch (error: any) {
      loggerProvider.logger.error('getAllOrganizationsWithUsers_Error', {
        error: error.message,
        stack: error.stack,
      })
      throw error
    }
  }

  async getAllUsersForSuperAdmin(): Promise<IUsers[]> {
    try {
      const users = await this.userRepository.getAllUsersWithOrganization()
      return users
    } catch (error: any) {
      loggerProvider.logger.error('getAllUsersForSuperAdmin_Error', {
        error: error.message,
        stack: error.stack,
      })
      throw error
    }
  }


  async toggleOrganizationStatus(
    orgId: string,
    isActive: boolean,
    userProfile: UserProfile,
  ): Promise<{ message: string }> {
    try {
      const org = await this.organizationRepository.getOrganizationInformation({ _id: toObjectId(orgId) })
      if (isNil(org)) throw badRequest(Messages.ERROR.ORGANIZATION_NOT_FOUND)

      await this.organizationRepository.updateOrganization(
        { _id: toObjectId(orgId) },
        { isActive, updatedBy: userProfile.userId, updatedAt: TimezoneUtil.nowUTC() },
      )

      // Also update all users in this organization to match the org status
      await this.userRepository.updateUserInformation(
        { orgId: toObjectId(orgId) },
        { isActive, updatedBy: userProfile.userId, updatedAt: TimezoneUtil.nowUTC() },
      )

      return { message: isActive ? Messages.SUCCESS.ORGANIZATION_ENABLED : Messages.SUCCESS.ORGANIZATION_DISABLED }
    } catch (error: any) {
      loggerProvider.logger.error('toggleOrganizationStatus_Error', {
        error: error.message,
        stack: error.stack,
        orgId,
      })
      throw error
    }
  }

  async getDashboardStats(userProfile: UserProfile): Promise<{
    totalUsers: number
    activeUsers: number
    inactiveUsers: number
    roleWiseCount: Record<string, number>
  }> {
    try {

      let queryFilter: any = {
        orgId: toObjectId(userProfile.orgId)
      }
      const stats = await this.userRepository.getDashboardStats(queryFilter)
      return stats
    } catch (error: any) {
      loggerProvider.logger.error('getDashboardStats_Error', {
        error: error.message,
        stack: error.stack,
        orgId: userProfile.orgId,
      })
      throw error
    }
  }

  /**
   * Upsert password for a user - finds existing password record and updates it,
   * or creates a new one if none exists. Replaces pSQL PasswordRepository.upsertPassword.
   */
  private async upsertPassword(userId: any, password: string, options: { session?: any } = {}): Promise<any> {
    const hashedPassword = await this.passwordService.hashPassword(password)
    const existing = await this.passwordRepository.getPassword({ userId })
    if (existing) {
      return this.passwordRepository.updatePassword({ userId }, { password: hashedPassword }, options)
    } else {
      return this.passwordRepository.savePassword({ userId, password: hashedPassword }, options)
    }
  }

  public static get Instance() {
    if (isNil(this.instance)) this.instance = new this()

    return this.instance
  }
}
