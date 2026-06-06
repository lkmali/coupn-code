import { JsonController, Get, QueryParams, Post, Param, Body, Put } from 'routing-controllers'
import { PermissionService, UserService } from '../service'
import { Authorize, CurrentUser } from '../decorators'
import { Role, UserProfile } from '../typings'
import { UserListQuery, PermissionDto, UpdateUserProfileDto, RegisterUserDto, UpdateUserStatusDto } from '../dto'
import { UUIDTypes } from 'uuid'
import { OpenAPI } from 'routing-controllers-openapi'

@JsonController('/user')
export class UserController {
  private userService = UserService.Instance
  private permissionService = PermissionService.Instance

  @Post('/')
  @Authorize([Role.ADMIN])
  @OpenAPI({
    summary: 'Create a new user',
    description: 'Creates a new user within the current admin\'s organization. Only ADMIN can create users. The ADMIN role cannot be assigned through this endpoint.',
    tags: ['User'],
    requestBody: {
      description: 'New user details',
      content: {
        'application/json': {
          example: {
            userName: 'Anjali',
            email: 'anjali@clinic.com',
            mobileNumber: '+919876543211',
            password: 'Secret@123',
            roles: ['USER'],
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'User created successfully',
        content: {
          'application/json': {
            example: { message: 'User created successfully' },
          },
        },
      },
      '400': { description: 'Bad request - invalid input or role not allowed' },
      '401': { description: 'Unauthorized - email or mobile already exists / invalid token' },
      '403': { description: 'Forbidden - only ADMIN allowed' },
    },
  })
  async createUser(@Body() body: RegisterUserDto, @CurrentUser() userProfile: UserProfile) {
    const response = await this.userService.registerNewUser(body, userProfile)
    return response
  }

  @Put('/:userId/status')
  @Authorize([Role.ADMIN])
  @OpenAPI({
    summary: 'Activate or deactivate a user',
    description: 'Updates the active status of a user in the organization. Only ADMIN can change a user\'s status. The main admin cannot be deactivated.',
    tags: ['User'],
    parameters: [
      {
        name: 'userId',
        in: 'path',
        required: true,
        description: 'The ID of the user whose status to update',
        schema: { type: 'string', example: '669960860c8379e64aea586a' },
      },
    ],
    requestBody: {
      description: 'New status for the user',
      content: {
        'application/json': {
          example: { status: 'ACTIVE' },
        },
      },
    },
    responses: {
      '200': {
        description: 'User status updated successfully',
        content: {
          'application/json': {
            example: { message: 'User active successfully' },
          },
        },
      },
      '400': { description: 'Bad request - invalid status or main admin cannot be deactivated' },
      '401': { description: 'Unauthorized' },
      '403': { description: 'Forbidden - only ADMIN allowed' },
      '404': { description: 'User not found' },
    },
  })
  async updateUserStatus(
    @Param('userId') userId: UUIDTypes,
    @Body() body: UpdateUserStatusDto,
    @CurrentUser() userProfile: UserProfile,
  ) {
    const response = await this.userService.activateInactiveUser(userId, body.status, userProfile)
    return response
  }

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
                userName: 'Priya Sharma',
                email: 'priya.sharma@clinic.com',
                mobileNumber: '+919876543210',
                role: 'USER',
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
            userName: 'Priya Sharma',
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


  @Get('/')
  @Authorize([Role.ADMIN])
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
      { name: 'role', in: 'query', schema: { type: 'string', enum: ['ADMIN', 'RECEPTIONIST', 'USER'] }, description: 'Filter by role' },
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
                    userName: 'Priya Sharma',
                    email: 'priya@clinic.com',
                    role: 'USER',
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
                userName: 'Priya Sharma',
                role: 'USER',
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
                userName: 'Priya Sharma',
                email: 'priya@clinic.com',
                mobileNumber: '+919876543210',
                role: 'USER',
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
                userName: 'Anjali',
                role: 'USER',
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
}
