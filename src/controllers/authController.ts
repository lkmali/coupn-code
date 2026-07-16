import { JsonController, Post, Body} from 'routing-controllers'
import { SendOtpDto, SendPasswordSetLinkDto, ResetPasswordRequestDto, VerifyOtpDto } from '../dto'
import { Authentication, CurrentUser } from '../decorators'
import { JWTService, UserService } from '../service'
import { AuthenticationStrategyType, UserProfile } from '../typings'
import { OpenAPI } from 'routing-controllers-openapi'
@JsonController('/auth')
export class AuthController {
  private readonly userService: UserService
  private readonly jWTService: JWTService
  constructor() {
    this.userService = new UserService()
    this.jWTService = new JWTService()
  }


  @Post('/send-otp')
  @OpenAPI({
    summary: 'this api is use for send otp on given mobile number',
    description: 'Send OTP to the provided mobile number.',
    tags: ['AUTH'],
    requestBody: {
      content: {
        'application/json': {
          example: {
            mobileNumber: '919876543210',
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'OTP sent successfully',
        content: {
          'application/json': {
            example: {
              success: true,
              message: 'OTP sent successfully',
            },
          },
        },
      },
    },
  })
  @Authentication(AuthenticationStrategyType.NO_AUTH)
  async signUp(@Body() user: SendOtpDto) {
    const result = await this.userService.sendResetPasswordLink(user.mobileNumber)
    return result
  }

  @Post('/verify-otp')
  @OpenAPI({
    summary: 'this api is use for verify otp',
    description: 'Verify the OTP sent to the provided mobile number.',
    tags: ['AUTH'],
    requestBody: {
      content: {
        'application/json': {
          example: {
            mobileNumber: '919876543210',
            otp: '123456',
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'OTP verified, JWT token returned',
        content: {
          'application/json': {
            example: {
              userId: '669960860c8379e64aea5802',
              isNewUser: false,
              token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2Njk5NjA4NjBjODM3OWU2NGFlYTU4MDIifQ.abc123',
            },
          },
        },
      },
    },
  })
  @Authentication(AuthenticationStrategyType.OTP_AUTH)
  login(@CurrentUser() userProfile: UserProfile, @Body() _user: VerifyOtpDto) {
    return {
      userId: userProfile?.userId,
      isNewUser: userProfile?.isNewUser,
      token: this.jWTService.generateToken(userProfile),
    }
  }

  @Post('/login')
  @OpenAPI({
    summary: 'Login with email and password (Basic Auth)',
    description:
      'Send email and password via Basic Auth. Returns a JWT token that is automatically set for all subsequent requests in Swagger.',
    tags: ['AUTH'],
    security: [{ basicAuth: [] }],
    responses: {
      '200': {
        description: 'Login successful, JWT token returned',
        content: {
          'application/json': {
            example: {
              userId: '669960860c8379e64aea5802',
              isNewUser: false,
              roles: ['ADMIN'],
              token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2Njk5NjA4NjBjODM3OWU2NGFlYTU4MDIiLCJyb2xlcyI6WyJBRE1JTiJdfQ.abc123',
            },
          },
        },
      },
    },
  })
  @Authentication(AuthenticationStrategyType.BASIC_AUTH)
  loginByPassword(@CurrentUser() userProfile: UserProfile, @Body() _user: object) {
    return {
      userId: userProfile?.userId,
      isNewUser: userProfile?.isNewUser,
      token: this.jWTService.generateToken(userProfile),
    }
  }

  @Post('/email/password/link')
  @OpenAPI({
    summary: 'send the password set link',
    description: 'send the password set link',
    tags: ['AUTH'],
    requestBody: {
      content: {
        'application/json': {
          example: {
            email: 'user@clinic.com',
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Password reset link sent to email',
        content: {
          'application/json': {
            example: {
              success: true,
              message: 'Password reset link sent successfully',
            },
          },
        },
      },
    },
  })
  @Authentication(AuthenticationStrategyType.NO_AUTH)
  async sendResetPasswordLink(@Body() user: SendPasswordSetLinkDto) {
    const result = await this.userService.sendResetPasswordLink(user.email)
    return result
  }

  @Post('/email/password/set')
  @OpenAPI({
    summary: 'set new password',
    description: 'set new password',
    tags: ['AUTH'],
    requestBody: {
      content: {
        'application/json': {
          example: {
            email: 'user@clinic.com',
            password: 'NewSecureP@ssw0rd',
            otp: '123456',
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Password set successfully',
        content: {
          'application/json': {
            example: {
              success: true,
              message: 'Password updated successfully',
            },
          },
        },
      },
    },
  })
  @Authentication(AuthenticationStrategyType.EMAIL_AUTH)
  async setUserPassword(@Body() data: ResetPasswordRequestDto, @CurrentUser() userProfile: UserProfile) {
    const result = await this.userService.setUserPassword(userProfile.userId, data.password)
    return result
  }
}
