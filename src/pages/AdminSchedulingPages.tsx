import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { ReactNode } from 'react'
import { Link, NavLink, Navigate, Outlet, useNavigate, useParams } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import { Button } from '../components/ui/Button'
import {
  addSchedulingRecipient,
  appointmentStatuses,
  dateTimeInputToIso,
  deleteAppointmentType,
  deleteAppointmentVenue,
  deleteAppointmentBlock,
  formatAppointmentStatus,
  getAppointment,
  getAppointmentAudit,
  getAppointmentOptions,
  getSchedulingSettings,
  listAppointmentBlocks,
  listAppointments,
  listSchedulingRecipients,
  localDateTimeInput,
  removeSchedulingRecipient,
  reorderAppointmentOptions,
  saveAppointment,
  saveAppointmentBlock,
  saveAppointmentType,
  saveAppointmentVenue,
  saveSchedulingSettings,
  setDefaultAppointmentOption,
  setPrimarySchedulingRecipient,
} from '../scheduling/data'
import type {
  Appointment,
  AppointmentBlock,
  AppointmentInput,
  AppointmentOptions,
  AppointmentStatus,
  SchedulingAuditEntry,
  SchedulingSettings,
} from '../scheduling/data'
import { useAuth } from '../auth/useAuth'

const initialSettings: SchedulingSettings = {
  timezone: 'Asia/Manila',
  default_duration_minutes: 30,
  advance_booking_days: 90,
  working_hours: {
    monday: { start: '09:00', end: '17:00' },
    tuesday: { start: '09:00', end: '17:00' },
    wednesday: { start: '09:00', end: '17:00' },
    thursday: { start: '09:00', end: '17:00' },
    friday: { start: '09:00', end: '17:00' },
  },
  public_booking_enabled: false,
  google_calendar_enabled: false,
  email_notifications_enabled: false,
}

const formFieldClass = 'w-full rounded-xl border border-[#e5cdd0] bg-white px-3 py-2.5'
const secondaryButtonClass = 'public-outline-link'

function schedulingError(error: unknown) {
  return error instanceof Error ? error.message : 'Scheduling could not complete the request. Please try again.'
}

function nextDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10)
}

function SchedulingLoading() {
  return <p className="py-10 text-center" role="status">Loading scheduling…</p>
}

function SchedulingError({ message }: { message: string }) {
  return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-900" role="alert">{message}</p>
}

export function SchedulingRoute() {
  const { user, loading, configured } = useAuth()
  if (!configured) {
    return <section className="mx-auto max-w-3xl px-4 py-16"><SchedulingError message="Scheduling requires the Supabase browser URL and publishable key." /></section>
  }
  if (loading) return <SchedulingLoading />
  if (!user) return <Navigate to="/admin/login" replace />
  if (user.app_metadata?.role !== 'admin' && user.app_metadata?.scheduling_access !== true) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-2xl font-bold">Scheduling access not authorised</h1>
        <p className="mt-3 text-[#594140]">Your account is not authorised to view confidential appointment records. Contact a HASH administrator.</p>
        <Link className="public-text-link mt-5 inline-block" to="/admin">Return to Administrator</Link>
      </section>
    )
  }
  return <Outlet />
}

function SchedulingNav() {
  const links = [
    { to: '/admin/scheduling', label: 'Calendar' },
    { to: '/admin/scheduling/appointments', label: 'Appointments' },
    { to: '/admin/scheduling/appointments/new', label: 'New appointment' },
    { to: '/admin/scheduling/blocked-times', label: 'Blocked times' },
    { to: '/admin/scheduling/settings', label: 'Settings' },
  ]
  return (
    <nav aria-label="Scheduling" className="mb-6 flex flex-wrap gap-2">
      {links.map((link) => (
        <NavLink
          className={({ isActive }) => `${secondaryButtonClass} ${isActive ? 'border-primary bg-primary text-white hover:text-white' : ''}`}
          end={link.to === '/admin/scheduling'}
          key={link.to}
          to={link.to}
        >{link.label}</NavLink>
      ))}
    </nav>
  )
}

function SchedulingPageShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link className="public-text-link text-sm" to="/admin">Administrator dashboard</Link>
          <h1 className="mt-2 text-3xl font-bold">{title}</h1>
        </div>
      </div>
      <SchedulingNav />
      {children}
    </section>
  )
}

function AppointmentCard({ appointment }: { appointment: Appointment }) {
  return (
    <Link className="interactive-card block rounded-xl border border-[#f1dfe1] bg-white p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" to={`/admin/scheduling/appointments/${appointment.id}`}>
      <div className="flex flex-wrap justify-between gap-2">
        <strong>{appointment.client_first_name} {appointment.client_last_name}</strong>
        <span className="rounded-full bg-[#fff0ef] px-3 py-1 text-sm">{formatAppointmentStatus(appointment.status)}</span>
      </div>
      <p className="mt-1 text-sm text-[#594140]">{appointment.appointment_type} · {appointment.venue}</p>
      <p className="mt-1 text-sm text-[#594140]">{new Date(appointment.start_at).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: appointment.timezone })} · {appointment.duration_minutes} min</p>
      <p className="mt-1 text-xs text-[#715b5b]">Ref: {appointment.appointment_reference}</p>
    </Link>
  )
}

