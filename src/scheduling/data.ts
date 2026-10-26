import { supabase } from '../lib/supabase'

export const appointmentStatuses = ['scheduled', 'confirmed', 'rescheduling_required', 'cancelled', 'completed', 'no_show'] as const

export type AppointmentType = string
export type AppointmentVenue = string
export type AppointmentStatus = (typeof appointmentStatuses)[number]

export type AppointmentTypeOption = {
  id: string
  name: AppointmentType
  online_eligible: boolean
  display_order: number
  is_default: boolean
}

export type AppointmentVenueOption = {
  id: string
  name: AppointmentVenue
  is_online: boolean
  display_order: number
  is_default: boolean
}

export type AppointmentOptions = {
  types: AppointmentTypeOption[]
  venues: AppointmentVenueOption[]
}

export type Appointment = {
  id: string
  appointment_reference: string
  client_first_name: string
  client_last_name: string
  client_email: string | null
  client_phone: string | null
  appointment_type: AppointmentType
  venue: AppointmentVenue
  start_at: string
  duration_minutes: number
  timezone: string
  status: AppointmentStatus
  internal_notes: string | null
  client_instructions: string | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
}

export type AppointmentInput = Omit<Appointment, 'id' | 'appointment_reference' | 'created_at' | 'updated_at'> & {
  id?: string
}

export type AppointmentBlock = {
  id: string
  title: string
  scope: 'all_venues' | 'venue'
  venue: AppointmentVenue | null
  start_at: string
  end_at: string
  is_all_day: boolean
  reason: string | null
  created_at: string
}

export type SchedulingSettings = {
  timezone: string
  default_duration_minutes: number
  advance_booking_days: number
  working_hours: Record<string, { start: string; end: string }>
  public_booking_enabled: boolean
  google_calendar_enabled: boolean
  email_notifications_enabled: boolean
}

export type SchedulingAuditEntry = {
  id: number
  action: string
  actor_id: string | null
  previous_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  created_at: string
}

export type PublicSchedulingInfo = Pick<SchedulingSettings, 'timezone' | 'advance_booking_days' | 'default_duration_minutes' | 'public_booking_enabled'>

export type PublicAppointmentSlot = {
  slot_start: string
  duration_minutes: number
  timezone: string
}

export type PublicAppointmentInput = {
  client_first_name: string
  client_last_name: string
  client_email: string | null
  client_phone: string | null
  appointment_type: AppointmentType
  venue: AppointmentVenue
  start_at: string
}

