import {
  IWhatsAppTemplate,
  StoredTemplateComponent,
  StoredHeaderParameter,
  StoredBodyParameter,
  StoredButtonParameter,
  WireTemplateComponent,
  WireHeaderParameter,
  WireBodyParameter,
  WireButtonParameter,
} from '../typings/model'

export type TemplateVariables = Record<string, string | number | undefined>

// WhatsApp Cloud API rejects empty parameter strings. When a dynamic variable
// is missing/null/empty we fall back to this single-space placeholder so the
// send still goes through (admin sees the gap and can fix the data wiring),
// rather than throwing and losing the message entirely.
const DUMMY_PLACEHOLDER = ' '

function resolve(key: string, vars: TemplateVariables, missing: Set<string>): string {
  const v = vars[key]
  if (v === undefined || v === null || v === '') {
    missing.add(key)
    return DUMMY_PLACEHOLDER
  }
  return String(v)
}

function renderHeaderParam(
  p: StoredHeaderParameter,
  vars: TemplateVariables,
  missing: Set<string>,
): WireHeaderParameter {
  if (p.type === 'text') {
    const text = p.valueType === 'static' ? p.text : resolve(p.valueKey, vars, missing)
    return { type: 'text', text }
  }
  const link = p.valueType === 'static' ? p.link : resolve(p.valueKey, vars, missing)
  if (p.type === 'image') return { type: 'image', image: { link } }
  if (p.type === 'video') return { type: 'video', video: { link } }
  const doc: { link: string; filename?: string } = { link }
  if (p.valueType === 'static' && p.filename) doc.filename = p.filename
  return { type: 'document', document: doc }
}

function renderBodyParam(
  p: StoredBodyParameter,
  vars: TemplateVariables,
  missing: Set<string>,
): WireBodyParameter {
  const text = p.valueType === 'static' ? p.text : resolve(p.valueKey, vars, missing)
  return { type: 'text', text: text || DUMMY_PLACEHOLDER }
}

function renderButtonParam(
  p: StoredButtonParameter,
  vars: TemplateVariables,
  missing: Set<string>,
): WireButtonParameter {
  if (p.type === 'text') {
    const text = p.valueType === 'static' ? p.text : resolve(p.valueKey, vars, missing)
    return { type: 'text', text: text || DUMMY_PLACEHOLDER }
  }
  const payload = p.valueType === 'static' ? p.payload : resolve(p.valueKey, vars, missing)
  return { type: 'payload', payload: payload || DUMMY_PLACEHOLDER }
}

export interface RenderTemplateResult {
  components: WireTemplateComponent[]
  missingKeys: string[]
}

/**
 * Render stored template components → WhatsApp wire format. Permissive:
 * missing dynamic variables are replaced with a placeholder (returned via
 * `missingKeys` so callers can log/alert) rather than throwing.
 */
export function renderTemplateComponentsDetailed(
  components: StoredTemplateComponent[],
  variables: TemplateVariables,
): RenderTemplateResult {
  const missing = new Set<string>()
  const out = components.map<WireTemplateComponent>(c => {
    if (c.type === 'header') {
      return { type: 'header', parameters: c.parameters.map(p => renderHeaderParam(p, variables, missing)) }
    }
    if (c.type === 'body') {
      return { type: 'body', parameters: c.parameters.map(p => renderBodyParam(p, variables, missing)) }
    }
    return {
      type: 'button',
      sub_type: c.sub_type,
      index: c.index,
      parameters: c.parameters.map(p => renderButtonParam(p, variables, missing)),
    }
  })
  return { components: out, missingKeys: [...missing] }
}

/** Backwards-compat shim: returns just the rendered components. */
export function renderTemplateComponents(
  components: StoredTemplateComponent[],
  variables: TemplateVariables,
): WireTemplateComponent[] {
  return renderTemplateComponentsDetailed(components, variables).components
}

export function collectDynamicKeys(components: StoredTemplateComponent[]): string[] {
  const keys = new Set<string>()
  for (const c of components) {
    for (const p of c.parameters as Array<{ valueType: string; valueKey?: string }>) {
      if (p.valueType === 'dynamic' && p.valueKey) keys.add(p.valueKey)
    }
  }
  return [...keys]
}

/**
 * Extract resolved button labels (for persisting on SocialMessage.buttons:
 * string[]). Static text/payload pass through; dynamic ones look up the
 * `valueKey` in `variables`.
 */
export function extractButtonLabels(
  components: StoredTemplateComponent[] | undefined,
  variables: TemplateVariables,
): string[] {
  if (!components || components.length === 0) return []
  const labels: string[] = []
  for (const c of components) {
    if (c.type !== 'button') continue
    for (const p of c.parameters) {
      let label = ''
      if (p.valueType === 'static') {
        label = p.type === 'payload' ? p.payload : p.text
      } else {
        const v = variables[p.valueKey]
        if (v !== undefined && v !== null && v !== '') label = String(v)
      }
      if (label) labels.push(label)
    }
  }
  return labels
}

/**
 * Convert a legacy template definition (old fields: imageUrl, documents,
 * buttons[], plus a runtime bodyObject[]) into the new dynamic-component
 * shape. Used when a stored template hasn't been migrated to `components`
 * yet — lets every send go through the unified dynamic-template flow.
 *
 * Templates of type DR_APPOINTMENT_CONFIRMATION_MESSAGE historically used
 * URL-button parameters; everything else used quick_reply payloads. That
 * convention is preserved here.
 */
const URL_BUTTON_TEMPLATE_TYPES = new Set(['DR_APPOINTMENT_CONFIRMATION_MESSAGE'])

