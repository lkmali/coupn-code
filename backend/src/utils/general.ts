import { IncomingHttpHeaders } from 'http'
import { Request } from 'express'
import { getMetadataArgsStorage } from 'routing-controllers'
import { DoctorService, PatientService, UserService } from '../service'
import { getMongoSearchQuery } from './mongoOperator'
import { badRequest, unauthorized } from './errorCode'
import { format } from 'date-fns'
import crypto from 'crypto'
import {
  GetDoctorArg,
  GetPatientArg,
  GetUserArg,
  IAppointments,
  InstagramWebhook,
  ISocialContract,
  ISocialMessage,
  MediaTypeEnum,
  MessageDirection,
  ParseSocialType,
  SocialMediaType,
  WhatsAppBusinessAccount,
} from '../typings'
import { envConfig } from '../config'
import TimezoneUtil from './timezone.util'
import { Messages } from '../constants'
import axios from 'axios'
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

export async function resolvePatientId({ patientId, patientName }: GetPatientArg, orgId: string) {
  if (patientId) return patientId

  if (patientName) {
    const list = await PatientService.Instance.getPatient({ orgId, ...getMongoSearchQuery(patientName, ['name']) })
    if (list.length <= 0) throw { message: Messages.ERROR.NO_PATIENT_FOUND }
    if (list.length > 1) {
      throw { message: Messages.ERROR.MULTIPLE_PATIENTS_FOUND, list }
    }
    return list[0].patientId
  }
  throw badRequest(Messages.ERROR.EITHER_PATIENT_ID_OR_NAME)
}

export const resolveDoctorId = async ({ doctorId, doctorName }: GetDoctorArg, orgId: string) => {
  if (doctorId) return doctorId
  if (doctorName) {
    const list = await DoctorService.Instance.listDoctors({ orgId, ...getMongoSearchQuery(doctorName, ['name']) })
    if (list.length <= 0) throw { message: Messages.ERROR.NO_DOCTOR_FOUND }

    if (list.length > 1) {
      throw { message: Messages.ERROR.MULTIPLE_DOCTORS_FOUND, list }
    }
    return list[0].doctorId
  }
  throw badRequest(Messages.ERROR.EITHER_DOCTOR_ID_OR_NAME)
}

export const resolveUserId = async ({ userId, userName }: GetUserArg, orgId: string) => {
  if (userId) return userId
  if (userName) {
    const list = await UserService.Instance.getUser({ orgId, ...getMongoSearchQuery(userName, ['userName']) })
    if (list.length <= 0) throw { message: Messages.ERROR.USER_NOT_FOUND }
    return list[0].userId
  }
  throw badRequest(Messages.ERROR.EITHER_USER_ID_OR_NAME)
}

export function formatAppointmentDate(isoDate: string) {
  return format(new Date(isoDate), "MMMM d, yyyy 'at' h:mm a")
}

export function transformToMCPContent(data: any) {
  if (data === null || data === undefined) {
    return [{ type: 'object', text: { message: Messages.ERROR.NO_DATA_FOUND } }]
  }

  // If it's already a string or number → text
  if (typeof data === 'string' || typeof data === 'number') {
    return [{ type: 'text', text: String(data) }]
  }

  // If it's structured data → json
  if (typeof data === 'object') {
    return [{ type: 'json', json: data }]
  }

  // Fallback
  return [{ type: 'text', text: JSON.stringify(data) }]
}

/**
 * Generate client credentials
 * @returns { clientKey: string, clientSecret: string }
 */
export function generateClientCredentials() {
  // clientKey: shorter, like a public identifier
  const clientKey = `ck_${crypto.randomBytes(8).toString('hex')}`

  // clientSecret: longer, more secure
  const clientSecret = `cs_${crypto.randomBytes(10).toString('hex')}`

  return { clientKey, clientSecret }
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

export function verifySignatureMiddleware(appSecret: string, signature: string, rawBody: any) {
  const expectedHash = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody, 'utf-8').digest('hex')
  const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHash))
  return isValid
}

