import { JsonController, Get, QueryParams, Post, Param, Body, Put, Delete } from 'routing-controllers'
import { PermissionService, UserService } from '../service'
import { Authorize, CurrentUser } from '../decorators'
import { Role, UserProfile, UserStatus } from '../typings'
import { HospitalRole } from '../config'
import { UserListQuery, PermissionDto, UpdateUserProfileDto } from '../dto'
import { UUIDTypes } from 'uuid'
import { OpenAPI } from 'routing-controllers-openapi'

@JsonController('/user')
export class UserController {
  private userService = UserService.Instance
  private permissionService = PermissionService.Instance

  @Get('/profile')
  @OpenAPI({
    summary: 'Get logged in user profile',
    description: 'Returns the profile of the currently logged in user including name, email, role, organization, and preferences.',
    tags: ['User'],
    responses: {
      '200': {
        description: 'User profile retrieved successfully',
        content: {
          'application/json': {
            example: {
              success: true,
              data: {
                userId: '669960860c8379e64aea586a',
                orgId: '669960860c8379e64aea586b',
                userName: 'Dr. Priya Sharma',
                email: 'priya.sharma@clinic.com',
                mobileNumber: '+919876543210',
                role: 'DOCTOR',
                specialization: ['Reproductive Medicine', 'IVF'],
                languagesSpoken: ['English', 'Hindi'],
                experienceYears: 12,
                qualifications: ['MBBS', 'MD Obstetrics', 'Fellowship IVF'],
                isActive: true,
              },
            },
          },
        },
      },
      '401': { description: 'Unauthorized - invalid or missing JWT token' },
    },
  })
  async getLoginUserProfile(@CurrentUser() userProfile: UserProfile) {
    const response = await this.userService.getUserProfile(userProfile)
    return response
  }

  @Get('/dashboard/stats')
  @Authorize(HospitalRole)
  @OpenAPI({
    summary: 'Get dashboard statistics',
    description: 'Returns user statistics including total users, active/inactive counts, and role-wise breakdown for the current organization.',
    tags: ['User', 'Dashboard'],
    responses: {
      '200': {
        description: 'Dashboard stats retrieved successfully',
        content: {
          'application/json': {
            example: {
              success: true,
              data: {
                totalUsers: 25,
                activeUsers: 22,
                inactiveUsers: 3,
                roleBreakdown: {
                  ADMIN: 2,
                  DOCTOR: 8,
                  NURSE: 5,
                  RECEPTIONIST: 4,
                  USER: 3,
                },
              },
            },
          },
        },
      },
      '401': { description: 'Unauthorized' },
      '403': { description: 'Forbidden - insufficient role' },
    },
  })
  async getDashboardStats(@CurrentUser() userProfile: UserProfile) {
    const response = await this.userService.getDashboardStats(userProfile)
    return response
  }