function requireSupabase() {
  if (!supabase) throw new Error('Scheduling is not configured. Set the Supabase browser URL and publishable key.')
  return supabase
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseAppointment(value: unknown): Appointment {
  const status = isRecord(value) ? appointmentStatuses.find((item) => item === value.status) : undefined
  if (
    !isRecord(value)
    || typeof value.id !== 'string'
    || typeof value.appointment_reference !== 'string'
    || typeof value.client_first_name !== 'string'
    || typeof value.client_last_name !== 'string'
    || typeof value.appointment_type !== 'string'
    || !value.appointment_type.trim()
    || typeof value.venue !== 'string'
    || !value.venue.trim()
    || typeof value.start_at !== 'string'
    || typeof value.duration_minutes !== 'number'
    || typeof value.timezone !== 'string'
    || !status
    || (typeof value.client_email !== 'string' && value.client_email !== null)
    || (typeof value.client_phone !== 'string' && value.client_phone !== null)
    || (typeof value.internal_notes !== 'string' && value.internal_notes !== null)
    || (typeof value.client_instructions !== 'string' && value.client_instructions !== null)
    || (typeof value.cancellation_reason !== 'string' && value.cancellation_reason !== null)
    || typeof value.created_at !== 'string'
    || typeof value.updated_at !== 'string'
  ) {
    throw new Error('Scheduling returned an appointment with an unexpected shape.')
  }
  return {
    id: value.id,
    appointment_reference: value.appointment_reference,
    client_first_name: value.client_first_name,
    client_last_name: value.client_last_name,
    client_email: value.client_email,
    client_phone: value.client_phone,
    appointment_type: value.appointment_type,
    venue: value.venue,
    start_at: value.start_at,
    duration_minutes: value.duration_minutes,
    timezone: value.timezone,
    status,
    internal_notes: value.internal_notes,
    client_instructions: value.client_instructions,
    cancellation_reason: value.cancellation_reason,
    created_at: value.created_at,
    updated_at: value.updated_at,
  }
}

function parseAppointmentList(value: unknown): Appointment[] {
  if (!Array.isArray(value)) throw new Error('Scheduling returned data in an unexpected shape.')
  return value.map(parseAppointment)
}

export async function listAppointments(startAt: string, endAt: string) {
  const { data, error } = await requireSupabase()
    .from('appointments')
    .select('*')
    .lt('start_at', endAt)
    .gte('start_at', startAt)
    .order('start_at', { ascending: true })
  if (error) throw error
  return parseAppointmentList(data)
}

export async function getAppointment(id: string) {
  const { data, error } = await requireSupabase().from('appointments').select('*').eq('id', id).single()
  if (error) throw error
  return parseAppointment(data)
}

export async function saveAppointment(input: AppointmentInput) {
  const { id, ...values } = input
  const client = requireSupabase()
  const query = id
    ? client.from('appointments').update(values).eq('id', id)
    : client.from('appointments').insert(values)
  const { data, error } = await query.select('*').single()
  if (error) {
    if (error.code === '23P01') throw new Error(error.message.includes('blocked period')
      ? error.message
      : 'That venue already has an appointment during this time. Choose another time.')
    throw error
  }
  return parseAppointment(data)
}

export async function listAppointmentBlocks(startAt?: string, endAt?: string) {
  let query = requireSupabase().from('appointment_blocks').select('*').order('start_at', { ascending: true })
  if (startAt) query = query.gte('end_at', startAt)
  if (endAt) query = query.lt('start_at', endAt)
  const { data, error } = await query
  if (error) throw error
  if (!Array.isArray(data)) throw new Error('Scheduling returned blocked periods in an unexpected shape.')
  return data.map(parseAppointmentBlock)
}

function parseAppointmentBlock(value: unknown): AppointmentBlock {
  const venue = isRecord(value) ? value.venue : undefined
  if (
    !isRecord(value)
    || typeof value.id !== 'string'
    || typeof value.title !== 'string'
    || (value.scope !== 'all_venues' && value.scope !== 'venue')
    || (typeof venue !== 'string' && venue !== null)
    || typeof value.start_at !== 'string'
    || typeof value.end_at !== 'string'
    || typeof value.is_all_day !== 'boolean'
    || (typeof value.reason !== 'string' && value.reason !== null)
    || typeof value.created_at !== 'string'
  ) {
    throw new Error('Scheduling returned a blocked period with an unexpected shape.')
  }
  return {
    id: value.id,
    title: value.title,
    scope: value.scope,
    venue,
    start_at: value.start_at,
    end_at: value.end_at,
    is_all_day: value.is_all_day,
    reason: value.reason,
    created_at: value.created_at,
  }
}

export async function saveAppointmentBlock(input: Omit<AppointmentBlock, 'id' | 'created_at'>) {
  const { data, error } = await requireSupabase().from('appointment_blocks').insert(input).select('*').single()
  if (error) throw error
  return parseAppointmentBlock(data)
}

export async function deleteAppointmentBlock(id: string) {
  const { error } = await requireSupabase().from('appointment_blocks').delete().eq('id', id)
  if (error) throw error
}

function parseAppointmentTypeOption(value: unknown): AppointmentTypeOption {
  if (
    !isRecord(value)
    || typeof value.id !== 'string'
    || typeof value.name !== 'string'
    || !value.name.trim()
    || typeof value.online_eligible !== 'boolean'
    || typeof value.display_order !== 'number'
    || typeof value.is_default !== 'boolean'
  ) {
    throw new Error('Scheduling returned an appointment type with an unexpected shape.')
  }
  return {
    id: value.id,
    name: value.name,
    online_eligible: value.online_eligible,
    display_order: value.display_order,
    is_default: value.is_default,
  }
}

function parseAppointmentVenueOption(value: unknown): AppointmentVenueOption {
  if (
    !isRecord(value)
    || typeof value.id !== 'string'
    || typeof value.name !== 'string'
    || !value.name.trim()
    || typeof value.is_online !== 'boolean'
    || typeof value.display_order !== 'number'
    || typeof value.is_default !== 'boolean'
  ) {
    throw new Error('Scheduling returned a venue with an unexpected shape.')
  }
  return {
    id: value.id,
    name: value.name,
    is_online: value.is_online,
    display_order: value.display_order,
    is_default: value.is_default,
  }
}

export async function getAppointmentOptions(): Promise<AppointmentOptions> {
  const client = requireSupabase()
  const [typesResult, venuesResult] = await Promise.all([
    client.from('scheduling_appointment_types').select('id, name, online_eligible, display_order, is_default').order('display_order').order('created_at'),
    client.from('scheduling_venues').select('id, name, is_online, display_order, is_default').order('display_order').order('created_at'),
  ])
  if (typesResult.error) throw typesResult.error
  if (venuesResult.error) throw venuesResult.error
  if (!Array.isArray(typesResult.data) || !Array.isArray(venuesResult.data)) {
    throw new Error('Scheduling returned appointment options in an unexpected shape.')
  }
  return {
    types: typesResult.data.map(parseAppointmentTypeOption),
    venues: venuesResult.data.map(parseAppointmentVenueOption),
  }
}

export async function saveAppointmentType(input: { id?: string; name: string; online_eligible: boolean }) {
  const client = requireSupabase()
  const values = { name: input.name.trim(), online_eligible: input.online_eligible }
  const query = input.id
    ? client.from('scheduling_appointment_types').update(values).eq('id', input.id)
    : client.from('scheduling_appointment_types').insert(values)
  const { error } = await query
  if (error) throw error
}

export async function setDefaultAppointmentOption(kind: 'type' | 'venue', id: string) {
  const { error } = await requireSupabase().rpc('set_default_appointment_option', {
    p_option_kind: kind,
    p_option_id: id,
  })
  if (error) throw error
}

export async function reorderAppointmentOptions(kind: 'type' | 'venue', ids: string[]) {
  const { error } = await requireSupabase().rpc('reorder_appointment_options', {
    p_option_kind: kind,
    p_option_ids: ids,
  })
  if (error) throw error
}

export async function deleteAppointmentType(id: string) {
  const { error } = await requireSupabase().from('scheduling_appointment_types').delete().eq('id', id)
  if (error) throw error
}

export async function saveAppointmentVenue(input: { id?: string; name: string; is_online: boolean }) {
  const client = requireSupabase()
  const values = { name: input.name.trim(), is_online: input.is_online }
  const query = input.id
    ? client.from('scheduling_venues').update(values).eq('id', input.id)
    : client.from('scheduling_venues').insert(values)
  const { error } = await query
  if (error) throw error
}

export async function deleteAppointmentVenue(id: string) {
  const { error } = await requireSupabase().from('scheduling_venues').delete().eq('id', id)
  if (error) throw error
}

function parsePublicAppointmentOptions(value: unknown): AppointmentOptions {
  if (!isRecord(value) || !Array.isArray(value.types) || !Array.isArray(value.venues)) {
    throw new Error('Public scheduling returned appointment options in an unexpected shape.')
  }
  return {
    types: value.types.map((option) => {
      if (
        !isRecord(option)
        || typeof option.name !== 'string'
        || !option.name.trim()
        || typeof option.online_eligible !== 'boolean'
        || typeof option.display_order !== 'number'
        || typeof option.is_default !== 'boolean'
      ) {
        throw new Error('Public scheduling returned an appointment type in an unexpected shape.')
      }
      return {
        id: option.name,
        name: option.name,
        online_eligible: option.online_eligible,
        display_order: option.display_order,
        is_default: option.is_default,
      }
    }),
    venues: value.venues.map((option) => {
      if (
        !isRecord(option)
        || typeof option.name !== 'string'
        || !option.name.trim()
        || typeof option.is_online !== 'boolean'
        || typeof option.display_order !== 'number'
        || typeof option.is_default !== 'boolean'
      ) {
        throw new Error('Public scheduling returned a venue in an unexpected shape.')
      }
      return {
        id: option.name,
        name: option.name,
        is_online: option.is_online,
        display_order: option.display_order,
        is_default: option.is_default,
      }
    }),
  }
}

export async function getPublicAppointmentOptions(): Promise<AppointmentOptions> {
  const { data, error } = await requireSupabase().rpc('get_public_appointment_options')
  if (error) throw error
  if (!Array.isArray(data) || data.length !== 1) throw new Error('Public appointment options are not available yet.')
  return parsePublicAppointmentOptions(data[0])
}

export async function getSchedulingSettings() {
  const { data, error } = await requireSupabase().from('scheduling_settings').select('*').eq('id', true).single()
  if (error) throw error
  if (
    !isRecord(data)
    || typeof data.timezone !== 'string'
    || typeof data.default_duration_minutes !== 'number'
    || typeof data.advance_booking_days !== 'number'
    || !isRecord(data.working_hours)
    || typeof data.public_booking_enabled !== 'boolean'
    || typeof data.google_calendar_enabled !== 'boolean'
    || typeof data.email_notifications_enabled !== 'boolean'
  ) {
    throw new Error('Scheduling settings have an unexpected shape.')
  }
  const workingHours = Object.fromEntries(Object.entries(data.working_hours).map(([weekday, hours]) => {
    if (!isRecord(hours) || typeof hours.start !== 'string' || typeof hours.end !== 'string') {
      throw new Error('Scheduling settings returned invalid working hours.')
    }
    return [weekday, { start: hours.start, end: hours.end }]
  }))
  return {
    timezone: data.timezone,
    default_duration_minutes: data.default_duration_minutes,
    advance_booking_days: data.advance_booking_days,
    working_hours: workingHours,
    public_booking_enabled: data.public_booking_enabled,
    google_calendar_enabled: data.google_calendar_enabled,
    email_notifications_enabled: data.email_notifications_enabled,
  }
}

export async function getPublicSchedulingInfo(): Promise<PublicSchedulingInfo> {
  const { data, error } = await requireSupabase().rpc('get_public_scheduling_info')
  if (error) throw error
  if (!Array.isArray(data) || data.length !== 1) throw new Error('Public scheduling is not available yet.')
  const info = data[0]
  if (
    !isRecord(info)
    || typeof info.timezone !== 'string'
    || typeof info.advance_booking_days !== 'number'
    || typeof info.default_duration_minutes !== 'number'
    || typeof info.booking_enabled !== 'boolean'
  ) {
    throw new Error('Public scheduling returned settings in an unexpected shape.')
  }
  return {
    timezone: info.timezone,
    advance_booking_days: info.advance_booking_days,
    default_duration_minutes: info.default_duration_minutes,
    public_booking_enabled: info.booking_enabled,
  }
}

export async function getPublicAppointmentSlots(date: string, type: AppointmentType, venue: AppointmentVenue): Promise<PublicAppointmentSlot[]> {
  const { data, error } = await requireSupabase().rpc('get_public_appointment_slots', {
    p_date: date,
    p_appointment_type: type,
    p_venue: venue,
  })
  if (error) throw error
  if (!Array.isArray(data)) throw new Error('Available appointment times could not be loaded.')
  return data.map((slot) => {
    if (
      !isRecord(slot)
      || typeof slot.slot_start !== 'string'
      || typeof slot.duration_minutes !== 'number'
      || typeof slot.timezone !== 'string'
    ) {
      throw new Error('Scheduling returned an available time in an unexpected shape.')
    }
    return {
      slot_start: slot.slot_start,
      duration_minutes: slot.duration_minutes,
      timezone: slot.timezone,
    }
  })
}

export async function createPublicAppointment(input: PublicAppointmentInput, honeypot = '') {
  const { data, error } = await requireSupabase().rpc('create_public_appointment', {
    p_client_first_name: input.client_first_name.trim(),
    p_client_last_name: input.client_last_name.trim(),
    p_client_email: input.client_email?.trim() || null,
    p_client_phone: input.client_phone?.trim() || null,
    p_appointment_type: input.appointment_type,
    p_venue: input.venue,
    p_start_at: input.start_at,
    p_honeypot: honeypot,
  })
  if (error) throw error
  if (typeof data !== 'string' || !/^HASH-[A-F0-9]{8}$/.test(data)) {
    throw new Error('The appointment was submitted, but a confirmation reference was not returned. Contact HASH through its official channels.')
  }
  return data
}

export async function saveSchedulingSettings(input: SchedulingSettings) {
  const { data: { user }, error: userError } = await requireSupabase().auth.getUser()
  if (userError) throw userError
  if (!user) throw new Error('Sign in with an authorised scheduling account to update settings.')
  const { error } = await requireSupabase()
    .from('scheduling_settings')
    .update({ ...input, updated_by: user.id })
    .eq('id', true)
  if (error) throw error
}

export async function listSchedulingRecipients() {
  const { data, error } = await requireSupabase()
    .from('scheduling_notification_recipients')
    .select('id, email, enabled, is_primary, created_at')
    .order('created_at', { ascending: true })
  if (error) throw error
  if (!Array.isArray(data)) throw new Error('Scheduling returned notification recipients in an unexpected shape.')
  return data.map((recipient) => {
    if (
      !isRecord(recipient)
      || typeof recipient.id !== 'string'
      || typeof recipient.email !== 'string'
      || typeof recipient.enabled !== 'boolean'
      || typeof recipient.is_primary !== 'boolean'
      || typeof recipient.created_at !== 'string'
    ) {
      throw new Error('Scheduling returned a notification recipient with an unexpected shape.')
    }
    return {
      id: recipient.id,
      email: recipient.email,
      enabled: recipient.enabled,
      is_primary: recipient.is_primary,
      created_at: recipient.created_at,
    }
  })
}

export async function addSchedulingRecipient(email: string) {
  const { error } = await requireSupabase().from('scheduling_notification_recipients').insert({ email: email.trim() })
  if (error) throw error
}

export async function setPrimarySchedulingRecipient(id: string) {
  const client = requireSupabase()
  const { error: clearError } = await client.from('scheduling_notification_recipients').update({ is_primary: false }).eq('is_primary', true)
  if (clearError) throw clearError
  const { error } = await client.from('scheduling_notification_recipients').update({ is_primary: true }).eq('id', id)
  if (error) throw error
}

export async function removeSchedulingRecipient(id: string) {
  const { error } = await requireSupabase().from('scheduling_notification_recipients').delete().eq('id', id)
  if (error) throw error
}

export async function getAppointmentAudit(id: string) {
  const { data, error } = await requireSupabase()
    .from('scheduling_audit_log')
    .select('id, action, actor_id, previous_values, new_values, created_at')
    .eq('entity_type', 'appointment')
    .eq('entity_id', id)
    .order('created_at', { ascending: false })
  if (error) throw error
  if (!Array.isArray(data)) throw new Error('Scheduling audit history has an unexpected shape.')
  return data.map((entry) => {
    if (
      !isRecord(entry)
      || typeof entry.id !== 'number'
      || typeof entry.action !== 'string'
      || (typeof entry.actor_id !== 'string' && entry.actor_id !== null)
      || (isRecord(entry.previous_values) === false && entry.previous_values !== null)
      || (isRecord(entry.new_values) === false && entry.new_values !== null)
      || typeof entry.created_at !== 'string'
    ) {
      throw new Error('Scheduling returned an audit entry with an unexpected shape.')
    }
    return {
      id: entry.id,
      action: entry.action,
      actor_id: entry.actor_id,
      previous_values: entry.previous_values,
      new_values: entry.new_values,
      created_at: entry.created_at,
    }
  })
}

export function formatAppointmentStatus(status: AppointmentStatus) {
  return {
    scheduled: 'Scheduled',
    confirmed: 'Confirmed',
    rescheduling_required: 'Rescheduling required',
    cancelled: 'Cancelled',
    completed: 'Completed',
    no_show: 'No-show',
  }[status]
}

export function localDateTimeInput(isoString: string, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(isoString))
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}`
}

export function dateTimeInputToIso(value: string, timezone: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) throw new Error('Enter a valid appointment date and time.')
  const [, year, month, day, hour, minute] = match
  const targetWallTime = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  let instant = targetWallTime
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(instant)).map((part) => [part.type, part.value]))
    const representedWallTime = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
    )
    instant += targetWallTime - representedWallTime
  }
  const resulting = formatter.formatToParts(new Date(instant))
  const finalParts = Object.fromEntries(resulting.map((part) => [part.type, part.value]))
  if (
    finalParts.year !== year
    || finalParts.month !== month
    || finalParts.day !== day
    || finalParts.hour !== hour
    || finalParts.minute !== minute
  ) {
    throw new Error('That local time does not exist because of a daylight-saving clock change.')
  }
  for (let offsetMinutes = -180; offsetMinutes <= 180; offsetMinutes += 15) {
    if (offsetMinutes === 0) continue
    const alternative = formatter.formatToParts(new Date(instant + offsetMinutes * 60_000))
    const alternativeParts = Object.fromEntries(alternative.map((part) => [part.type, part.value]))
    if (
      alternativeParts.year === year
      && alternativeParts.month === month
      && alternativeParts.day === day
      && alternativeParts.hour === hour
      && alternativeParts.minute === minute
    ) {
      throw new Error('That local time occurs twice because of a daylight-saving clock change. Choose another time.')
    }
  }
  return new Date(instant).toISOString()
}