export function getStartEndDate(appointmentDate: string) {
  // Convert the input date to a Date object
  const startDate = new Date(appointmentDate)

  // Create endDate by cloning startDate
  const endDate = new Date(startDate)
  endDate.setMinutes(endDate.getMinutes() + envConfig.SLOT_DEFAULT_DURATION)

  // Convert both to UTC equivalents
  const startDateUTC = new Date(startDate.toISOString())
  const endDateUTC = new Date(endDate.toISOString())

  return { startDate: startDateUTC, endDate: endDateUTC }
}

/**
 * Convert appointment dates from UTC to IST
 * Converts startDate and endDate fields from UTC to Asia/Kolkata timezone
 *
 * @param appointment - Single appointment object or array of appointments
 * @returns Appointment(s) with dates converted to IST
 */
export function convertAppointmentDatesToIST(
  appointment: IAppointments | IAppointments[],
): IAppointments | IAppointments[] | null {
  if (!appointment) return null

  const convertSingleAppointment = (appointment: IAppointments): IAppointments => {
    if (appointment.startDate) {
      const utcDate = TimezoneUtil.formatInTimezone(appointment.startDate, 'Asia/Kolkata', 'YYYY-MM-DD HH:mm:ssZ')
      appointment.startDate = utcDate as any
    }

    if (appointment.endDate) {
      const utcDate = TimezoneUtil.formatInTimezone(appointment.endDate, 'Asia/Kolkata', 'YYYY-MM-DD HH:mm:ssZ')
      appointment.endDate = utcDate as any
    }
    return appointment
  }
  if (Array.isArray(appointment)) {
    return appointment.map(convertSingleAppointment)
  }

  return convertSingleAppointment(appointment)
}

export function parseWhatsAppWebhook(payload: WhatsAppBusinessAccount): ParseSocialType {
  const result: ParseSocialType = {}

  const entry = payload?.entry?.[0]
  const changes = entry?.changes?.[0]?.value
  if (!changes?.messages) return result

  for (const msg of changes.messages) {
    const contactInfo = changes.contacts?.[0]
    // ✅ Normalized Contact
    const contact: Omit<ISocialContract, 'contactId' | 'createdAt' | 'orgId' | 'updatedAt' | 'isBlocked'> = {
      socialId: contactInfo.wa_id,
      name: contactInfo.profile?.name || '',
      mobileNumber: contactInfo.wa_id,
      socialType: SocialMediaType.WHATSAPP,
      phoneNumberId: changes.metadata?.phone_number_id??'',
      lastSeen: new Date(parseInt(msg.timestamp) * 1000),
    }
    if (!result[contactInfo.wa_id]) {
      result[contactInfo.wa_id] = {
        contact,
        message: [],
      }
    }

    // Extract referral data from ad click messages
    if (msg.referral) {
      result[contactInfo.wa_id].referral = msg.referral
    }

    // ✅ Normalized Message
    const message: Omit<ISocialMessage, '_id' | 'id' | 'messageId' | 'contactId' | 'orgId' | 'createdAt' | 'updatedAt'> = {
      whatsappMessageId: msg.id,
      direction: MessageDirection.INBOUND,
      socialType: SocialMediaType.WHATSAPP,
      type: msg.type,
      userType: 'webhook',
      timestamp: new Date(parseInt(msg.timestamp) * 1000),
    }

    //text,image,audio,video,document
    switch (msg.type) {
      case 'text':
        message.body = msg.text?.body
        break
      case 'image':
        message.body = msg.image?.caption
        message.mimeType = msg.image?.mime_type
        message.fileId = msg.image?.id
        break
      case 'audio':
        message.mimeType = msg.audio?.mime_type
        message.body = msg.image?.caption
        message.fileId = msg.audio?.id
        message.voice = msg.audio?.voice
        break
      case 'video':
        message.body = msg.image?.caption
        message.mimeType = msg.video?.mime_type
        message.fileId = msg.video?.id
        break
      case 'document':
        message.mimeType = msg.document?.mime_type
        message.fileId = msg.document?.id
        message.body = msg.image?.caption
        message.body = msg.document?.filename
        break
      case 'button':
        // Handle simple button clicks (quick reply buttons)
        message.type = MediaTypeEnum.text
        message.body = msg.button?.text || ''
        console.log('msg.button?.payload', msg.button?.payload)
        message.fileId = msg.button?.payload // Store button payload for processing
        if (msg.button?.payload && ['gujarati', 'hindi', 'english'].includes(msg.button.payload.toLowerCase())) {
          contact['language'] = msg.button.payload.toLocaleUpperCase()
        }
        break
      case 'interactive':
        // Handle interactive button replies
        if (msg.interactive?.button_reply) {
          message.type = MediaTypeEnum.text
          message.body = msg.interactive.button_reply.title
          message.fileId = msg.interactive.button_reply.id
        } else if (msg.interactive?.list_reply) {
          message.type = MediaTypeEnum.text
          message.body = msg.interactive.list_reply.title
          message.fileId = msg.interactive.list_reply.id
        } else {
          message.body = '[Interactive Message]'
        }
        break
      default:
        console.log('payload', JSON.stringify(payload))
        message.body = '[Unsupported Message Type]'
        break
    }

    result[contactInfo.wa_id].message.push(message)
  }

  return result
}

