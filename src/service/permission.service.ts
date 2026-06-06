import { badRequest, isNil } from '../utils'
import {
  MongoRolePermissionRepository,
  MongoPermissionRepository,
  MongoRoleRepository,
  MongoOrganizationRepository,
  MongoUserPermissionRepository,
  MongoUserRepository,
  toObjectId,
  Transactional
} from '../database'
import { LoggerProvider } from '../provider/logger.provider'
import * as roleData from '../data/base.json'
import { IPermission, IRolePermission, IRole, UserProfile, RolePermissionsInterface, Role, IUsers, UserPermissionsInterface, IOrganizations } from '../typings'
import { UUIDTypes } from 'uuid'
import { PermissionDto } from '../dto'
import { RedisService } from './redis.service'
import TimezoneUtil from '../utils/timezone.util'

const loggerProvider = LoggerProvider.Instance

export class PermissionService {
  private readonly redisService: RedisService
  private static instance: PermissionService
  private readonly rolePermissionRepository: MongoRolePermissionRepository
  private readonly permissionRepository: MongoPermissionRepository
  private readonly userRepository: MongoUserRepository
  private readonly roleRepository: MongoRoleRepository
  private readonly organizationRepository: MongoOrganizationRepository
  private readonly userPermissionRepository: MongoUserPermissionRepository
  private readonly CACHE_KEY_PREFIX = 'permissions:'

  constructor() {
    this.redisService = RedisService.Instance
    this.rolePermissionRepository = new MongoRolePermissionRepository()
    this.permissionRepository = new MongoPermissionRepository()
    this.userRepository = new MongoUserRepository()
    this.roleRepository = new MongoRoleRepository()
    this.organizationRepository = new MongoOrganizationRepository()
    this.userPermissionRepository = new MongoUserPermissionRepository()
  }

  public static get Instance() {
    if (isNil(this.instance)) this.instance = new this()
    return this.instance
  }

  /*
   * Seed RBAC for New Organization
   */
  @Transactional
  async seedDefaultsForOrg(options: { session?: any } = {}): Promise<void> {
    try {
      await this.updateOriginationData(options)
    } catch (error: any) {
      loggerProvider.logger.error('seedDefaultsForOrg_Error', {
        error: error.message,
        stack: error.stack,
      })
      throw error
    }
  }



