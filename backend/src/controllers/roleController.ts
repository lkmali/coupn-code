import { JsonController, Get, Post, Body, Param } from 'routing-controllers'
import { PermissionService } from '../service'
import { Authorize, CurrentUser } from '../decorators'
import { Role, UserProfile } from '../typings'
import {PermissionDto} from '../dto'
import { OpenAPI } from 'routing-controllers-openapi'

@JsonController('/roles')
export class RolesController {
  private permissionService = PermissionService.Instance

  // Get all roles for organization
  @Get('/')
  @Authorize([Role.ADMIN, Role.CEO, Role.TECHNICIAN])
  @OpenAPI({
    summary: 'Get all roles',
    description: 'Returns a list of all available roles in the system. Accessible by ADMIN, CEO, and TECHNICIAN roles.',
    tags: ['Roles'],
    responses: {
      '200': {
        description: 'Roles retrieved successfully',
        content: {
          'application/json': {
            example: {
              success: true,
              data: [
                { roleId: '669960860c8379e64aea586a', name: 'ADMIN', description: 'Organization administrator' },
                { roleId: '669960860c8379e64aea586b', name: 'DOCTOR', description: 'Medical doctor' },
                { roleId: '669960860c8379e64aea586c', name: 'NURSE', description: 'Nursing staff' },
                { roleId: '669960860c8379e64aea586d', name: 'RECEPTIONIST', description: 'Front desk receptionist' },
                { roleId: '669960860c8379e64aea586e', name: 'USER', description: 'Standard user' },
              ],
            },
          },
        },
      },
      '401': { description: 'Unauthorized - invalid or missing JWT token' },
      '403': { description: 'Forbidden - insufficient role' },
    },
  })
  async getAllRoles() {
    const response = await this.permissionService.getAllRoles()
    return response
  }

  // Get all roles with their permissions for organization
  @Get('/with-all-permissions')
  @Authorize([Role.ADMIN, Role.CEO, Role.TECHNICIAN])
  @OpenAPI({
    summary: 'Get all roles with their permissions',
    description: 'Returns all roles along with their associated permissions for the current organization. Useful for building role management UIs.',
    tags: ['Roles', 'Permissions'],
    responses: {
      '200': {
        description: 'Roles with permissions retrieved successfully',
        content: {
          'application/json': {
            example: {
              success: true,
              data: [
                {
                  roleId: '669960860c8379e64aea586a',
                  name: 'DOCTOR',
                  permissions: [
                    { permissionId: '669960860c8379e64aea5870', name: 'VIEW_PATIENTS', isActive: true },
                    { permissionId: '669960860c8379e64aea5871', name: 'MANAGE_APPOINTMENTS', isActive: true },
                    { permissionId: '669960860c8379e64aea5872', name: 'MANAGE_LEADS', isActive: false },
                    { permissionId: '669960860c8379e64aea5873', name: 'VIEW_REPORTS', isActive: true },
                  ],
                },
                {
                  roleId: '669960860c8379e64aea586b',
                  name: 'NURSE',
                  permissions: [
                    { permissionId: '669960860c8379e64aea5870', name: 'VIEW_PATIENTS', isActive: true },
                    { permissionId: '669960860c8379e64aea5871', name: 'MANAGE_APPOINTMENTS', isActive: false },
                  ],
                },
              ],
            },
          },
        },
      },
      '401': { description: 'Unauthorized - invalid or missing JWT token' },
      '403': { description: 'Forbidden - insufficient role' },
    },
  })
  async getAllRolesWithPermissions(@CurrentUser() userProfile: UserProfile) {
    const response = await this.permissionService.getAllRolesWithPermissions(userProfile.orgId)
    return response
  }

  @Post('/:roleId/permissions')
  @Authorize([Role.ADMIN])
  @OpenAPI({
    summary: 'Assign permissions to a role',
    description: 'Updates the permissions assigned to a specific role within the organization. Replaces the existing permission configuration for the role. Only ADMIN can modify role permissions.',
    tags: ['Roles', 'Permissions'],
    parameters: [
      {
        name: 'roleId',
        in: 'path',
        required: true,
        description: 'The ID of the role to assign permissions to',
        schema: { type: 'string', example: '669960860c8379e64aea586a' },
      },
    ],
    requestBody: {
      description: 'Array of permission assignments for the role',
      content: {
        'application/json': {
          example: [
            { permissionId: '669960860c8379e64aea5870', isActive: true },
            { permissionId: '669960860c8379e64aea5871', isActive: true },
            { permissionId: '669960860c8379e64aea5872', isActive: false },
            { permissionId: '669960860c8379e64aea5873', isActive: true },
          ],
        },
      },
    },
    responses: {
      '200': {
        description: 'Role permissions updated successfully',
        content: {
          'application/json': {
            example: {
              success: true,
              message: 'Role permissions updated successfully',
            },
          },
        },
      },
      '400': { description: 'Bad request - invalid permission data' },
      '401': { description: 'Unauthorized - invalid or missing JWT token' },
      '403': { description: 'Forbidden - only ADMIN allowed' },
      '404': { description: 'Role not found' },
    },
  })
  async assignPermissionsToRole(
    @Param('roleId') roleId: string,
    @Body({ required: true, validate: false, type: PermissionDto })
    permissions: PermissionDto[],
    @CurrentUser() userProfile: UserProfile,
  ) {
    const response = await this.permissionService.updateRoleIdPermissions(roleId, permissions, userProfile)
    return response
  }
}