export function parseInstagramWebhook(payload: InstagramWebhook): ParseSocialType {
  const result: ParseSocialType = {}

  const entry = payload?.entry?.[0]
  const messagingEvents = entry?.messaging || []

  for (const event of messagingEvents) {
    const senderId = event.sender?.id
    if (!senderId) continue

    // ✅ Normalized Contact
    const contact: Omit<ISocialContract, 'contactId' | 'createdAt' | 'orgId' | 'updatedAt' | 'isBlocked'> = {
      socialId: senderId,
      name: '',
      mobileNumber: '',
      socialType: SocialMediaType.INSTAGRAM,
      lastSeen: new Date(parseInt(event.timestamp) * 1000),
    }

    if (!result[senderId]) {
      result[senderId] = {
        contact,
        message: [],
      }
    }

    // ✅ Normalized Message
    const igMsg = event.message
    const message: Omit<ISocialMessage, '_id' | 'id' | 'messageId' | 'contactId' | 'orgId' | 'createdAt' | 'updatedAt'> = {
      whatsappMessageId: igMsg.mid,
      direction: MessageDirection.INBOUND,
      socialType: SocialMediaType.INSTAGRAM,
      type: MediaTypeEnum.text,
      userType: 'webhook',
      timestamp: new Date(parseInt(event.timestamp) * 1000),
    }

    // ✅ Parse message content
    if (igMsg.text) {
      message.type = MediaTypeEnum.text
      message.body = igMsg.text
    } else if (igMsg.attachments?.length) {
      const attachment = igMsg.attachments[0]
      message.type = attachment.type
      message.bucketKey = attachment.payload.url
      message.fileId = extractAttachmentId(attachment.payload.url) // could store same as mediaUrl
      message.mimeType = guessMimeType(attachment.type)
    } else {
      message.type = MediaTypeEnum.unknown
      message.body = '[Unsupported Message Type]'
    }
    result[senderId].message.push(message)
  }

  return result
}

function extractAttachmentId(url: string) {
  try {
    const parsedUrl = new URL(url)
    const assetId = parsedUrl.searchParams.get('asset_id')
    return assetId || ''
  } catch (e) {
    console.error('Invalid media URL:', url)
    return ''
  }
}

// ✅ Optional helper to guess MIME type
function guessMimeType(type: string): string | undefined {
  switch (type) {
    case 'audio':
      return 'audio/mpeg'
    case 'video':
      return 'video/mp4'
    case 'image':
      return 'image/jpeg'
    default:
      return undefined
  }
}

export function generateOrgShortName(orgName: string): string {
  const trimmedName = orgName.trim()
  const wordsToExclude = ['and', 'the', 'of', 'in', 'at', 'for', 'with', '&']

  const words = trimmedName
    .split(/\s+/)
    .filter(word => word.length > 0)
    .filter(word => !wordsToExclude.includes(word.toLowerCase()))

  if (words.length === 1) {
    const word = words[0]
    if (word.length <= 5) {
      return word.toUpperCase()
    }
    return word.substring(0, 4).toUpperCase()
  }

  return words.map(word => word.charAt(0).toUpperCase()).join('')
}

