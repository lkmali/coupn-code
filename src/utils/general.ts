export function isNil(value: any): boolean {
  return value == null // Checks for null and undefined
}

/**
 * jsonParse
 *
 * @export
 * @param {any} data
 * @returns
 */
export function jsonParse(data: any): any {
  try {
    return JSON.parse(data)
  } catch (_error) {
    return data
  }
}

/**
 * jsonStringify
 * @export
 * @param {any} data
 * @returns
 */
export function jsonStringify(data: any): any {
  try {
    return JSON.stringify(data)
  } catch (_error) {
    return data
  }
}

export function getClientIp(request: any): string {
  const xff = String(
    request.ip ||
      request.headers['x-forwarded-for'] ||
      request.socket?.remoteAddress ||
      request.connection?.remoteAddress ||
      '',
  )

  let ip = Array.isArray(xff) ? xff[0] : xff?.split(',')[0].trim()

  // Normalize IPv6-mapped IPv4: ::ffff:x.x.x.x -> x.x.x.x
  if (ip && ip.startsWith('::ffff:')) {
    ip = ip.substring(7)
  }

  if (ip === '::1') {
    ip = '127.0.0.1'
  }

  return ip
}
