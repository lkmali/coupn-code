import createError from 'http-errors'
/**
 * BadRequest
 *
 * @export
 * @param {string} message
 * @returns {Error}
 */
export function badRequest(message: string): {
  statusCode: number
  error: Error
} {
  return { error: createError(400, message), statusCode: 400 }
}

/**
 * notFoundData
 *
 * @export
 * @param {string} message
 * @returns {Error}
 */
export function notFoundData(message: string): {
  statusCode: number
  error: Error
} {
  return { error: createError(404, message), statusCode: 404 }
}

/**
 * Unauthorized
 *
 * @export
 * @param {string} message
 * @returns {Error}
 */
export function unauthorized(message: string): {
  statusCode: number
  error: Error
} {
  return { error: createError(401, message), statusCode: 401 }
}

/**
 * internalError
 *
 * @export
 * @param {string} message
 * @returns {Error}
 */
export function internalError(message: string): {
  statusCode: number
  error: Error
} {
  return { error: createError(500, message), statusCode: 500 }
}

/**
 * custom error
 *
 * @export
 * @param {string} message
 * @returns {Error}
 */
// export function systemError(error: any, message?: string): { statusCode: number; error: Error } {
//   if (error.error) {
//     return error
//   }
//   return {
//     error: createError(500, error.message ?? message ?? 'some technical error Our team is looking into it'),
//     statusCode: 500,
//   }
// }

/**
 * custom error
 *
 * @export
 * @param {string} message
 * @returns {Error}
 */
export function getProperErrorMessage(error: any): string {
  if (error.message) {
    return error.message
  } else if (error.error && error.error.message) {
    return error.error.message
  } else {
    return 'some technical error occer'
  }
}

export function prepareErrorMessage(error: any): string {
  let message = 'Something went wrong while processing your request'
  if (error.message) {
    message = error.message
  } else if (error.error && error.error.message) {
    message = error.error.message
  }

  const html = `<div style="padding:10px; border:1px solid #fca5a5; border-radius:8px; background:#fee2e2; color:#991b1b;">
  <strong>⚠️ ${message} .<br/>
  <small>Please try again later or contact support.</small>
</div>`

  return html
}

export function prepareErrorMessageForAgents(error: any): string {
  let message = 'Something went wrong while processing your request'
  if (error.message && Array.isArray(error.message)) {
    message = error.message.join(',')
  } else if (error.message) {
    message = error.message
  } else if (error.error && error.error.message) {
    message = error.error.message
  }
  return message
}
