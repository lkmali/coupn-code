import { Body, Get, JsonController, Post, Put, QueryParams } from 'routing-controllers'
import { OpenAPI } from 'routing-controllers-openapi'
import { LookupUserQuery, SaveUserDto, UpdateUserDto } from '../dto'
import { UserService } from '../service'

@JsonController('/user')
export class UserController {
  private readonly userService: UserService

  constructor() {
    this.userService = new UserService()
  }

  @Get('/')
  @OpenAPI({
    summary: 'Look up the saved details for this device',
    description:
      'Resolves a user from the machineId (localStorage UUID), falling back to the browser fingerprint when storage was cleared. Returns null when the device is unknown — that is the signal for the UI to show the details popup.',
    tags: ['USER'],
    responses: {
      '200': {
        description: 'The saved user, or null when this device has never submitted details',
        content: {
          'application/json': {
            example: {
              user: {
                userId: '669960860c8379e64aea5802',
                userName: 'Laxman Mali',
                mobileNumber: '9876543210',
                upiId: 'laxman@upi',
              },
            },
          },
        },
      },
    },
  })
  async lookup(@QueryParams() query: LookupUserQuery) {
    const user = await this.userService.findByDevice(query.machineId, query.fingerprint)
    return { user }
  }

  @Post('/')
  @OpenAPI({
    summary: 'Save the details collected by the popup',
    description:
      'Creates the user, or — when the mobile number already exists — links this device to the existing record instead of creating a duplicate.',
    tags: ['USER'],
    requestBody: {
      content: {
        'application/json': {
          example: {
            machineId: '3f8a9c2e-1b4d-4f6a-9e0c-7d5b2a1f8e3c',
            fingerprint: 'a3f1c9e7b2d84056',
            userName: 'Laxman Mali',
            mobileNumber: '+91 98765 43210',
            upiId: 'laxman@upi',
          },
        },
      },
    },
  })
  async save(@Body() request: SaveUserDto) {
    return this.userService.saveUser(request)
  }

  @Put('/')
  @OpenAPI({
    summary: 'Update the details from the settings page',
    description: 'Updates the record this device is linked to.',
    tags: ['USER'],
    requestBody: {
      content: {
        'application/json': {
          example: {
            machineId: '3f8a9c2e-1b4d-4f6a-9e0c-7d5b2a1f8e3c',
            userName: 'Laxman Mali',
            mobileNumber: '+91 98765 43210',
            upiId: 'laxman@okaxis',
          },
        },
      },
    },
  })
  async update(@Body() request: UpdateUserDto) {
    return this.userService.updateUser(request)
  }
}