  @Put('/:userId/details')
  @Authorize([Role.ADMIN])
  @OpenAPI({
    summary: 'Update user profile',
    description: 'Updates the profile of a specific user by userId. Only ADMIN can update user details. Cannot change role, status, or organization through this endpoint.',
    tags: ['User'],
    parameters: [
      {
        name: 'userId',
        in: 'path',
        required: true,
        description: 'The ID of the user to update',
        schema: { type: 'string', example: '669960860c8379e64aea586a' },
      },
    ],
    requestBody: {
      description: 'Fields to update on the user profile',
      content: {
        'application/json': {
          example: {
            userName: 'Dr. Priya Sharma',
            mobileNumber: '+919876543210',
            specialization: ['Reproductive Medicine', 'IVF'],
            languagesSpoken: ['English', 'Hindi', 'Gujarati'],
            experienceYears: 13,
            qualifications: ['MBBS', 'MD Obstetrics', 'Fellowship IVF'],
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'User profile updated successfully',
        content: {
          'application/json': {
            example: {
              success: true,
              message: 'User profile updated successfully',
            },
          },
        },
      },
      '400': { description: 'Bad request - invalid input data' },
      '401': { description: 'Unauthorized' },
      '403': { description: 'Forbidden - only ADMIN allowed' },
      '404': { description: 'User not found' },
    },
  })
  async updateUserProfile(
    @Param('userId') userId: UUIDTypes,
    @Body() body: UpdateUserProfileDto,
    @CurrentUser() userProfile: UserProfile,
  ) {
    const response = await this.userService.updateUserProfile(body, userId, userProfile)
    return response
  }

  @Get('/lead')
  @Authorize(HospitalRole)
  @OpenAPI({
    summary: 'Get all users for lead assignment',
    description: 'Returns a simplified list of all users in the organization suitable for lead assignment dropdowns. Typically includes userId and userName.',
    tags: ['User', 'Lead'],
    responses: {
      '200': {
        description: 'User list for lead assignment retrieved successfully',
        content: {
          'application/json': {
            example: {
              success: true,
              data: [
                { userId: '669960860c8379e64aea586a', userName: 'Dr. Priya Sharma', role: 'DOCTOR' },
                { userId: '669960860c8379e64aea586b', userName: 'Nurse Anjali', role: 'NURSE' },
                { userId: '669960860c8379e64aea586c', userName: 'Receptionist Meera', role: 'RECEPTIONIST' },
              ],
            },
          },
        },
      },
      '401': { description: 'Unauthorized' },
      '403': { description: 'Forbidden - insufficient role' },
    },
  })
  async getAllTask(@CurrentUser() userProfile: UserProfile) {
    const response = await this.userService.getAllUserForLead(userProfile)
    return response
  }

  @Get('/')
  @Authorize(HospitalRole)
  @OpenAPI({
    summary: 'Get all users with pagination',
    description: 'Returns a paginated list of users in the organization. Supports filtering by role, active status, and text search on name/email.',
    tags: ['User'],
    parameters: [
      { name: 'skip', in: 'query', schema: { type: 'integer', default: 0 }, description: 'Number of records to skip' },
      { name: 'pageNumber', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number (1-based)' },
      { name: 'limit', in: 'query', schema: { type: 'integer', default: 25 }, description: 'Records per page' },
      { name: 'orderBy', in: 'query', schema: { type: 'string', default: 'DESC', enum: ['ASC', 'DESC'] }, description: 'Sort direction' },
      { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'createdAt' }, description: 'Field to sort by' },
      { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search term for name or email' },
      { name: 'isActive', in: 'query', schema: { type: 'boolean' }, description: 'Filter by active status' },
      { name: 'role', in: 'query', schema: { type: 'string', enum: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'USER'] }, description: 'Filter by role' },
    ],
    responses: {
      '200': {
        description: 'Paginated user list retrieved successfully',
        content: {
          'application/json': {
            example: {
              success: true,
              data: {
                rows: [
                  {
                    userId: '669960860c8379e64aea586a',
                    userName: 'Dr. Priya Sharma',
                    email: 'priya@clinic.com',
                    role: 'DOCTOR',
                    isActive: true,
                    createdAt: '2026-01-15T10:30:00.000Z',
                  },
                ],
                count: 25,
              },
            },
          },
        },
      },
      '401': { description: 'Unauthorized' },
      '403': { description: 'Forbidden - insufficient role' },
    },
  })
  async getAllUser(@QueryParams() query: UserListQuery, @CurrentUser() userProfile: UserProfile) {
    const response = await this.userService.getAllUserList(query, userProfile)
    return response
  }

  @Get('/profileWithPermission')
  @OpenAPI({
    summary: 'Get logged in user profile with permissions',
    description: 'Returns the current user profile along with their assigned permissions. Useful for frontend to determine UI access controls.',
    tags: ['User', 'Permissions'],
    responses: {
      '200': {
        description: 'User profile with permissions retrieved successfully',
        content: {
          'application/json': {
            example: {
              success: true,
              data: {
                userId: '669960860c8379e64aea586a',
                userName: 'Dr. Priya Sharma',
                role: 'DOCTOR',
                permissions: [
                  { permissionId: '669960860c8379e64aea5870', name: 'VIEW_PATIENTS', isActive: true },
                  { permissionId: '669960860c8379e64aea5871', name: 'MANAGE_APPOINTMENTS', isActive: true },
                ],
              },
            },
          },
        },
      },
      '401': { description: 'Unauthorized' },
    },
  })
  async getLoginUserPermissions(@CurrentUser() userProfile: UserProfile) {
    const response = await this.permissionService.getUserWithPermissions({
      userId: userProfile.userId,
      orgId: userProfile.orgId,
    })
    return response
  }

  @Get('/profile')
  @OpenAPI({
    summary: 'Get user by ID',
    description: 'Returns user details for the currently authenticated user by their userId extracted from the JWT token.',
    tags: ['User'],
    responses: {
      '200': {
        description: 'User details retrieved successfully',
        content: {
          'application/json': {
            example: {
              success: true,
              data: {
                userId: '669960860c8379e64aea586a',
                userName: 'Dr. Priya Sharma',
                email: 'priya@clinic.com',
                mobileNumber: '+919876543210',
                role: 'DOCTOR',
                isActive: true,
              },
            },
          },
        },
      },
      '401': { description: 'Unauthorized' },
      '404': { description: 'User not found' },
    },
  })
  async getUserById(@CurrentUser() userProfile: UserProfile) {
    const response = await this.userService.getUserById(userProfile.userId, userProfile.orgId)
    return response
  }

  @Get('/:userId/profileWithPermission')
  @Authorize([Role.ADMIN])
  @OpenAPI({
    summary: 'Get user permissions by user ID',
    description: 'Returns the profile and assigned permissions for a specific user. Only ADMIN can view other users permissions.',
    tags: ['User', 'Permissions'],
    parameters: [
      {
        name: 'userId',
        in: 'path',
        required: true,
        description: 'The ID of the user whose permissions to retrieve',
        schema: { type: 'string', example: '669960860c8379e64aea586a' },
      },
    ],
    responses: {
      '200': {
        description: 'User permissions retrieved successfully',
        content: {
          'application/json': {
            example: {
              success: true,
              data: {
                userId: '669960860c8379e64aea586a',
                userName: 'Nurse Anjali',
                role: 'NURSE',
                permissions: [
                  { permissionId: '669960860c8379e64aea5870', name: 'VIEW_PATIENTS', isActive: true },
                  { permissionId: '669960860c8379e64aea5871', name: 'VIEW_APPOINTMENTS', isActive: true },
                  { permissionId: '669960860c8379e64aea5872', name: 'MANAGE_LEADS', isActive: false },
                ],
              },
            },
          },
        },
      },
      '401': { description: 'Unauthorized' },
      '403': { description: 'Forbidden - only ADMIN allowed' },
      '404': { description: 'User not found' },
    },
  })
  async getUserPermissions(@Param('userId') userId: UUIDTypes, @CurrentUser() userProfile: UserProfile) {
    const response = await this.permissionService.getUserWithPermissions({ userId, orgId: userProfile.orgId })
    return response
  }

  @Post('/:userId/permissions')
  @Authorize([Role.ADMIN])
  @OpenAPI({
    summary: 'Assign permissions to a user',
    description: 'Updates the permissions assigned to a specific user. Replaces the existing permission set with the provided list. Only ADMIN can modify user permissions.',
    tags: ['User', 'Permissions'],
    parameters: [
      {
        name: 'userId',
        in: 'path',
        required: true,
        description: 'The ID of the user to assign permissions to',
        schema: { type: 'string', example: '669960860c8379e64aea586a' },
      },
    ],
    requestBody: {
      description: 'Array of permission assignments',
      content: {
        'application/json': {
          example: [
            { permissionId: '669960860c8379e64aea5870', isActive: true },
            { permissionId: '669960860c8379e64aea5871', isActive: true },
            { permissionId: '669960860c8379e64aea5872', isActive: false },
          ],
        },
      },
    },
    responses: {
      '200': {
        description: 'Permissions updated successfully',
        content: {
          'application/json': {
            example: {
              success: true,
              message: 'User permissions updated successfully',
            },
          },
        },
      },
      '400': { description: 'Bad request - invalid permission data' },
      '401': { description: 'Unauthorized' },
      '403': { description: 'Forbidden - only ADMIN allowed' },
      '404': { description: 'User not found' },
    },
  })
  async assignPermissionsToUser(
    @Param('userId') userId: UUIDTypes,
    @Body({ required: true, validate: false, type: PermissionDto })
    permissions: PermissionDto[],
    @CurrentUser() userProfile: UserProfile,
  ) {
    const response = await this.permissionService.updateUserPermissions(userId, permissions, userProfile)
    return response
  }

  @Put('/:userId/:status')
  @OpenAPI({
    summary: 'Activate or deactivate user',
    description: 'Changes the status of a user to ACTIVE or INACTIVE. Only ADMIN can change user status within their organization.',
    tags: ['User'],
    parameters: [
      {
        name: 'userId',
        in: 'path',
        required: true,
        description: 'The ID of the user to activate/deactivate',
        schema: {
          type: 'string',
          example: '669960860c8379e64aea586a',
        },
      },
      {
        name: 'status',
        in: 'path',
        required: true,
        description: 'Target status for the user',
        schema: {
          type: 'string',
          enum: ['ACTIVE', 'INACTIVE'],
        },
      },
    ],
    responses: {
      '200': {
        description: 'User status updated successfully',
        content: {
          'application/json': {
            example: {
              success: true,
              message: 'User status updated to ACTIVE',
            },
          },
        },
      },
      '400': { description: 'Bad request - invalid status value' },
      '401': { description: 'Unauthorized' },
      '403': { description: 'Forbidden - only ADMIN allowed' },
      '404': { description: 'User not found' },
    },
  })
  @Authorize([Role.ADMIN])
  async activateInactiveUser(
    @Param('userId') userId: UUIDTypes,
    @Param('status') status: UserStatus,
    @CurrentUser() userProfile: UserProfile,
  ) {
    const response = await this.userService.activateInactiveUser(userId, status, userProfile)
    return response
  }

  @Delete('/:userId')
  @OpenAPI({
    summary: 'Delete user (soft delete)',
    description: 'Soft deletes a user by setting isDelete to true. Only ADMIN can delete users. The user record is retained in the database but excluded from all queries.',
    tags: ['User'],
    parameters: [
      {
        name: 'userId',
        in: 'path',
        required: true,
        description: 'The ID of the user to soft delete',
        schema: { type: 'string', example: '669960860c8379e64aea586a' },
      },
    ],
    responses: {
      '200': {
        description: 'User soft deleted successfully',
        content: {
          'application/json': {
            example: {
              success: true,
              message: 'User deleted successfully',
            },
          },
        },
      },
      '401': { description: 'Unauthorized' },
      '403': { description: 'Forbidden - only SUPER_ADMIN allowed' },
      '404': { description: 'User not found' },
    },
  })
  @Authorize([Role.SUPER_ADMIN])
  async deleteUser(@Param('userId') userId: UUIDTypes, @CurrentUser() userProfile: UserProfile) {
    const response = await this.userService.softDeleteUser(userId, userProfile)
    return response
  }
}
