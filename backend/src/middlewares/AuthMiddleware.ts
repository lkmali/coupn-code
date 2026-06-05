// middlewares/AuthMiddleware.ts
import { ExpressMiddlewareInterface, Middleware } from 'routing-controllers'
import { Request, Response, NextFunction } from 'express'
import { AuthenticationStrategy } from '../strategies'
import { registry } from 'dependencyjs'
import { findAction, getMobileWithCountryCode } from '../utils'
import { getRequestContext, requestContext } from '../provider/request.context.provider'
import { isEmpty } from 'lodash'
import { Messages } from '../constants'
import { LoggerProvider } from '../provider/logger.provider'
import { OrganizationMasterDataService } from '../service/organizationMasterData.service'

@Middleware({ type: 'before' })
export class AuthMiddleware implements ExpressMiddlewareInterface {
  async use(request: Request, response: Response, next: NextFunction): Promise<any> {
    const route = findAction(request)
    let auth = 'jwtAuth' // default strategy
    let roles = []

    if (route) {
      const handler = (route.target as any).prototype[route.method]
      const explicit = Reflect.getMetadata('auth:type', handler)
      const rolesRes = Reflect.getMetadata('loginUser:roles', handler)

      if (explicit) {
        auth = explicit
      }
      if (rolesRes) {
        roles = rolesRes
      }
    }
    if (request['body'] && request.body['email'] && !isEmpty(request.body['email'])) {
      request.body['email'] = request.body['email'].toLowerCase()
    }

    if (request['body'] && request.body['mobileNumber'] && !isEmpty(request.body['mobileNumber'])) {
      const mobileWithCountryCode = getMobileWithCountryCode(request.body['mobileNumber'])
      request.body['mobileNumber'] = mobileWithCountryCode
    }

    if (request['body'] && request.body['adminEmail'] && !isEmpty(request.body['adminEmail'])) {
      request.body['adminEmail'] = request.body['adminEmail'].toLowerCase()
    }

    if (auth === 'noAuth') {
      return next()
    }
    const authService: AuthenticationStrategy = registry.resolve(AuthenticationStrategy, auth)
    if (!authService) {
      return response.status(500).json({
        message: Messages.ERROR.AUTH_STRATEGY_NOT_FOUND(auth),
      })
    }
    try {
      const result = await authService.authenticate(request)
      if (roles.length > 0) {
        const roles = result.roles ?? []
        if (result.role) {
          roles.push(result.role)
        }
        if (!result.roles || !result.roles.some(role => roles.includes(role))) {
          return response.status(403).json({ message: Messages.ERROR.FORBIDDEN_ACCESS_DENIED })
        }
      }
      request['user'] = result // attach to request

      // Guard checks: moduleId and treatmentType
      if (route) {
        const handler = (route.target as any).prototype[route.method]
        const moduleId = Reflect.getMetadata('guard:moduleId', handler) || Reflect.getMetadata('guard:moduleId', route.target)
        const treatmentType = Reflect.getMetadata('guard:treatmentType', handler) || Reflect.getMetadata('guard:treatmentType', route.target)

        if (moduleId || treatmentType) {
          try {
            const masterData = await OrganizationMasterDataService.Instance.get(result.orgId as string)

            if (moduleId && masterData) {
              const moduleConfig = (masterData as any).menuItemsConfig?.find((m: any) => m.id === moduleId)
              if (!moduleConfig || moduleConfig.enabled !== true) {
                return response.status(403).json({ message: `Module '${moduleId}' is not enabled for this organization` })
              }
            }

            if (treatmentType && masterData) {
              const hasType = (masterData as any).sopTreatmentTypes?.some((t: any) => t.id === treatmentType)
              if (!hasType) {
                return response.status(403).json({ message: `Treatment type '${treatmentType}' is not available for this organization` })
              }
            }
          } catch (error: any) {
            LoggerProvider.Instance.logger.error('Guard check failed', {
              error: error.message,
              moduleId,
              treatmentType,
              orgId: result.orgId,
            })
            return response.status(500).json({ message: Messages.ERROR.INTERNAL_SERVER_ERROR })
          }
        }
      }

      const context = getRequestContext()
      function markTokenValid() {
        const ctx = requestContext.getStore()
        if (ctx) {
          requestContext.enterWith({
            ...ctx,
            ...context,
            userId: String(result.userId),
            sessionId: String(result.sessionId),
          })
        }
      }
      markTokenValid()
      next()
    } catch (error: any) {
      const hasStatusCode = typeof error === 'object' && error !== null && 'statusCode' in error
      const statusCode = hasStatusCode ? (error as any).statusCode : 500
      const message = hasStatusCode ? (error as any).error : { message: Messages.ERROR.INTERNAL_SERVER_ERROR }
      if (statusCode !== 401 && statusCode !== 404) {
        LoggerProvider.Instance.logger.error('Authentication failed', {
          error: message.message || error.message || error,
          statusCode,
          endpoint: request.originalUrl,
          method: request.method,
          authStrategy: auth,
        })
      }
      response.status(statusCode).send({
        message: message.message,
        statusCode,
      })
    }
  }
}
