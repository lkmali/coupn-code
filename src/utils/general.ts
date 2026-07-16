import { IncomingHttpHeaders } from 'http'
import { Request } from 'express'
import { getMetadataArgsStorage } from 'routing-controllers'
import {  unauthorized } from './errorCode'

import { Messages } from '../constants'
export function isEmpty(value: any): boolean {
  if (value == null) return true // Checks for null and undefined

  if (typeof value === 'string' || Array.isArray(value)) return value.length === 0

  if (typeof value === 'object') return Object.keys(value).length === 0

  return false
}

export function isNil(value: any): boolean {
  return value == null // Checks for null and undefined
}

/**
 * Remove keys from object where value is 0, empty string, null, or undefined
 * Useful for cleaning up query objects and request bodies before validation
 *
 * @export
 * @param {Record<string, any>} obj - The object to clean
 * @returns {Record<string, any>} - New object without keys that have invalid values
 */
export function removeZeroValues<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: any = {}
  for (const key in obj) {
    const value = obj[key]
    // Keep the value if it's NOT: 0, empty string, null, or undefined
    if (value !== 0 && value !== '' && value !== null && value !== undefined) {
      result[key] = value
    }
  }
  return result
}

export function omit<T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj }
  keys.forEach(key => delete result[key])
  return result
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

export function convertToMinorUnits(amount: string) {
  return (parseFloat(amount) * 100).toFixed(0)
}

/**
 * Generates a random OTP for use
 *
 * @param length length of the OTP to generate
 *
 * @returns string
 */
export function generateRandomOTP(length: number): string {
  const randomValue = []
  for (let i = 0; i < length; i++) randomValue.push(Math.floor(Math.random() * 10))

  return randomValue.join('')
}

/**
 * Generates a random OTP for use
 *
 * @param length length of the OTP to generate
 *
 * @returns string
 */
export function getHeaders(name: string, headers: IncomingHttpHeaders): string {
  const value = headers[name.toLowerCase()]
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  return value || ''
}

/**
 * Generates a random OTP for use
 *
 * @param length length of the OTP to generate
 *
 * @returns string
 */
export function getDeviceInformation(headers: IncomingHttpHeaders): any {
  const field = ['latitude', 'longitude', 'deviceName', 'deviceType', 'deviceId', 'version', 'location']
  const deviceInfo: any = {}

  field.forEach(key => {
    if (getHeaders(key, headers)) {
      deviceInfo[key] = getHeaders(key, headers)
    }
  })
  return deviceInfo
}

export function findAction(req: Request) {
  const { method, url } = req
  const actions = getMetadataArgsStorage().actions

  return actions.find(action => {
    // Get controller prefix
    const controller = getMetadataArgsStorage().controllers.find(ctrl => ctrl.target === action.target)
    const controllerPrefix = controller?.route || ''
    // Full route (without global prefix)
    const fullPath = `${controllerPrefix}${action.route}`

    const pathname = new URL(url, 'http://localhost').pathname

    // 2. Build regex from fullPath (with dynamic :params)
    const regex = new RegExp('^' + fullPath.replace(/:[^/]+/g, '[^/]+') + '$')
    // 3. Match route + method
    return regex.test(pathname.replace(/^\/api/, '')) && action.type === method.toLowerCase()
  })
}

/**
 * pagination
 *
 * @export
 * @param {Filter<any>} filter
 * @returns {Filter<any>}
 */
export function paginate(filter: any = {}): { limit: number; skip: number; sort?: Record<string, 1 | -1> } {
  const limit = !isNil(filter.limit) ? Number(filter.limit) : 25
  let skip = Number(filter.skip??0)
  // Prioritize pageNumber over skip
  if (!isNil(filter.pageNumber) && filter.pageNumber > 0) {
    const pageNumber = Number(filter.pageNumber)
    skip = pageNumber > 0 ? (pageNumber - 1) * limit : 0
  }

  const result = !isNil(filter.sortBy) && !isNil(filter.orderBy)
    ? { limit, skip, sort: { [filter.sortBy]: filter.orderBy.toUpperCase() === 'ASC' ? 1 : -1 } as Record<string, 1 | -1> }
    : { limit, skip }


  return result
}

/**
 * pagination
 *
 * @export
 * @param {Filter<any>} filter
 * @returns {Filter<any>}
 */
export function sorting(sortBy: string, orderBy: string): { sort: Record<string, 1 | -1> } {
  return { sort: { [sortBy]: orderBy.toUpperCase() === 'ASC' ? 1 : -1 } as Record<string, 1 | -1> }
}

/**
 * pagination
 *
 * @export
 * @param {Filter<any>} filter
 * @returns {Filter<any>}
 */
export function getPaginateData<T>(totalRecord:number,pageNumber:number, data: T[]): { count: number; data: T[],totalRecord:number,pageNumber:number } {
  const count = data.length
  return { count, data,totalRecord,pageNumber }
}




export function extractCredentials(request: Request): string {
  switch (true) {
    case request.headers.authorization === undefined:
      throw unauthorized(Messages.ERROR.AUTH_HEADER_NOT_FOUND)
    default:
      return String(request.headers.authorization).trim().split(' ')[1]
  }
}

export function extractCredentialsFromHeaders(headers: any): string {
  switch (true) {
    case headers.authorization === undefined:
      throw unauthorized(Messages.ERROR.AUTH_HEADER_NOT_FOUND)
    default:
      return String(headers.authorization).trim().split(' ')[1]
  }
}

export function getClientIp(request: any): string {
  // 1. Try x-forwarded-for (may contain multiple IPs: client, proxy1, proxy2...)
  const xff = String(
    request.ip ||
      request.headers['x-forwarded-for'] ||
      request.socket.remoteAddress ||
      request.socket?.remoteAddress ||
      request.connection?.remoteAddress ||
      '',
  )

  let ip = Array.isArray(xff) ? xff[0] : xff?.split(',')[0].trim()

  // 3. Normalize IPv6-mapped IPv4: ::ffff:x.x.x.x -> x.x.x.x
  if (ip && ip.startsWith('::ffff:')) {
    ip = ip.substring(7) // remove "::ffff:"
  }

  // 4. Normalize localhost IPv6 ::1 -> 127.0.0.1 (if needed)
  if (ip === '::1') {
    ip = '127.0.0.1'
  }

  return ip
}