  async updateSingleOriginationWithUser(
    originationData:IOrganizations ,
    user:IUsers,
    options: { session?: any } = {},
  ): Promise<void> {
    try {
       const useRole = user.roles.includes(Role.ADMIN) ? Role.ADMIN : user.roles[0]
      let userRolePermission:any[] = []
      const { roles, permissions, rolePermissions } = roleData
      const roleMapIds = new Map<string, any>()
      const permissionMapIds = new Map<string, any>()
      const dbRoles = await this.roleRepository.getRoles({} as any)
      const existingRoleKeys = new Set(dbRoles.map((r: any) => r.roleKey))
      const newRoles = roles.filter((r: any) => !existingRoleKeys.has(r.roleKey))
      // Insert Organization Specific Roles
      dbRoles.forEach((r: any) => roleMapIds.set(r.roleKey, r.roleId))
      if (newRoles.length > 0) {
        const createdRoles: any[] = []
        for (const r of newRoles) {
          const created = await this.roleRepository.saveRole(
            {
              roleKey: r.roleKey,
              name: r.name,
              description: r.description,
              orgId: originationData.orgId,
              isActive: true,
              isDelete: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any,
            options as any,
          )
          createdRoles.push(created)
        }
        createdRoles.forEach((r: any) => roleMapIds.set(r.roleKey, r.roleId))
      }
      const dbPermission = await this.permissionRepository.getPermissions({} as any)
      const existingPermission = new Set(dbPermission.map((r: any) => r.code))
      const newPermission = permissions.filter((r: any) => !existingPermission.has(r.code))
      // Insert Organization Specific Roles
      dbPermission.forEach((r: any) => permissionMapIds.set(r.code, r._id))
       if (newPermission.length > 0) {
        const createdPermissions: any[] = []
        for (const p of newPermission) {
          const created = await this.permissionRepository.savePermission(
            {
              code: p.code,
              name: p.name,
              category: p.category,
              description: p.name,
              isActive: true,
              isDelete: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any,
            options as any,
          )
          createdPermissions.push(created)
        }
        createdPermissions.forEach((r: any) => permissionMapIds.set(r.code, r._id))
      }

        const newInsertions: Omit<IRolePermission, 'rolePermissionId'>[] = []
        let dbRolePermission = await this.rolePermissionRepository.getRolePermissions({ orgId: toObjectId(originationData.orgId) } as any)
        let existenceRolePermission = new Set(dbRolePermission.map((r: any) => r.roleId.toString()))
        for (const [role, value] of Object.entries(rolePermissions)) {

          const roleId = roleMapIds.get(role)
          if (!roleId) continue
          if (!existenceRolePermission.has(roleId.toString())) {
            const permissionIds = (value as any[]).map((value: any) => permissionMapIds.get(value)) as any[]
            if(role===useRole){
               userRolePermission = permissionIds
            }
            newInsertions.push({
              roleId,
              permissionIds,
              orgId: originationData.orgId,
              ...(user.userId && {
                createdBy: user.userId,
                updatedBy: user.userId,
              }),
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any)
          }
        }
      if (newInsertions.length) {
        for (const insertion of newInsertions) {
          await this.rolePermissionRepository.saveRolePermission(insertion as any, options as any)
        }
      }

      await this.assignPermissionNewToUser(user.userId,user.orgId,user.roles,userRolePermission,options)
      const cacheKey = `${this.CACHE_KEY_PREFIX}`
      await this.redisService.del(cacheKey)
      await this.getPermission()
      loggerProvider.logger.info(`updateOriginationData permissions Done for org`)
    } catch (error: any) {
      loggerProvider.logger.error('seedDefaultsForOrg_Error', {
        error: error.message,
        stack: error.stack,
      })
      throw error
    }
  }



  async updatePermissionForOldUser() {
    const users = await this.userRepository.getUserList({})
    await Promise.all(users.map((value: any) => this.assignPermissionNewToUser(value.userId, value.orgId, value.roles)))
  }

  async assignPermissionNewToUser(userId: UUIDTypes, orgId: string, roles: string[],permissionIds:any[]=[], options = {}) {
    const role = roles.includes(Role.ADMIN) ? Role.ADMIN : roles[0]
    const userPermission = await this.userPermissionRepository.getUserPermissions({
      userId: toObjectId(userId),
      orgId: toObjectId(orgId),
    } as any)
    if(permissionIds.length>0){
      await this.userPermissionRepository.saveUserPermission(
      {
        userId: toObjectId(userId),
        permissionIds,
        orgId: toObjectId(orgId),
        createdAt: TimezoneUtil.nowUTC(),
        updatedAt: TimezoneUtil.nowUTC(),
      } as any,
      options as any,
    )
    return
    }
    if (userPermission && userPermission.length > 0) {
      return
    }
    const roleData = await this.roleRepository.getRole({ roleKey: role } as any)
    if (!roleData) {
      return
    }
    const rolePermissions = await this.rolePermissionRepository.getRolePermission({
      roleId: toObjectId(roleData.roleId),
      orgId: toObjectId(orgId),
    } as any, options as any)
    await this.userPermissionRepository.saveUserPermission(
      {
        userId: toObjectId(userId),
        permissionIds: rolePermissions!.permissionIds,
        orgId: toObjectId(orgId),
        createdAt: TimezoneUtil.nowUTC(),
        updatedAt: TimezoneUtil.nowUTC(),
      } as any,
      options as any,
    )
  }

  /**
   * Update user permissions when role is changed by admin
   * Removes old permissions and assigns new permissions based on new role
   */
  async updateUserPermissionsForRoleChange(
    userId: UUIDTypes,
    orgId: string,
    newRoles: string[],
    updatedBy: UUIDTypes,
    options = {},
  ) {
    try {
      // Determine the primary role for permissions
      const role = newRoles.includes(Role.ADMIN) ? Role.ADMIN : newRoles[0]

      // Get role data for the new role
      const roleData = await this.roleRepository.getRole({ roleKey: role } as any)
      if (!roleData) {
        loggerProvider.logger.warn('updateUserPermissionsForRoleChange: Role not found', { role })
        return
      }

      // Get permissions for the new role
      const rolePermissions = await this.rolePermissionRepository.getRolePermission({
        roleId: toObjectId(roleData.roleId),
        orgId: toObjectId(orgId),
      } as any, options as any)

      if (!rolePermissions) {
        loggerProvider.logger.warn('updateUserPermissionsForRoleChange: Role permissions not found', {
          roleId: roleData.roleId,
          orgId,
        })
        return
      }

      // Update user permissions with new role's permissions (removes old, sets new)
      await this.userPermissionRepository.updateUserPermission(
        { userId: toObjectId(userId), orgId: toObjectId(orgId) } as any,
        {
          permissionIds: rolePermissions.permissionIds,
          updatedAt: TimezoneUtil.nowUTC(),
          updatedBy: toObjectId(updatedBy),
        } as any,
        options as any,
      )

      loggerProvider.logger.info('updateUserPermissionsForRoleChange: Permissions updated successfully', {
        userId,
        orgId,
        newRole: role,
        permissionCount: rolePermissions.permissionIds.length,
      })
    } catch (error: any) {
      loggerProvider.logger.error('updateUserPermissionsForRoleChange_Error', {
        error: error.message,
        stack: error.stack,
        userId,
        orgId,
        newRoles,
      })
      throw error
    }
  }

  /*
   * Get all roles for an organization
   */
  async getAllRoles(): Promise<IRole[]> {
    try {
      const excludedRoles = ['SUPER_ADMIN', 'PATIENT']
      const roles = await this.roleRepository.getRoles({ isActive: true, isDelete: false } as any) as any
      return roles.filter((role: any) => !excludedRoles.includes(role.roleKey ?? role.name))
    } catch (error: any) {
      loggerProvider.logger.error('getAllRoles_Error', {
        error: error.message,
        stack: error.stack,
      })
      throw error
    }
  }

  /*
   * Get all roles with their permissions for an organization
   */
  async getAllRolesWithPermissions(orgId: string): Promise<RolePermissionsInterface[]> {
    try {
      const excludedRoles = ['SUPER_ADMIN', 'PATIENT']
      const [roles, permission] = await Promise.all([
        this.rolePermissionRepository.getRolePermissionsWithDetails({ orgId: toObjectId(orgId) } as any),
        this.getPermission(),
      ])
      return roles
        .filter((value: any) => !excludedRoles.includes(value.role?.roleKey ?? value.roleKey))
        .map((value: any) => {
        // RolePermission.permissionIds stores Permission._id refs (see the $lookup
        // join in getRolePermissionsWithDetails). The Permission.permissionId field is
        // a SQL-compat mirror only set by the pre-save hook, so migrated/insertMany
        // rows leave it undefined. Fall back to _id and string-coerce both sides so
        // the "is this permission selected?" check works regardless of how the row
        // was created. Without this, the FE saw every checkbox off, sent the same
        // back, and the save was rejected as "Invalid permission".
        const assignedIds = new Set<string>(
          ((value.permissionIds as any[]) || []).map((id: any) => String(id)),
        )
        return {
          role: value.role?.roleKey ?? value.roleKey,
          roleId: value.role?.roleId ?? value.roleId,
          name: value.role?.name ?? value.name,
          description: value.role?.description ?? value.description ?? '',
          permissions: permission.map((pdata: any) => {
            const permId = String(pdata.permissionId ?? pdata._id)
            return {
              code: pdata.code,
              name: pdata.name,
              category: pdata.category,
              description: pdata.description ?? '',
              permissionId: permId,
              isActive: assignedIds.has(permId),
            }
          }),
        }
      }) as any
    } catch (error: any) {
      loggerProvider.logger.error('getAllRolesWithPermissions_Error', {
        error: error.message,
        stack: error.stack,
        orgId,
      })
      throw error
    }
  }



    /*
   * Get all roles with their permissions for an organization
   */
  async getUserWithPermissions(query:any): Promise<UserPermissionsInterface> {
    try {
      const [user, permission] = await Promise.all([
        this.userRepository.getUserWithPermissions(query),
        this.getPermission(),
      ])
      // Same normalization as getAllRolesWithPermissions — UserPermission.permissionIds
      // stores _id refs; Permission.permissionId may be undefined on migrated rows.
      const assignedIds = new Set<string>(
        ((user?.permissions?.permissionIds as any[]) || []).map((id: any) => String(id)),
      )
      return  {
        ...user,
        permissions:permission.map((pdata:any) => {
            const permId = String(pdata.permissionId ?? pdata._id)
            return {
              code: pdata.code,
              name: pdata.name,
              category: pdata.category,
              description: pdata.description ?? '',
              permissionId: permId,
              isActive: assignedIds.has(permId),
            }
          }),
        }

    } catch (error: any) {
      loggerProvider.logger.error('getUserWithPermissions_Error', {
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }



   @Transactional
  async updateUserPermissions(
    userId: UUIDTypes,
    permissions: PermissionDto[],
    userProfile: UserProfile,
    options: { session?: any } = {},
  ): Promise<{ message: string; }> {
    try {
      const perm = await this.getValidPermissions(permissions)
      await this.userPermissionRepository.updateUserPermission({
        userId: toObjectId(userId),orgId: toObjectId(userProfile.orgId)
      } as any,{
       permissionIds:perm,
       updatedAt:new Date(),
       updatedBy: toObjectId(userProfile.userId)
      } as any,options as any)
      return { message: 'User permissions updated successfully' }
    } catch (error: any) {
      loggerProvider.logger.error('assignPermissionsToUser_Error', {
        error: error.message,
        stack: error.stack,
        userId,
      })
      throw error
    }
  }


@Transactional
  async updateRoleIdPermissions(
    roleId: string,
   permissions:PermissionDto[],
    userProfile: UserProfile,
    options: { session?: any } = {},
  ): Promise<{ message: string; }> {
    try {
      const perm = await this.getValidPermissions(permissions)
      await this.rolePermissionRepository.updateRolePermission({
        roleId: toObjectId(roleId),orgId: toObjectId(userProfile.orgId)
      } as any,{
       permissionIds:perm,
       updatedAt:new Date(),
       updatedBy: toObjectId(userProfile.userId)
      } as any,options as any)
      return { message: 'Role permissions updated successfully' }
    } catch (error: any) {
      loggerProvider.logger.error('assignPermissionsToUser_Error', {
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }


  async getValidPermissions(permissions: PermissionDto[]){
    if (!Array.isArray(permissions)) {
      throw badRequest('Request body must be an array of { permissionId, isActive }')
    }
    // Build the valid-ID set from both _id and permissionId. RolePermission stores
    // _id refs (canonical) but the legacy code path checked against permissionId,
    // which is undefined on migrated rows where the pre-save hook never ran.
    // String-coerce so ObjectId / string equality never trips this guard.
    const allPermissions = await this.getPermission()
    const validIds = new Set<string>()
    for (const p of allPermissions as any[]) {
      if (p?._id) validIds.add(String(p._id))
      if (p?.permissionId) validIds.add(String(p.permissionId))
    }
    const invalid = permissions.filter((value) => !validIds.has(String(value.permissionId)))
    if (invalid.length > 0) {
      throw badRequest('Invalid permission')
    }
    return permissions.filter((value) => value.isActive).map((value) => String(value.permissionId))
  }



  async getPermission(): Promise<IPermission[]> {
    try {
      const result = (await this.getCacheForPermission()) as IPermission[]
      if (result) {
        return result
      }
      const dbPermission = await this.permissionRepository.getPermissions({} as any)
      await this.setCacheForPermission(dbPermission as any)
      return dbPermission as any
    } catch (error: any) {
      loggerProvider.logger.error('getPermission_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }

  private async setCacheForPermission(data: IPermission[]) {
    const cacheKey = `${this.CACHE_KEY_PREFIX}`
    await this.redisService.del(cacheKey)
    await this.redisService.set(cacheKey, JSON.stringify(data))
  }

  private async updateOriginationData(options: { session?: any } = {},
  ): Promise<void> {
    try {
      const { roles, permissions, rolePermissions } = roleData
      const roleMapIds = new Map<string, any>()
      const permissionMapIds = new Map<string, any>()
      const dbRoles = await this.roleRepository.getRoles({} as any)
      const existingRoleKeys = new Set(dbRoles.map((r: any) => r.roleKey))
      const newRoles = roles.filter((r: any) => !existingRoleKeys.has(r.roleKey))
      // Insert Organization Specific Roles
      dbRoles.forEach((r: any) => roleMapIds.set(r.roleKey, r.roleId))
      if (newRoles.length > 0) {
        const createdRoles: any[] = []
        for (const r of newRoles) {
          const created = await this.roleRepository.saveRole(
            {
              roleKey: r.roleKey,
              name: r.name,
              description: r.description,
              isActive: true,
              isDelete: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any,
            options as any,
          )
          createdRoles.push(created)
        }
        createdRoles.forEach((r: any) => roleMapIds.set(r.roleKey, r.roleId))
      }

      const dbPermission = await this.permissionRepository.getPermissions({} as any)
      const existingPermission = new Set(dbPermission.map((r: any) => r.code))
      const newPermission = permissions.filter((r: any) => !existingPermission.has(r.code))
      // Insert Organization Specific Roles
      dbPermission.forEach((r: any) => permissionMapIds.set(r.code, r._id))
      if (newPermission.length > 0) {
        const createdPermissions: any[] = []
        for (const p of newPermission) {
          const created = await this.permissionRepository.savePermission(
            {
              code: p.code,
              name: p.name,
              category: p.category,
              description: p.name,
              isActive: true,
              isDelete: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any,
            options as any,
          )
          createdPermissions.push(created)
        }
        createdPermissions.forEach((r: any) => permissionMapIds.set(r.code, r._id))
      }
      const organizations = await this.organizationRepository.getOrganizationsList({} as any, options as any)
      const newInsertions: Omit<IRolePermission, 'rolePermissionId'>[] = []
      for (const org of organizations) {
        let dbRolePermission = await this.rolePermissionRepository.getRolePermissions({ orgId: toObjectId(org.orgId) } as any)
        let existenceRolePermission = new Set(dbRolePermission.map((r: any) => r.roleId.toString()))
        for (const [role, value] of Object.entries(rolePermissions)) {
          const roleId = roleMapIds.get(role)
          if (!roleId) continue
          if (!existenceRolePermission.has(roleId.toString())) {
            const permissionIds = (value as any[]).map((value: any) => permissionMapIds.get(value)) as any[]
            newInsertions.push({
              roleId,
              permissionIds,
              orgId: org.orgId,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any)
          }
        }
      }
      if (newInsertions.length) {
        for (const insertion of newInsertions) {
          await this.rolePermissionRepository.saveRolePermission(insertion as any, options as any)
        }
      }
      const cacheKey = `${this.CACHE_KEY_PREFIX}`
      await this.redisService.del(cacheKey)
      await this.getPermission()
      loggerProvider.logger.info(`updateOriginationData permissions Done for org`)
    } catch (error: any) {
      loggerProvider.logger.error('seedDefaultsForOrg_Error', {
        error: error.message,
        stack: error.stack,
      })
      throw error
    }
  }

  private async getCacheForPermission() {
    const cacheKey = `${this.CACHE_KEY_PREFIX}`
    const result = await this.redisService.get(cacheKey)
    return result
  }

  /**
   * Get all roles for super admin (includes all roles)
   */
  async getAllRolesForSuperAdmin(): Promise<IRole[]> {
    try {
      return await this.roleRepository.getRoles({} as any) as any
    } catch (error: any) {
      loggerProvider.logger.error('getAllRolesForSuperAdmin_Error', {
        error: error.message,
        stack: error.stack,
      })
      throw error
    }
  }

  /**
   * Create a new role (Super Admin only) and seed RolePermission rows
   * for every existing organization with the provided permissionIds.
   */
  @Transactional
  async createRole(
    data: { name: string; roleKey: string; description?: string; permissionIds?: string[] },
    userProfile: UserProfile,
    options: { session?: any } = {},
  ): Promise<{ message: string; role: IRole }> {
    try {
      const existing = await this.roleRepository.getRole({ roleKey: data.roleKey } as any)
      if (existing) {
        throw badRequest('Role key already exists')
      }

      const created = await this.roleRepository.saveRole(
        {
          roleKey: data.roleKey,
          name: data.name,
          description: data.description ?? '',
          isActive: true,
          isDelete: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
        options as any,
      )

      // Validate provided permissionIds against the canonical permission set.
      let validPermissionIds: string[] = []
      if (data.permissionIds && data.permissionIds.length > 0) {
        const allPermissions = await this.getPermission()
        const validIds = new Set<string>()
        for (const p of allPermissions as any[]) {
          if (p?._id) validIds.add(String(p._id))
          if (p?.permissionId) validIds.add(String(p.permissionId))
        }
        const invalid = data.permissionIds.filter((id) => !validIds.has(String(id)))
        if (invalid.length > 0) {
          throw badRequest('Invalid permission')
        }
        validPermissionIds = data.permissionIds.map((id) => String(id))
      }

      const organizations = await this.organizationRepository.getOrganizationsList({} as any, options as any)
      for (const org of organizations) {
        await this.rolePermissionRepository.saveRolePermission(
          {
            roleId: (created as any).roleId ?? (created as any)._id,
            permissionIds: validPermissionIds,
            orgId: org.orgId,
            ...(userProfile?.userId && {
              createdBy: toObjectId(userProfile.userId),
              updatedBy: toObjectId(userProfile.userId),
            }),
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any,
          options as any,
        )
      }

      // saveRole returns a Mongoose Document; class-transformer chokes on its
      // internal state machine, so plain-object it before handing back to the
      // controller layer.
      const plainRole = JSON.parse(JSON.stringify(created))
      return { message: 'Role created successfully', role: plainRole }
    } catch (error: any) {
      loggerProvider.logger.error('createRole_Error', {
        error: error.message,
        stack: error.stack,
        data,
      })
      throw error
    }
  }

  /**
   * Update role description (Super Admin only)
   */
  async updateRoleDescription(
    roleId: string,
    description: string,
  ): Promise<{ message: string }> {
    try {
      const role = await this.roleRepository.getRole({ roleId: toObjectId(roleId), isDelete: false } as any)
      if (!role) {
        throw badRequest('Role not found')
      }

      await this.roleRepository.updateRole(
        { roleId: toObjectId(roleId) } as any,
        { description, updatedAt: new Date() } as any,
      )

      return { message: 'Role description updated successfully' }
    } catch (error: any) {
      loggerProvider.logger.error('updateRoleDescription_Error', {
        error: error.message,
        stack: error.stack,
        roleId,
      })
      throw error
    }
  }

  /**
   * Update role details including name, roleKey, and description (Super Admin only)
   */
  async updateRoleDetails(
    roleId: string,
    data: { name?: string; roleKey?: string; description?: string },
  ): Promise<{ message: string }> {
    try {
      const role = await this.roleRepository.getRole({ roleId: toObjectId(roleId), isDelete: false } as any)
      if (!role) {
        throw badRequest('Role not found')
      }

      // Check if roleKey already exists (if being updated)
      if (data.roleKey && data.roleKey !== role.roleKey) {
        const existingRole = await this.roleRepository.getRole({ roleKey: data.roleKey, isDelete: false } as any)
        if (existingRole) {
          throw badRequest('Role key already exists')
        }
      }

      const updateData: Partial<IRole> = { updatedAt: new Date() }
      if (data.name !== undefined) updateData.name = data.name
      if (data.roleKey !== undefined) updateData.roleKey = data.roleKey
      if (data.description !== undefined) updateData.description = data.description

      await this.roleRepository.updateRole({ roleId: toObjectId(roleId) } as any, updateData as any)

      return { message: 'Role updated successfully' }
    } catch (error: any) {
      loggerProvider.logger.error('updateRoleDetails_Error', {
        error: error.message,
        stack: error.stack,
        roleId,
      })
      throw error
    }
  }

  /**
   * Get all permissions for super admin
   */
  async getAllPermissionsForSuperAdmin(): Promise<IPermission[]> {
    try {
      return await this.permissionRepository.getPermissions({} as any) as any
    } catch (error: any) {
      loggerProvider.logger.error('getAllPermissionsForSuperAdmin_Error', {
        error: error.message,
        stack: error.stack,
      })
      throw error
    }
  }

  /**
   * Update permission description (Super Admin only)
   */
  async updatePermissionDescription(
    permissionId: string,
    description: string,
  ): Promise<{ message: string }> {
    try {
      const permission = await this.permissionRepository.getPermission({ permissionId: toObjectId(permissionId), isDelete: false } as any)
      if (!permission) {
        throw badRequest('Permission not found')
      }

      await this.permissionRepository.updatePermission(
        { permissionId: toObjectId(permissionId) } as any,
        { description, updatedAt: new Date() } as any,
      )

      // Invalidate cache since permission description changed
      const cacheKey = `${this.CACHE_KEY_PREFIX}`
      await this.redisService.del(cacheKey)

      return { message: 'Permission description updated successfully' }
    } catch (error: any) {
      loggerProvider.logger.error('updatePermissionDescription_Error', {
        error: error.message,
        stack: error.stack,
        permissionId,
      })
      throw error
    }
  }
}
