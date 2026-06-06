// middlewares/CustomErrorHandler.ts
import { ExpressErrorMiddlewareInterface, Middleware } from 'routing-controllers'
import { ValidationError } from 'class-validator'
import { Messages } from '../constants'
function extractValidationErrors(errors: ValidationError[], parentPath = ''): Array<{ field: string; error: string }> {
  let result: Array<{ field: string; error: string }> = []
  for (const err of errors) {
    const fieldPath = parentPath ? `${parentPath}.${err.property}` : err.property
    if (err.constraints) {
      for (const msg of Object.values(err.constraints)) {
        result.push({ field: fieldPath, error: msg })
      }
    }
    if (err.children && err.children.length > 0) {
      result = result.concat(extractValidationErrors(err.children, fieldPath))
    }
  }
  return result
}

@Middleware({ type: 'after' })
export class CustomErrorHandler implements ExpressErrorMiddlewareInterface {
  error(error: any, _request: any, response: any, _next: (err?: any) => any) {
    try {
      // Handle validation errors
      if (Array.isArray(error?.errors) && error.errors[0] instanceof ValidationError) {
        const formattedErrors = extractValidationErrors(error.errors)
        return response.status(400).json({
          message: Messages.ERROR.VALIDATION_FAILED,
          statusCode: 400,
          errors: formattedErrors,
        })
      }

      // Handle custom error format (with statusCode and error properties)
      if (error.statusCode && error.error) {
        const statusCode = error.error.statusCode || error.statusCode || 500
        const message = error.error.message || error.message || Messages.ERROR.INTERNAL_SERVER_ERROR
        return response.status(statusCode).json({
          statusCode,
          message,
        })
      }

      // Handle standard HTTP errors (including errors with statusCode or status)
      if (error.statusCode || error.status) {
        const statusCode = error.statusCode || error.status || 500
        const message = error.message || Messages.ERROR.INTERNAL_SERVER_ERROR
        return response.status(statusCode).json({
          statusCode,
          message,
        })
      }

      console.error('CustomErrorHandler_UnhandledError', {
        errorMessage: error?.message || error,
        errorStack: error?.stack,
        errorType: typeof error,
        errorKeys: error ? Object.keys(error) : [],
      })
      return response.status(500).json({
        statusCode: 500,
        message: Messages.ERROR.REQUEST_FAILED,
      })
    } catch (handlerError: any) {
      // Last resort error handling
      console.error('CustomErrorHandler_CriticalError', { handlerError: handlerError?.message, originalError: error?.message })
      return response.status(500).json({
        statusCode: 500,
        message: Messages.ERROR.REQUEST_FAILED,
      })
    }
  }
}