export function buildLegacyComponents(
  template: IWhatsAppTemplate,
  bodyObject?: string[],
  buttons?: string[],
  headerImageUrl?: string,
): StoredTemplateComponent[] {
  const components: StoredTemplateComponent[] = []

  // ---- Header ----
  const headerDoc = template.documents?.headers?.[0]
  if (headerDoc) {
    // WhatsApp does not allow `audio` in template headers — fall back to document
    const mediaType = (headerDoc.type === 'audio' ? 'document' : headerDoc.type) as 'image' | 'video' | 'document'
    components.push({
      type: 'header',
      parameters: [
        { type: mediaType, valueType: 'static', link: headerDoc.link } as StoredHeaderParameter,
      ],
    })
  } else {
    const link = headerImageUrl || template.imageUrl
    if (link) {
      components.push({
        type: 'header',
        parameters: [
          { type: 'image', valueType: 'static', link } as StoredHeaderParameter,
        ],
      })
    }
  }

  // ---- Body ----
  if (bodyObject && bodyObject.length > 0) {
    components.push({
      type: 'body',
      parameters: bodyObject.map<StoredBodyParameter>(text => ({
        type: 'text',
        valueType: 'static',
        text: text && text.length > 0 ? text : DUMMY_PLACEHOLDER,
      })),
    })
  }

  // ---- Buttons ----
  if (buttons && buttons.length > 0) {
    const useUrl = URL_BUTTON_TEMPLATE_TYPES.has(template.type)
    buttons.forEach((btn, index) => {
      const value = btn && btn.length > 0 ? btn : DUMMY_PLACEHOLDER
      const param: StoredButtonParameter = useUrl
        ? { type: 'text', valueType: 'static', text: value }
        : { type: 'payload', valueType: 'static', payload: value }
      components.push({
        type: 'button',
        sub_type: useUrl ? 'url' : 'quick_reply',
        index: index.toString(),
        parameters: [param],
      })
    })
  }

  return components
}

/**
 * Build a comprehensive `TemplateVariables` map covering every dynamic key
 * the platform supports (see `templateDynamicKeys.ts`). Callers pass whatever
 * data they have; missing inputs simply yield empty strings, which the
 * renderer will replace with the dummy placeholder. This lets admins use any
 * known key in any template type and have it resolve when data is available.
 */
export interface BuildTemplateVariablesInput {
  userInfo?: {
    username?: string
    mobileNumber?: string
    leadId?: string | number | { toString(): string }
    others?: string
  }
  appointment?: {
    startDate?: Date | string
    appointmentType?: string
    status?: string
    leadId?: string | number | { toString(): string }
    meetingLink?: string
  }
  orgAddress?: string
  status?: string
  insuranceProvider?: string
  formattedAppointmentDate?: string
  formattedAppointmentTime?: string
  extras?: Record<string, string | number>
}

export function buildTemplateVariables(input: BuildTemplateVariablesInput): Record<string, string | number> {
  const { userInfo, appointment, status, insuranceProvider, formattedAppointmentDate, formattedAppointmentTime, extras } = input

  const leadId =
    (appointment?.leadId !== undefined && appointment.leadId !== null && String(appointment.leadId)) ||
    (userInfo?.leadId !== undefined && userInfo.leadId !== null && String(userInfo.leadId)) ||
    ''

  let appointmentDate = formattedAppointmentDate ?? ''
  let appointmentTime = formattedAppointmentTime ?? ''
  if (appointment?.startDate && (!appointmentDate || !appointmentTime)) {
    const d = appointment.startDate instanceof Date ? appointment.startDate : new Date(appointment.startDate)
    if (!isNaN(d.getTime())) {
      if (!appointmentDate) appointmentDate = d.toISOString().slice(0, 10)
      if (!appointmentTime) {
        const hh = String(d.getUTCHours()).padStart(2, '0')
        const mm = String(d.getUTCMinutes()).padStart(2, '0')
        appointmentTime = `${hh}:${mm}`
      }
    }
  }

  const vars: Record<string, string | number> = {
    leadName: userInfo?.username ?? '',
    mobileNumber: userInfo?.mobileNumber ?? '',
    actionStatus: status ?? '',
    appointmentStatus: appointment?.status ?? '',
    appointmentType: appointment?.appointmentType ?? '',
    appointmentDate,
    appointmentTime,
    leadId,
    insuranceProvider: insuranceProvider ?? userInfo?.others ?? '',
    name: userInfo?.username ?? '',
    meetingLink: appointment?.meetingLink ?? '',
  }

  if (extras) {
    for (const [k, v] of Object.entries(extras)) {
      if (v !== undefined && v !== null) vars[k] = v
    }
  }

  return vars
}

/**
 * Resolve the components to send for a templated message. Always returns a
 * non-empty list so the dynamic sender doesn't reject the send:
 *   1. If the template has stored `components`, use them.
 *   2. Else build them from legacy fields (bodyObject / buttons / headerImageUrl).
 *   3. Else fall back to a single placeholder body parameter.
 */
export function resolveTemplateComponents(
  template: IWhatsAppTemplate,
  bodyObject?: string[],
  buttons?: string[],
  headerImageUrl?: string,
): StoredTemplateComponent[] {
  if (template.components && template.components.length > 0) {
    return template.components
  }
  const legacy = buildLegacyComponents(template, bodyObject, buttons, headerImageUrl)
  if (legacy.length > 0) return legacy
  return [
    {
      type: 'body',
      parameters: [{ type: 'text', valueType: 'static', text: DUMMY_PLACEHOLDER } as StoredBodyParameter],
    },
  ]
}