/**
 * Converts text to sentence case: first letter capitalized, rest lowercase
 * @param text - The text to convert
 * @returns Sentence case text
 */
export function toPascalCase(text: string | undefined | null): string {
  if (!text || text.trim() === '') return ''

  // Clean the text
  const cleaned = text
    .replace(/\bundefined\b/gi, '') // remove accidental "undefined"
    .replace(/[_-]/g, ' ') // convert _ and -
    .replace(/\s+/g, ' ') // collapse spaces
    .trim()

  return cleaned
    .split(' ')
    .map(word => {
      // If the word contains a dot pattern like "M.L.A" → keep as-is
      if (/^[A-Za-z](\.[A-Za-z])+\.?$/.test(word)) {
        return word
      }

      // Normal Title Case for other words
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

/**
 * Converts text to sentence case: first letter capitalized, rest lowercase
 * @param text - The text to convert
 * @returns Sentence case text
 */
export function toSentenceCase(text: string | undefined | null): string {
  if (!text || text.trim() === '') return ''
  const trimmed = (text ?? '')
    .toString()
    .replace(/\bundefined\b/gi, '') // remove the word "undefined"
    .trim()
    .replace(/[_-]/g, ' ') // replace _ and - with spaces
    .replace(/\s+/g, ' ') // collapse multiple spaces

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

/**
 * Joins multiple text parts into a sentence, filtering out undefined/null/empty values
 * Useful for building dynamic sentences from potentially undefined fields
 *
 * @param parts - Array of text parts that may contain undefined/null values
 * @param separator - Separator to use between parts (default: ' ')
 * @returns Clean sentence with undefined values removed
 *
 * @example
 * joinSentence(['Hello', undefined, 'world']) // returns 'Hello world'
 * joinSentence(['Send reminder', undefined, 'for appointment'], ' ') // returns 'Send reminder for appointment'
 */
export function joinSentence(parts: (string | undefined | null)[], separator: string = ' '): string {
  return parts
    .filter(part => part !== undefined && part !== null && String(part).trim() !== '' && String(part) !== 'undefined')
    .map(part => String(part).trim())
    .join(separator)
}

/**
 * Joins multiple text parts into a sentence, filtering out undefined/null/empty values
 * Useful for building dynamic sentences from potentially undefined fields
 *
 * @param parts - Array of text parts that may contain undefined/null values
 * @param separator - Separator to use between parts (default: ' ')
 * @returns Clean sentence with undefined values removed
 *
 * @example
 * joinSentence(['Hello', undefined, 'world']) // returns 'Hello world'
 * joinSentence(['Send reminder', undefined, 'for appointment'], ' ') // returns 'Send reminder for appointment'
 */
export function getMobileWithCountryCode(mobileNumber: string): string {
  if (mobileNumber.length === 10) {
    return `91${mobileNumber}`
  }
  return mobileNumber
}



export function formatAIMessage(result: any): { message: string; buttons: string[] } {
  let output = result
  if (Array.isArray(result) && result.length > 0) {
    output = result[0]
  } else if (Array.isArray(result.output) && result.output.length > 0) {
    return {
      message: '',
      buttons: [],
    }
  }
  return {
    message: output?.output ?? '',
    buttons: output.buttons || [],
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

/**
 * jsonParse
 *
 * @export
 * @param {any} data
 * @returns
 */
export function formatRedisData(data: any): string | any | null {
  try {
    if (!data) {
      return null
    }
    if (typeof data === undefined) {
      return null
    }
    if (typeof data == 'object') {
      return data
    }
    if (typeof data !== 'string') {
      return null
    }
    return JSON.parse(data)
  } catch (_error) {
    return data
  }
}

export async function checkUrlIsPublic(url: string): Promise<'PUBLIC' | 'PRIVATE'> {
  try {
    const res = await axios.head(url, {
      timeout: 5000,
      validateStatus: () => true, // prevent throwing on 4xx/5xx
    })
    return res.status === 200 ? 'PUBLIC' : 'PRIVATE'
  } catch (error) {
    return 'PRIVATE'
  }
}