export function AdminSchedulingPage() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [blocks, setBlocks] = useState<AppointmentBlock[]>([])
  const [settings, setSettings] = useState<SchedulingSettings>(initialSettings)
  const [options, setOptions] = useState<AppointmentOptions>({ types: [], venues: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({ venue: '', type: '', status: '' })

  const loadRange = useCallback(async (start: Date, end: Date) => {
    setError(null)
    setLoading(true)
    setAppointments([])
    setBlocks([])
    try {
      const [records, blocked, currentSettings, currentOptions] = await Promise.all([
        listAppointments(new Date(start.getTime() - 4 * 60 * 60 * 1000).toISOString(), end.toISOString()),
        listAppointmentBlocks(start.toISOString(), end.toISOString()),
        getSchedulingSettings(),
        getAppointmentOptions(),
      ])
      setAppointments(records)
      setBlocks(blocked)
      setSettings(currentSettings)
      setOptions(currentOptions)
    } catch (loadError) {
      setError(schedulingError(loadError))
    } finally {
      setLoading(false)
    }
  }, [])

  const visibleAppointments = appointments.filter((appointment) =>
    (!filters.venue || appointment.venue === filters.venue)
    && (!filters.type || appointment.appointment_type === filters.type)
    && (!filters.status || appointment.status === filters.status),
  )
  const filterVenues = [...new Set([...options.venues.map((item) => item.name), ...appointments.map((item) => item.venue)])]
  const filterTypes = [...new Set([...options.types.map((item) => item.name), ...appointments.map((item) => item.appointment_type)])]
  const events = [
    ...visibleAppointments.map((appointment) => ({
      id: appointment.id,
      title: `${appointment.client_first_name} ${appointment.client_last_name} · ${appointment.appointment_type}`,
      start: appointment.start_at,
      end: new Date(new Date(appointment.start_at).getTime() + appointment.duration_minutes * 60_000).toISOString(),
      backgroundColor: appointment.status === 'cancelled' ? '#71717a' : appointment.status === 'rescheduling_required' ? '#b45309' : '#7f1d3f',
      borderColor: appointment.status === 'cancelled' ? '#71717a' : appointment.status === 'rescheduling_required' ? '#b45309' : '#7f1d3f',
      extendedProps: { description: `${appointment.venue} · ${formatAppointmentStatus(appointment.status)}` },
    })),
    ...blocks.map((block) => ({
      id: `block-${block.id}`,
      title: `Blocked · ${block.title}`,
      start: block.start_at,
      end: block.end_at,
      allDay: block.is_all_day,
      display: 'background' as const,
      backgroundColor: '#d6d3d1',
      borderColor: '#a8a29e',
      extendedProps: { description: block.scope === 'all_venues' ? 'All venues' : block.venue ?? '' },
    })),
  ]

  return (
    <SchedulingPageShell title="Scheduling calendar">
      <div className="rounded-2xl border border-[#f1dfe1] bg-white p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap gap-3">
          <label className="text-sm font-semibold">Venue
            <select className={`${formFieldClass} mt-1 min-w-36`} onChange={(event) => setFilters({ ...filters, venue: event.target.value })} value={filters.venue}>
              <option value="">All venues</option>
              {filterVenues.map((venue) => <option key={venue}>{venue}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Service
            <select className={`${formFieldClass} mt-1 min-w-40`} onChange={(event) => setFilters({ ...filters, type: event.target.value })} value={filters.type}>
              <option value="">All services</option>
              {filterTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Status
            <select className={`${formFieldClass} mt-1 min-w-44`} onChange={(event) => setFilters({ ...filters, status: event.target.value })} value={filters.status}>
              <option value="">All statuses</option>
              {appointmentStatuses.map((status) => <option key={status} value={status}>{formatAppointmentStatus(status)}</option>)}
            </select>
          </label>
          <Button className="self-end" onClick={() => setFilters({ venue: '', type: '', status: '' })} type="button" variant="outline">Clear filters</Button>
          <Button as="link" className="self-end" to="/admin/scheduling/appointments/new" variant="outline">New appointment</Button>
        </div>
        {error && <SchedulingError message={error} />}
        {loading && <SchedulingLoading />}
        <FullCalendar
          datesSet={(range) => { void loadRange(range.start, range.end) }}
          dayMaxEvents
          eventClick={(info) => { if (!info.event.id.startsWith('block-')) navigate(`/admin/scheduling/appointments/${info.event.id}`) }}
          eventDidMount={(info) => { info.el.setAttribute('aria-label', `${info.event.title}. ${info.event.extendedProps.description ?? ''}`) }}
          events={events}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' }}
          height="auto"
          initialView="dayGridMonth"
          noEventsContent="No appointments or blocked times in this date range."
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
          timeZone={settings.timezone}
        />
      </div>
      <p className="mt-3 text-xs text-[#715b5b]">Appointment names and service details are visible only to authorised scheduling staff. Calendar events are not shared externally.</p>
    </SchedulingPageShell>
  )
}

export function AdminAppointmentsPage() {
  const [records, setRecords] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const start = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    const end = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    void listAppointments(start.toISOString(), end.toISOString())
      .then((data) => { if (active) setRecords(data) })
      .catch((loadError) => { if (active) setError(schedulingError(loadError)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return (
    <SchedulingPageShell title="Appointments">
      <div className="mb-4 flex justify-end"><Button as="link" to="/admin/scheduling/appointments/new" variant="outline">New appointment</Button></div>
      {error && <SchedulingError message={error} />}
      {loading ? <SchedulingLoading /> : records.length === 0 ? (
        <p className="rounded-xl border border-[#f1dfe1] bg-white p-6">No appointments found.</p>
      ) : (
        <div className="space-y-3">{records.map((appointment) => <AppointmentCard appointment={appointment} key={appointment.id} />)}</div>
      )}
    </SchedulingPageShell>
  )
}

const emptyAppointment: Omit<AppointmentInput, 'id'> = {
  client_first_name: '',
  client_last_name: '',
  client_email: null,
  client_phone: null,
  appointment_type: '',
  venue: '',
  start_at: '',
  duration_minutes: 30,
  timezone: 'Asia/Manila',
  status: 'scheduled',
  internal_notes: null,
  client_instructions: null,
  cancellation_reason: null,
}

export function AppointmentEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState<Omit<AppointmentInput, 'id'>>(emptyAppointment)
  const [options, setOptions] = useState<AppointmentOptions>({ types: [], venues: [] })
  const [dateTime, setDateTime] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const [currentSettings, currentOptions, appointment] = await Promise.all([
          getSchedulingSettings(),
          getAppointmentOptions(),
          id ? getAppointment(id) : Promise.resolve(null),
        ])
        if (!active) return
        setOptions(currentOptions)
        if (id) {
          if (!appointment) throw new Error('The requested appointment could not be loaded.')
          if (['cancelled', 'completed', 'no_show'].includes(appointment.status)) {
            navigate(`/admin/scheduling/appointments/${id}`, { replace: true })
            return
          }
          const { id: _id, appointment_reference: _ref, created_at: _created, updated_at: _updated, ...values } = appointment
          setForm(values)
          setDateTime(localDateTimeInput(appointment.start_at, appointment.timezone))
        } else {
          const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          const defaultVenue = currentOptions.venues.find((item) => item.is_default)
            ?? currentOptions.venues.find((item) => !item.is_online)
            ?? currentOptions.venues[0]
          const defaultType = currentOptions.types.find((item) => item.is_default)
            ?? currentOptions.types[0]
          const initialType = defaultVenue?.is_online
            ? currentOptions.types.find((item) => item.is_default && item.online_eligible)
              ?? currentOptions.types.find((item) => item.online_eligible)
              ?? defaultType
            : defaultType
          setForm({
            ...emptyAppointment,
            appointment_type: initialType?.name ?? '',
            venue: defaultVenue?.name ?? '',
            timezone: currentSettings.timezone,
            duration_minutes: currentSettings.default_duration_minutes,
            start_at: tomorrow,
          })
          setDateTime(localDateTimeInput(tomorrow, currentSettings.timezone))
        }
      } catch (loadError) {
        if (active) setError(schedulingError(loadError))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [id, navigate])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const selectedType = options.types.find((option) => option.name === form.appointment_type)
    const selectedVenue = options.venues.find((option) => option.name === form.venue)
    if (selectedType && selectedVenue?.is_online && !selectedType.online_eligible) {
      setError('This appointment type is not enabled for the online venue.')
      return
    }
    setSaving(true)
    try {
      const record = await saveAppointment({
        ...form,
        id,
        client_first_name: form.client_first_name.trim(),
        client_last_name: form.client_last_name.trim(),
        client_email: form.client_email?.trim() || null,
        client_phone: form.client_phone?.trim() || null,
        internal_notes: form.internal_notes?.trim() || null,
        client_instructions: form.client_instructions?.trim() || null,
        start_at: dateTimeInputToIso(dateTime, form.timezone),
      })
      navigate(`/admin/scheduling/appointments/${record.id}`)
    } catch (saveError) {
      setError(schedulingError(saveError))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <SchedulingPageShell title={id ? 'Edit appointment' : 'New appointment'}><SchedulingLoading /></SchedulingPageShell>
  const selectedType = options.types.find((option) => option.name === form.appointment_type)
  const selectedVenue = options.venues.find((option) => option.name === form.venue)
  const incompatibleOnlineSelection = Boolean(selectedType && selectedVenue?.is_online && !selectedType.online_eligible)
  const missingAppointmentOptions = !id && (!options.types.length || !options.venues.length)
  return (
    <SchedulingPageShell title={id ? 'Edit appointment' : 'New appointment'}>
      <form className="space-y-5 rounded-2xl border border-[#f1dfe1] bg-white p-5 sm:p-7" onSubmit={(event) => void handleSubmit(event)}>
        <p className="text-sm text-[#594140]">Collect only details needed to arrange the visit. Do not enter test results, HIV status, or clinical notes.</p>
        {error && <SchedulingError message={error} />}
        {missingAppointmentOptions && <SchedulingError message="Configure at least one appointment type and venue in Scheduling Settings before creating appointments." />}
        {incompatibleOnlineSelection && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950" role="alert">This appointment type is not enabled for the online venue.</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">First name
            <input className={`${formFieldClass} mt-1`} maxLength={120} onChange={(event) => setForm({ ...form, client_first_name: event.target.value })} required value={form.client_first_name} />
          </label>
          <label className="text-sm font-semibold">Last name
            <input className={`${formFieldClass} mt-1`} maxLength={120} onChange={(event) => setForm({ ...form, client_last_name: event.target.value })} required value={form.client_last_name} />
          </label>
          <label className="text-sm font-semibold">Email address (optional)
            <input className={`${formFieldClass} mt-1`} autoComplete="off" maxLength={320} onChange={(event) => setForm({ ...form, client_email: event.target.value || null })} type="email" value={form.client_email ?? ''} />
          </label>
          <label className="text-sm font-semibold">Contact number (optional)
            <input className={`${formFieldClass} mt-1`} autoComplete="off" maxLength={80} onChange={(event) => setForm({ ...form, client_phone: event.target.value || null })} type="tel" value={form.client_phone ?? ''} />
          </label>
          <label className="text-sm font-semibold">Appointment type
            <select className={`${formFieldClass} mt-1`} onChange={(event) => setForm({ ...form, appointment_type: event.target.value })} required value={form.appointment_type}>
              {[...new Set([...options.types.map((type) => type.name), form.appointment_type].filter(Boolean))].map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Venue
            <select className={`${formFieldClass} mt-1`} onChange={(event) => setForm({ ...form, venue: event.target.value })} required value={form.venue}>
              {[...new Set([...options.venues.map((venue) => venue.name), form.venue].filter(Boolean))].map((venue) => <option key={venue}>{venue}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Date and time ({form.timezone})
            <input className={`${formFieldClass} mt-1`} onChange={(event) => setDateTime(event.target.value)} required type="datetime-local" value={dateTime} />
          </label>
          <label className="text-sm font-semibold">Duration
            <select className={`${formFieldClass} mt-1`} onChange={(event) => setForm({ ...form, duration_minutes: Number(event.target.value) })} value={form.duration_minutes}>
              {[15, 30, 45, 60, 90, 120, 180, 240].map((duration) => <option key={duration} value={duration}>{duration} minutes</option>)}
            </select>
          </label>
          {id
            ? <label className="text-sm font-semibold">Status
              <select className={`${formFieldClass} mt-1`} onChange={(event) => setForm({ ...form, status: event.target.value as AppointmentStatus })} value={form.status}>
                {(['scheduled', 'confirmed', 'rescheduling_required'] as AppointmentStatus[]).map((status) => <option key={status} value={status}>{formatAppointmentStatus(status)}</option>)}
              </select>
            </label>
            : <p className="self-center text-sm text-[#594140]">New appointments start as Scheduled and require staff confirmation.</p>}
        </div>
        <label className="block text-sm font-semibold">Client instructions (optional)
          <textarea className={`${formFieldClass} mt-1`} maxLength={2000} onChange={(event) => setForm({ ...form, client_instructions: event.target.value || null })} rows={3} value={form.client_instructions ?? ''} />
        </label>
        <label className="block text-sm font-semibold">Internal administrative notes (optional)
          <textarea className={`${formFieldClass} mt-1`} maxLength={4000} onChange={(event) => setForm({ ...form, internal_notes: event.target.value || null })} rows={3} value={form.internal_notes ?? ''} />
        </label>
        <div className="flex flex-wrap gap-3">
          <Button disabled={saving || incompatibleOnlineSelection || missingAppointmentOptions} type="submit" variant="outline">{saving ? 'Saving…' : 'Save appointment'}</Button>
          <Button as="link" to={id ? `/admin/scheduling/appointments/${id}` : '/admin/scheduling/appointments'} variant="outline">Cancel</Button>
        </div>
      </form>
    </SchedulingPageShell>
  )
}

export function AppointmentDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [audit, setAudit] = useState<SchedulingAuditEntry[]>([])
  const [cancelReason, setCancelReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const [record, history] = await Promise.all([getAppointment(id), getAppointmentAudit(id)])
      setAppointment(record)
      setAudit(history)
    } catch (loadError) {
      setError(schedulingError(loadError))
    } finally {
      setLoading(false)
    }
  }, [id])
  useEffect(() => {
    let active = true
    void Promise.all([getAppointment(id), getAppointmentAudit(id)])
      .then(([record, history]) => {
        if (active) {
          setAppointment(record)
          setAudit(history)
        }
      })
      .catch((loadError: unknown) => { if (active) setError(schedulingError(loadError)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  async function updateStatus(status: AppointmentStatus) {
    if (!appointment) return
    if (status === 'cancelled' && !cancelReason.trim()) {
      setError('Enter a cancellation reason before cancelling.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const updated = await saveAppointment({
        id: appointment.id,
        client_first_name: appointment.client_first_name,
        client_last_name: appointment.client_last_name,
        client_email: appointment.client_email,
        client_phone: appointment.client_phone,
        appointment_type: appointment.appointment_type,
        venue: appointment.venue,
        start_at: appointment.start_at,
        duration_minutes: appointment.duration_minutes,
        timezone: appointment.timezone,
        status,
        internal_notes: appointment.internal_notes,
        client_instructions: appointment.client_instructions,
        cancellation_reason: status === 'cancelled' ? cancelReason.trim() : null,
      })
      setAppointment(updated)
      await load()
    } catch (saveError) {
      setError(schedulingError(saveError))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <SchedulingPageShell title="Appointment"><SchedulingLoading /></SchedulingPageShell>
  if (!appointment) return <SchedulingPageShell title="Appointment">{error ? <SchedulingError message={error} /> : <p>Appointment not found.</p>}</SchedulingPageShell>
  return (
    <SchedulingPageShell title="Appointment details">
      <div className="rounded-2xl border border-[#f1dfe1] bg-white p-5 sm:p-7">
        {error && <SchedulingError message={error} />}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-[#715b5b]">Reference {appointment.appointment_reference}</p>
            <h2 className="mt-1 text-2xl font-bold">{appointment.client_first_name} {appointment.client_last_name}</h2>
            <p className="mt-2 text-[#594140]">{appointment.appointment_type} · {appointment.venue} · {formatAppointmentStatus(appointment.status)}</p>
          </div>
          {!['cancelled', 'completed', 'no_show'].includes(appointment.status) && <Button as="link" to={`/admin/scheduling/appointments/${id}/edit`} variant="outline">Edit or reschedule</Button>}
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <DetailValue label="Date and time">{new Date(appointment.start_at).toLocaleString('en', { dateStyle: 'full', timeStyle: 'short', timeZone: appointment.timezone })}</DetailValue>
          <DetailValue label="Duration">{appointment.duration_minutes} minutes</DetailValue>
          <DetailValue label="Email">{appointment.client_email || 'Not provided'}</DetailValue>
          <DetailValue label="Contact number">{appointment.client_phone || 'Not provided'}</DetailValue>
          <DetailValue label="Client instructions">{appointment.client_instructions || 'None'}</DetailValue>
          <DetailValue label="Internal notes">{appointment.internal_notes || 'None'}</DetailValue>
          {appointment.cancellation_reason && <DetailValue label="Cancellation reason">{appointment.cancellation_reason}</DetailValue>}
        </dl>
        {appointment.status !== 'cancelled' && appointment.status !== 'completed' && appointment.status !== 'no_show' && (
          <div className="mt-7 border-t border-[#e8dfe0] pt-5">
            <h3 className="font-bold">Update status</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {(['confirmed', 'rescheduling_required', 'completed', 'no_show'] as AppointmentStatus[])
                .filter((status) => status !== appointment.status)
                .map((status) => <Button disabled={saving} key={status} onClick={() => void updateStatus(status)} type="button" variant="outline">{formatAppointmentStatus(status)}</Button>)}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <label className="sr-only" htmlFor="cancellation-reason">Cancellation reason</label>
              <input className={`${formFieldClass} max-w-md`} id="cancellation-reason" maxLength={1000} onChange={(event) => setCancelReason(event.target.value)} placeholder="Cancellation reason (required)" value={cancelReason} />
              <button className="cursor-pointer rounded-full bg-red-700 px-4 py-2 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60" disabled={saving} onClick={() => void updateStatus('cancelled')} type="button">Cancel appointment</button>
            </div>
          </div>
        )}
        <div className="mt-7 border-t border-[#e8dfe0] pt-5">
          <h3 className="font-bold">Change history</h3>
          {audit.length === 0 ? <p className="mt-2 text-sm text-[#594140]">No recorded changes.</p> : (
            <ol className="mt-3 space-y-2 text-sm">{audit.map((entry) => (
              <li className="rounded-lg bg-[#fff8f7] p-3" key={entry.id}>
                {entry.action} · {new Date(entry.created_at).toLocaleString('en', { timeZone: appointment.timezone })}
              </li>
            ))}</ol>
          )}
        </div>
        <Button className="mt-6" onClick={() => navigate(-1)} type="button" variant="outline">← Back</Button>
      </div>
    </SchedulingPageShell>
  )
}

function DetailValue({ label, children }: { label: string; children: ReactNode }) {
  return <div><dt className="text-sm font-semibold text-[#715b5b]">{label}</dt><dd className="mt-1 whitespace-pre-wrap">{children}</dd></div>
}

export function AppointmentBlocksPage() {
  const [blocks, setBlocks] = useState<AppointmentBlock[]>([])
  const [settings, setSettings] = useState<SchedulingSettings>(initialSettings)
  const [options, setOptions] = useState<AppointmentOptions>({ types: [], venues: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', scope: 'all_venues' as 'all_venues' | 'venue', venue: '', start: '', end: '', allDay: false, reason: '' })

  const refresh = useCallback(async () => {
    try {
      const [records, currentSettings, currentOptions] = await Promise.all([listAppointmentBlocks(), getSchedulingSettings(), getAppointmentOptions()])
      setBlocks(records)
      setSettings(currentSettings)
      setOptions(currentOptions)
      if (!form.venue && currentOptions.venues.length) setForm((current) => ({ ...current, venue: currentOptions.venues[0].name }))
    } catch (loadError) {
      setError(schedulingError(loadError))
    } finally {
      setLoading(false)
    }
  }, [form.venue])
  useEffect(() => {
    let active = true
    void Promise.all([listAppointmentBlocks(), getSchedulingSettings(), getAppointmentOptions()])
      .then(([records, currentSettings, currentOptions]) => {
        if (active) {
          setBlocks(records)
          setSettings(currentSettings)
          setOptions(currentOptions)
          setForm((current) => ({
            ...current,
            venue: current.venue || currentOptions.venues[0]?.name || '',
          }))
        }
      })
      .catch((loadError: unknown) => { if (active) setError(schedulingError(loadError)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function createBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const startAt = dateTimeInputToIso(form.allDay ? `${form.start}T00:00` : form.start, settings.timezone)
      const endAt = dateTimeInputToIso(form.allDay ? `${nextDate(form.end)}T00:00` : form.end, settings.timezone)
      if (new Date(endAt) <= new Date(startAt)) throw new Error('The block end must be later than its start.')
      const appointments = await listAppointments(
        new Date(new Date(startAt).getTime() - 4 * 60 * 60 * 1000).toISOString(),
        endAt,
      )
      const affected = appointments.filter((appointment) =>
        appointment.status !== 'cancelled'
        && (form.scope === 'all_venues' || appointment.venue === form.venue)
        && new Date(appointment.start_at).getTime() < new Date(endAt).getTime()
        && new Date(appointment.start_at).getTime() + appointment.duration_minutes * 60_000 > new Date(startAt).getTime(),
      )
      const affectedNames = affected.slice(0, 5).map((appointment) => `${appointment.client_first_name} ${appointment.client_last_name}`).join(', ')
      const message = affected.length
        ? `${affected.length} appointment(s) overlap this block${affectedNames ? `: ${affectedNames}` : ''}. Existing appointments will remain and be marked for rescheduling review. Continue?`
        : 'Create this blocked period?'
      if (!window.confirm(message)) return
      await saveAppointmentBlock({
        title: form.title.trim(),
        scope: form.scope,
        venue: form.scope === 'venue' ? form.venue : null,
        start_at: startAt,
        end_at: endAt,
        is_all_day: form.allDay,
        reason: form.reason.trim() || null,
      })
      setForm({ ...form, title: '', start: '', end: '', reason: '' })
      await refresh()
    } catch (saveError) {
      setError(schedulingError(saveError))
    } finally {
      setSaving(false)
    }
  }

  async function deleteBlock(id: string) {
    if (!window.confirm('Remove this blocked time? Any appointments already marked for rescheduling review will remain flagged.')) return
    try {
      await deleteAppointmentBlock(id)
      await refresh()
    } catch (deleteError) {
      setError(schedulingError(deleteError))
    }
  }

  return (
    <SchedulingPageShell title="Blocked dates and times">
      <form className="mb-6 space-y-4 rounded-2xl border border-[#f1dfe1] bg-white p-5" onSubmit={(event) => void createBlock(event)}>
        <h2 className="text-xl font-bold">Create a block</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">Title<input className={`${formFieldClass} mt-1`} maxLength={180} onChange={(event) => setForm({ ...form, title: event.target.value })} required value={form.title} /></label>
          <label className="text-sm font-semibold">Scope
            <select className={`${formFieldClass} mt-1`} onChange={(event) => setForm({ ...form, scope: event.target.value as 'all_venues' | 'venue' })} value={form.scope}>
              <option value="all_venues">All venues</option><option value="venue">One venue</option>
            </select>
          </label>
          {form.scope === 'venue' && <label className="text-sm font-semibold">Venue
            <select className={`${formFieldClass} mt-1`} onChange={(event) => setForm({ ...form, venue: event.target.value })} required value={form.venue}>
            {options.venues.map((venue) => <option key={venue.id} value={venue.name}>{venue.name}</option>)}
            </select>
          </label>}
          <label className="text-sm font-semibold">Start ({settings.timezone})<input className={`${formFieldClass} mt-1`} onChange={(event) => setForm({ ...form, start: event.target.value })} required type={form.allDay ? 'date' : 'datetime-local'} value={form.allDay ? form.start.split('T')[0] : form.start} /></label>
          <label className="text-sm font-semibold">End ({settings.timezone}){form.allDay && <span className="ml-1 font-normal">(inclusive date)</span>}<input className={`${formFieldClass} mt-1`} onChange={(event) => setForm({ ...form, end: event.target.value })} required type={form.allDay ? 'date' : 'datetime-local'} value={form.allDay ? form.end.split('T')[0] : form.end} /></label>
          <label className="text-sm font-semibold">Administrative reason (optional)<input className={`${formFieldClass} mt-1`} maxLength={1000} onChange={(event) => setForm({ ...form, reason: event.target.value })} value={form.reason} /></label>
        </div>
        <label className="flex items-center gap-2 text-sm"><input checked={form.allDay} onChange={(event) => {
          const allDay = event.target.checked
          setForm({
            ...form,
            allDay,
            start: allDay ? form.start.split('T')[0] : `${form.start.split('T')[0]}T00:00`,
            end: allDay ? form.end.split('T')[0] : `${form.end.split('T')[0]}T00:00`,
          })
        }} type="checkbox" /> All-day block</label>
        <Button disabled={saving} type="submit" variant="outline">{saving ? 'Saving…' : 'Create blocked time'}</Button>
      </form>
      {error && <SchedulingError message={error} />}
      {loading ? <SchedulingLoading /> : blocks.length === 0 ? <p className="rounded-xl border border-[#f1dfe1] bg-white p-5">No blocked times have been added.</p> : (
        <div className="space-y-3">{blocks.map((block) => (
          <article className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f1dfe1] bg-white p-4" key={block.id}>
            <div><h3 className="font-bold">{block.title}</h3><p className="text-sm text-[#594140]">{block.scope === 'all_venues' ? 'All venues' : block.venue} · {new Date(block.start_at).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: settings.timezone })} – {new Date(block.end_at).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: settings.timezone })}</p>{block.reason && <p className="mt-1 text-sm">{block.reason}</p>}</div>
            <button className="cursor-pointer font-semibold text-red-800 underline transition hover:text-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2" onClick={() => void deleteBlock(block.id)} type="button">Remove block</button>
          </article>
        ))}</div>
      )}
    </SchedulingPageShell>
  )
}

export function SchedulingOptionsManager() {
  const [options, setOptions] = useState<AppointmentOptions>({ types: [], venues: [] })
  const [typeName, setTypeName] = useState('')
  const [typeOnlineEligible, setTypeOnlineEligible] = useState(false)
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null)
  const [venueName, setVenueName] = useState('')
  const [venueIsOnline, setVenueIsOnline] = useState(false)
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const currentOptions = await getAppointmentOptions()
    setOptions(currentOptions)
  }, [])

  useEffect(() => {
    let active = true
    void getAppointmentOptions()
      .then((currentOptions) => { if (active) setOptions(currentOptions) })
      .catch((loadError: unknown) => { if (active) setError(schedulingError(loadError)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function submitType(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setSaving(true)
    try {
      await saveAppointmentType({ id: editingTypeId ?? undefined, name: typeName, online_eligible: typeOnlineEligible })
      await refresh()
      setTypeName('')
      setTypeOnlineEligible(false)
      setEditingTypeId(null)
      setNotice('Appointment type saved.')
    } catch (saveError) {
      setError(schedulingError(saveError))
    } finally {
      setSaving(false)
    }
  }

  async function submitVenue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setSaving(true)
    try {
      await saveAppointmentVenue({ id: editingVenueId ?? undefined, name: venueName, is_online: venueIsOnline })
      await refresh()
      setVenueName('')
      setVenueIsOnline(false)
      setEditingVenueId(null)
      setNotice('Venue saved.')
    } catch (saveError) {
      setError(schedulingError(saveError))
    } finally {
      setSaving(false)
    }
  }

  async function removeType(option: AppointmentOptions['types'][number]) {
    if (!window.confirm(`Remove "${option.name}" from future appointment choices? Existing appointments keep their saved label.`)) return
    setError(null)
    setNotice(null)
    try {
      await deleteAppointmentType(option.id)
      await refresh()
      setNotice('Appointment type removed from future choices.')
    } catch (removeError) {
      setError(schedulingError(removeError))
    }
  }

  async function removeVenue(option: AppointmentOptions['venues'][number]) {
    if (!window.confirm(`Remove "${option.name}" from future appointment choices? Existing appointments and blocked periods keep their saved venue label.`)) return
    setError(null)
    setNotice(null)
    try {
      await deleteAppointmentVenue(option.id)
      await refresh()
      setNotice('Venue removed from future choices.')
    } catch (removeError) {
      setError(schedulingError(removeError))
    }
  }

  async function moveOption(kind: 'type' | 'venue', id: string, direction: -1 | 1) {
    setError(null)
    setNotice(null)
    try {
      const items = kind === 'type' ? options.types : options.venues
      const index = items.findIndex((item) => item.id === id)
      const targetIndex = index + direction
      if (index < 0 || targetIndex < 0 || targetIndex >= items.length) return
      const reordered = [...items]
      const [moved] = reordered.splice(index, 1)
      reordered.splice(targetIndex, 0, moved)
      await reorderAppointmentOptions(kind, reordered.map((item) => item.id))
      await refresh()
    } catch (reorderError) {
      setError(schedulingError(reorderError))
    }
  }

  async function setDefault(kind: 'type' | 'venue', id: string) {
    setError(null)
    setNotice(null)
    try {
      await setDefaultAppointmentOption(kind, id)
      await refresh()
      setNotice(`Default ${kind === 'type' ? 'appointment type' : 'venue'} updated.`)
    } catch (updateError) {
      setError(schedulingError(updateError))
    }
  }

  function editType(option: AppointmentOptions['types'][number]) {
    setEditingTypeId(option.id)
    setTypeName(option.name)
    setTypeOnlineEligible(option.online_eligible)
  }

  function editVenue(option: AppointmentOptions['venues'][number]) {
    setEditingVenueId(option.id)
    setVenueName(option.name)
    setVenueIsOnline(option.is_online)
  }

  return (
    <section className="mt-6 rounded-2xl border border-[#f1dfe1] bg-white p-5 sm:p-7">
      <h2 className="text-xl font-bold">Appointment types and venues</h2>
      <p className="mt-2 text-sm leading-6 text-[#594140]">
        Manage the choices shown in staff scheduling and public booking. Online eligibility is set per appointment type. Renaming or removing an option does not rewrite saved appointment or blocked-period labels.
      </p>
      {error && <div className="mt-4"><SchedulingError message={error} /></div>}
      {notice && <p className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-900" role="status">{notice}</p>}
      {loading ? <SchedulingLoading /> : (
        <div className="mt-5 grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="font-bold">Appointment types</h3>
            <form className="mt-3 space-y-3 rounded-xl bg-[#fff8f7] p-4" onSubmit={(event) => void submitType(event)}>
              <label className="block text-sm font-semibold">Type name
                <input className={`${formFieldClass} mt-1`} maxLength={120} onChange={(event) => setTypeName(event.target.value)} required value={typeName} />
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input checked={typeOnlineEligible} className="mt-1" onChange={(event) => setTypeOnlineEligible(event.target.checked)} type="checkbox" />
                <span>Allow this type at the venue marked as online</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <Button disabled={saving} type="submit" variant="outline">{saving ? 'Saving…' : editingTypeId ? 'Save type' : 'Add type'}</Button>
                {editingTypeId && <Button onClick={() => { setEditingTypeId(null); setTypeName(''); setTypeOnlineEligible(false) }} type="button" variant="outline">Cancel</Button>}
              </div>
            </form>
            <ul className="mt-3 divide-y divide-[#f1dfe1]">
              {options.types.map((option) => (
                <li className="flex flex-wrap items-center justify-between gap-2 py-3" key={option.id}>
                  <span>{option.name}{option.is_default && <span className="ml-2 rounded-full bg-[#fff0ef] px-2 py-1 text-xs font-semibold text-primary">Default</span>}{option.online_eligible && <span className="ml-2 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-900">Online eligible</span>}</span>
                  <span className="flex flex-wrap items-center gap-3">
                    <button aria-label={`Move ${option.name} up`} className="public-text-link cursor-pointer disabled:cursor-not-allowed disabled:opacity-40" disabled={options.types[0]?.id === option.id} onClick={() => void moveOption('type', option.id, -1)} type="button">↑</button>
                    <button aria-label={`Move ${option.name} down`} className="public-text-link cursor-pointer disabled:cursor-not-allowed disabled:opacity-40" disabled={options.types[options.types.length - 1]?.id === option.id} onClick={() => void moveOption('type', option.id, 1)} type="button">↓</button>
                    {!option.is_default && <button className="public-text-link cursor-pointer" onClick={() => void setDefault('type', option.id)} type="button">Set default</button>}
                    <button className="public-text-link cursor-pointer" onClick={() => editType(option)} type="button">Edit</button>
                    <button className="cursor-pointer font-semibold text-red-800 underline transition hover:text-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2" onClick={() => void removeType(option)} type="button">Delete</button>
                  </span>
                </li>
              ))}
              {options.types.length === 0 && <li className="py-3 text-sm text-[#594140]">No appointment types configured.</li>}
            </ul>
          </div>
          <div>
            <h3 className="font-bold">Venues</h3>
            <form className="mt-3 space-y-3 rounded-xl bg-[#fff8f7] p-4" onSubmit={(event) => void submitVenue(event)}>
              <label className="block text-sm font-semibold">Venue name
                <input className={`${formFieldClass} mt-1`} maxLength={120} onChange={(event) => setVenueName(event.target.value)} required value={venueName} />
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input checked={venueIsOnline} className="mt-1" onChange={(event) => setVenueIsOnline(event.target.checked)} type="checkbox" />
                <span>This is the online venue (only one venue can have this setting)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <Button disabled={saving} type="submit" variant="outline">{saving ? 'Saving…' : editingVenueId ? 'Save venue' : 'Add venue'}</Button>
                {editingVenueId && <Button onClick={() => { setEditingVenueId(null); setVenueName(''); setVenueIsOnline(false) }} type="button" variant="outline">Cancel</Button>}
              </div>
            </form>
            <ul className="mt-3 divide-y divide-[#f1dfe1]">
              {options.venues.map((option) => (
                <li className="flex flex-wrap items-center justify-between gap-2 py-3" key={option.id}>
                  <span>{option.name}{option.is_default && <span className="ml-2 rounded-full bg-[#fff0ef] px-2 py-1 text-xs font-semibold text-primary">Default</span>}{option.is_online && <span className="ml-2 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-900">Online venue</span>}</span>
                  <span className="flex flex-wrap items-center gap-3">
                    <button aria-label={`Move ${option.name} up`} className="public-text-link cursor-pointer disabled:cursor-not-allowed disabled:opacity-40" disabled={options.venues[0]?.id === option.id} onClick={() => void moveOption('venue', option.id, -1)} type="button">↑</button>
                    <button aria-label={`Move ${option.name} down`} className="public-text-link cursor-pointer disabled:cursor-not-allowed disabled:opacity-40" disabled={options.venues[options.venues.length - 1]?.id === option.id} onClick={() => void moveOption('venue', option.id, 1)} type="button">↓</button>
                    {!option.is_default && <button className="public-text-link cursor-pointer" onClick={() => void setDefault('venue', option.id)} type="button">Set default</button>}
                    <button className="public-text-link cursor-pointer" onClick={() => editVenue(option)} type="button">Edit</button>
                    <button className="cursor-pointer font-semibold text-red-800 underline transition hover:text-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2" onClick={() => void removeVenue(option)} type="button">Delete</button>
                  </span>
                </li>
              ))}
              {options.venues.length === 0 && <li className="py-3 text-sm text-[#594140]">No venues configured.</li>}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}

export function SchedulingSettingsPage() {
  const [settings, setSettings] = useState<SchedulingSettings>(initialSettings)
  const [workingHoursText, setWorkingHoursText] = useState(JSON.stringify(initialSettings.working_hours, null, 2))
  const [recipients, setRecipients] = useState<{ id: string; email: string; enabled: boolean; is_primary: boolean; created_at: string }[]>([])
  const [newRecipient, setNewRecipient] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [currentSettings, currentRecipients] = await Promise.all([getSchedulingSettings(), listSchedulingRecipients()])
      setSettings(currentSettings)
      setWorkingHoursText(JSON.stringify(currentSettings.working_hours, null, 2))
      setRecipients(currentRecipients)
    } catch (loadError) {
      setError(schedulingError(loadError))
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    let active = true
    void Promise.all([getSchedulingSettings(), listSchedulingRecipients()])
      .then(([currentSettings, currentRecipients]) => {
        if (active) {
          setSettings(currentSettings)
          setWorkingHoursText(JSON.stringify(currentSettings.working_hours, null, 2))
          setRecipients(currentRecipients)
        }
      })
      .catch((loadError: unknown) => { if (active) setError(schedulingError(loadError)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setSaving(true)
    try {
      new Intl.DateTimeFormat('en', { timeZone: settings.timezone })
      const hours: unknown = JSON.parse(workingHoursText)
      if (typeof hours !== 'object' || hours === null || Array.isArray(hours)) throw new Error('Working hours must be a JSON object keyed by weekday.')
      const typedHours = hours as Record<string, { start?: unknown; end?: unknown }>
      for (const [weekday, values] of Object.entries(typedHours)) {
        if (!/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/.test(weekday)) throw new Error(`Invalid weekday: ${weekday}`)
        if (typeof values.start !== 'string' || typeof values.end !== 'string' || !/^\d{2}:\d{2}$/.test(values.start) || !/^\d{2}:\d{2}$/.test(values.end) || values.start >= values.end) {
          throw new Error(`Set valid start/end times for ${weekday}; end must follow start.`)
        }
      }
      await saveSchedulingSettings({ ...settings, working_hours: hours as SchedulingSettings['working_hours'] })
      setNotice('Scheduling settings saved.')
    } catch (saveError) {
      setError(schedulingError(saveError))
    } finally {
      setSaving(false)
    }
  }

  async function addRecipient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    try {
      await addSchedulingRecipient(newRecipient)
      setNewRecipient('')
      await refresh()
    } catch (saveError) {
      setError(schedulingError(saveError))
    }
  }

  async function removeRecipient(id: string) {
    try {
      await removeSchedulingRecipient(id)
      await refresh()
    } catch (removeError) {
      setError(schedulingError(removeError))
    }
  }

  async function makePrimaryRecipient(id: string) {
    try {
      await setPrimarySchedulingRecipient(id)
      await refresh()
    } catch (updateError) {
      setError(schedulingError(updateError))
    }
  }

  if (loading) return <SchedulingPageShell title="Scheduling settings"><SchedulingLoading /></SchedulingPageShell>
  return (
    <SchedulingPageShell title="Scheduling settings">
      {error && <SchedulingError message={error} />}
      {notice && <p className="mb-4 rounded-xl bg-green-50 p-4 text-sm text-green-900" role="status">{notice}</p>}
      <form className="space-y-5 rounded-2xl border border-[#f1dfe1] bg-white p-5 sm:p-7" onSubmit={(event) => void saveSettings(event)}>
        <h2 className="text-xl font-bold">Appointment availability</h2>
        <label className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-950">
          <input checked={settings.public_booking_enabled} className="mt-1" onChange={(event) => setSettings({ ...settings, public_booking_enabled: event.target.checked })} type="checkbox" />
          <span><strong>Enable client-facing instant booking.</strong> Only enable after HASH has reviewed the workflow and configured production anti-abuse protections. Clients can book available slots without staff confirmation.</span>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">Scheduling timezone
            <input className={`${formFieldClass} mt-1`} onChange={(event) => setSettings({ ...settings, timezone: event.target.value })} required value={settings.timezone} />
          </label>
          <label className="text-sm font-semibold">Default duration
            <select className={`${formFieldClass} mt-1`} onChange={(event) => setSettings({ ...settings, default_duration_minutes: Number(event.target.value) })} value={settings.default_duration_minutes}>
              {[15, 30, 45, 60, 90, 120].map((duration) => <option key={duration} value={duration}>{duration} minutes</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Advance booking window (days)
            <input className={`${formFieldClass} mt-1`} max={365} min={1} onChange={(event) => setSettings({ ...settings, advance_booking_days: Number(event.target.value) })} required type="number" value={settings.advance_booking_days} />
          </label>
        </div>
        <label className="block text-sm font-semibold">Working hours (weekday keys and 24-hour start/end times)
          <textarea className={`${formFieldClass} mt-1 font-mono text-sm`} onChange={(event) => setWorkingHoursText(event.target.value)} required rows={10} value={workingHoursText} />
        </label>
        <Button disabled={saving} type="submit" variant="outline">{saving ? 'Saving…' : 'Save availability settings'}</Button>
      </form>

      <SchedulingOptionsManager />

      <section className="mt-6 rounded-2xl border border-[#f1dfe1] bg-white p-5 sm:p-7">
        <h2 className="text-xl font-bold">Scheduling notification recipients</h2>
        <p className="mt-2 text-sm text-[#594140]">Recipient addresses are stored securely for the future notification workflow. Email delivery is not configured, so adding an address will not send email.</p>
        <form className="mt-4 flex flex-wrap gap-2" onSubmit={(event) => void addRecipient(event)}>
          <label className="sr-only" htmlFor="notification-recipient">Email address</label>
          <input className={`${formFieldClass} max-w-md`} id="notification-recipient" onChange={(event) => setNewRecipient(event.target.value)} required type="email" value={newRecipient} />
          <Button type="submit" variant="outline">Add recipient</Button>
        </form>
        {recipients.length > 0 && <ul className="mt-4 divide-y divide-[#f1dfe1]">{recipients.map((recipient) => (
          <li className="flex flex-wrap justify-between gap-2 py-3" key={recipient.id}>
            <span>{recipient.email}{recipient.is_primary && <span className="ml-2 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-900">Primary</span>}</span>
            <div className="flex gap-3">
              {!recipient.is_primary && <button className="public-text-link cursor-pointer" onClick={() => void makePrimaryRecipient(recipient.id)} type="button">Set primary</button>}
              <button className="cursor-pointer font-semibold text-red-800 underline transition hover:text-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2" onClick={() => void removeRecipient(recipient.id)} type="button">Remove</button>
            </div>
          </li>
        ))}</ul>}
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <IntegrationStatus title="Google Calendar" details="Not connected. Appointment data remains in the HASH database; no client details are sent to external calendars." />
        <IntegrationStatus title="Email notifications" details="Not configured. Appointment changes are saved successfully without claiming that messages were delivered." />
      </section>
    </SchedulingPageShell>
  )
}

function IntegrationStatus({ title, details }: { title: string; details: string }) {
  return <article className="rounded-2xl border border-[#f1dfe1] bg-white p-5"><div className="flex items-center justify-between gap-2"><h2 className="font-bold">{title}</h2><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">Not configured</span></div><p className="mt-2 text-sm leading-6 text-[#594140]">{details}</p></article>
}
