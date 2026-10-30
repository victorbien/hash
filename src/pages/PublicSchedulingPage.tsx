import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import {
  createPublicAppointment,
  getPublicAppointmentOptions,
  getPublicAppointmentSlots,
  getPublicSchedulingInfo,
} from '../scheduling/data'
import type {
  AppointmentOptions,
  AppointmentType,
  AppointmentVenue,
  PublicAppointmentSlot,
  PublicSchedulingInfo,
} from '../scheduling/data'

const fieldClass = 'mt-1 w-full rounded-xl border border-[#f1dfe1] bg-white p-3 outline-none focus:border-primary'

function publicDateInTimezone(timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${value.year}-${value.month}-${value.day}`
}

function addDays(date: string, days: number) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

function friendlyError(error: unknown) {
  if (!(error instanceof Error)) return 'We could not complete your booking. Please try again or contact HASH.'
  if (error.message.includes('no longer available')) return 'That time was just booked. Choose another available time.'
  if (error.message.includes('not configured') || error.message.includes('not available')) return 'Online booking is not available yet. Please contact HASH for appointment options.'
  return error.message
}

export function PublicSchedulingPage() {
  const [info, setInfo] = useState<PublicSchedulingInfo | null>(null)
  const [options, setOptions] = useState<AppointmentOptions | null>(null)
  const [date, setDate] = useState('')
  const [type, setType] = useState<AppointmentType>('')
  const [venue, setVenue] = useState<AppointmentVenue>('')
  const [slotResults, setSlotResults] = useState<{ key: string; slots: PublicAppointmentSlot[] } | null>(null)
  const [selectedSlot, setSelectedSlot] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reference, setReference] = useState<string | null>(null)
  const slotQueryKey = `${date}|${type}|${venue}`
  const slots = slotResults?.key === slotQueryKey ? slotResults.slots : []
  const selectedType = options?.types.find((item) => item.name === type)
  const selectedVenue = options?.venues.find((item) => item.name === venue)
  const validVenueType = Boolean(selectedType && selectedVenue && (!selectedVenue.is_online || selectedType.online_eligible))
  const slotsLoading = Boolean(info?.public_booking_enabled && date && validVenueType && slotResults?.key !== slotQueryKey)

  useEffect(() => {
    let active = true
    void Promise.all([getPublicSchedulingInfo(), getPublicAppointmentOptions()])
      .then(([settings, appointmentOptions]) => {
        if (active) {
          const defaultVenue = appointmentOptions.venues.find((item) => item.is_default)
            ?? appointmentOptions.venues.find((item) => !item.is_online)
            ?? appointmentOptions.venues[0]
          const defaultType = appointmentOptions.types.find((item) => item.is_default)
            ?? appointmentOptions.types[0]
          const initialType = defaultVenue?.is_online
            ? appointmentOptions.types.find((item) => item.is_default && item.online_eligible)
              ?? appointmentOptions.types.find((item) => item.online_eligible)
              ?? defaultType
            : defaultType
          setInfo(settings)
          setOptions(appointmentOptions)
          setType(initialType?.name ?? '')
          setVenue(defaultVenue?.name ?? '')
          setDate(publicDateInTimezone(settings.timezone))
        }
      })
      .catch((loadError: unknown) => { if (active) setError(friendlyError(loadError)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!info || !info.public_booking_enabled || !date || !validVenueType) {
      return
    }
    let active = true
    const key = `${date}|${type}|${venue}`
    void getPublicAppointmentSlots(date, type, venue)
      .then((available) => { if (active) setSlotResults({ key, slots: available }) })
      .catch((loadError: unknown) => {
        if (active) {
          setSlotResults({ key, slots: [] })
          setError(friendlyError(loadError))
        }
      })
    return () => { active = false }
  }, [date, info, type, validVenueType, venue])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!info || !selectedSlot) {
      setError('Choose an available appointment time.')
      return
    }
    setSubmitting(true)
    try {
      const result = await createPublicAppointment({
        client_first_name: firstName,
        client_last_name: lastName,
        client_email: email || null,
        client_phone: phone || null,
        appointment_type: type,
        venue,
        start_at: selectedSlot,
      }, honeypot)
      setReference(result)
    } catch (bookingError) {
      setError(friendlyError(bookingError))
      if (bookingError instanceof Error && bookingError.message.includes('no longer available')) {
        setSelectedSlot('')
        const refreshed = await getPublicAppointmentSlots(date, type, venue).catch((refreshError: unknown) => {
          setError(friendlyError(refreshError))
          return null
        })
        if (refreshed) setSlotResults({ key: slotQueryKey, slots: refreshed })
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <section className="mx-auto max-w-3xl px-4 py-16 text-center" role="status">Loading appointment availability…</section>
  }

  if (reference) {
    const booked = slots.find((slot) => slot.slot_start === selectedSlot)
    return (
      <section className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-3xl border border-green-200 bg-white p-8 shadow-sm">
          <p className="font-semibold text-green-800">Appointment confirmed</p>
          <h1 className="mt-2 text-3xl font-bold">Your appointment is booked.</h1>
          <p className="mt-4 leading-7 text-[#594140]">
            Keep this reference for your records. No confirmation email or text message has been sent.
          </p>
          <dl className="mt-6 space-y-3 rounded-2xl bg-[#fff8f7] p-5">
            <div><dt className="text-sm font-semibold text-[#715b5b]">Reference</dt><dd className="font-bold">{reference}</dd></div>
            <div><dt className="text-sm font-semibold text-[#715b5b]">Service</dt><dd>{type}</dd></div>
            <div><dt className="text-sm font-semibold text-[#715b5b]">Venue</dt><dd>{venue}</dd></div>
            <div><dt className="text-sm font-semibold text-[#715b5b]">Date and time ({info?.timezone})</dt><dd>{booked ? new Date(booked.slot_start).toLocaleString('en', { dateStyle: 'full', timeStyle: 'short', timeZone: booked.timezone }) : selectedSlot}</dd></div>
          </dl>
          <p className="mt-5 text-sm leading-6 text-[#594140]">If you need to change this appointment or need venue details, please <Link className="public-text-link" to="/contact">contact HASH</Link> and provide your reference.</p>
          <Button as="link" className="mt-6" to="/" variant="outline">Return to HASH website</Button>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-[#f3dfe0] bg-white p-6 shadow-sm sm:p-9">
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.15em] text-primary">Confidential appointments</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Book an appointment with HASH</h1>
        <p className="mt-4 max-w-2xl leading-7 text-[#594140]">
          Choose a service, venue, and available time. Your booking is confirmed immediately. Please do not include test results, HIV status, or other clinical details.
        </p>

        {error && (
          <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-900" role="alert">
            {(() => {
              const contactIndex = error.toLowerCase().indexOf('contact hash')
              if (contactIndex < 0) return error
              return (
                <>
                  {error.slice(0, contactIndex)}
                  <Link className="font-semibold underline" to="/contact">{error.slice(contactIndex, contactIndex + 'contact HASH'.length)}</Link>
                  {error.slice(contactIndex + 'contact HASH'.length)}
                </>
              )
            })()}
          </p>
        )}
        {info?.public_booking_enabled === false ? (
          <div className="mt-8 flex flex-col items-start gap-4 rounded-2xl border border-[#f1d5d8] bg-[#fff8f7] p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-[League_Spartan] text-xl font-bold text-[#251818]">Online booking is unavailable</h2>
              <p className="mt-2 text-sm leading-6 text-[#594140]">Contact HASH to ask about arranging an appointment.</p>
            </div>
            <Button as="link" to="/contact" variant="outline">Contact HASH</Button>
          </div>
        ) : info?.public_booking_enabled && (!options?.types.length || !options.venues.length) ? (
          <p className="mt-7 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            Appointment options are not configured yet. Please contact HASH for assistance.
          </p>
        ) : info?.public_booking_enabled && options && (

        <div className="mt-7 flex flex-col gap-12">
        <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold">Appointment type
              <select className={fieldClass} disabled={!info?.public_booking_enabled} onChange={(event) => {
                const nextType = event.target.value
                const nextTypeOption = options.types.find((item) => item.name === nextType)
                setType(nextType)
                if (selectedVenue?.is_online && !nextTypeOption?.online_eligible) {
                  const inPersonVenue = options.venues.find((item) => !item.is_online)
                  if (inPersonVenue) setVenue(inPersonVenue.name)
                }
                setSelectedSlot('')
              }} value={type}>
                {options.types
                  .filter((item) => !selectedVenue?.is_online || item.online_eligible)
                  .map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">Venue
              <select className={fieldClass} disabled={!info?.public_booking_enabled} onChange={(event) => {
                const nextVenue = options.venues.find((item) => item.name === event.target.value)
                setVenue(event.target.value)
                if (nextVenue?.is_online && !selectedType?.online_eligible) {
                  const onlineType = options.types.find((item) => item.online_eligible)
                  if (onlineType) setType(onlineType.name)
                }
                setSelectedSlot('')
              }} value={venue}>
                {options.venues.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">Date ({info?.timezone ?? 'local clinic time'})
              <input
                className={fieldClass}
                disabled={!info?.public_booking_enabled}
                max={info && date ? addDays(publicDateInTimezone(info.timezone), info.advance_booking_days) : undefined}
                min={info ? publicDateInTimezone(info.timezone) : undefined}
                onChange={(event) => { setDate(event.target.value); setSelectedSlot('') }}
                required
                type="date"
                value={date}
              />
            </label>
          </div>

          <fieldset className="rounded-2xl border border-[#f1dfe1] p-4">
            <legend className="px-2 font-bold">Available times</legend>
            {!info?.public_booking_enabled ? (
              <p className="text-sm text-[#594140]">Online booking is not enabled yet. Please contact HASH to arrange an appointment.</p>
            ) : !validVenueType ? (
              <p className="text-sm text-amber-900">This appointment type is not available at the selected venue.</p>
            ) : slotsLoading ? (
              <p className="text-sm" role="status">Checking available times…</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-[#594140]">No available times on this date. Choose another date or contact HASH for help.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => {
                  const time = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit', timeZone: slot.timezone }).format(new Date(slot.slot_start))
                  const selected = selectedSlot === slot.slot_start
                  return (
                    <button
                      aria-pressed={selected}
                      className={`appointment-time-slot rounded-full border px-4 py-2 text-sm font-semibold ${selected ? 'is-selected' : ''}`}
                      key={slot.slot_start}
                      onClick={() => setSelectedSlot(slot.slot_start)}
                      type="button"
                    >
                      {time}
                    </button>
                  )
                })}
              </div>
            )}
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold">First name
              <input autoComplete="given-name" className={fieldClass} maxLength={120} onChange={(event) => setFirstName(event.target.value)} required value={firstName} />
            </label>
            <label className="text-sm font-semibold">Last name
              <input autoComplete="family-name" className={fieldClass} maxLength={120} onChange={(event) => setLastName(event.target.value)} required value={lastName} />
            </label>
            <label className="text-sm font-semibold">Email (optional)
              <input autoComplete="email" className={fieldClass} maxLength={320} onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
            </label>
            <label className="text-sm font-semibold">Phone (optional)
              <input autoComplete="tel" className={fieldClass} maxLength={80} onChange={(event) => setPhone(event.target.value)} type="tel" value={phone} />
            </label>
          </div>
          <p className="text-sm leading-6 text-[#594140]">Your contact details are optional. HASH stores the information needed to manage this appointment securely. No email or text notifications are currently sent.</p>

          <label aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden" htmlFor="website">Leave this field empty</label>
          <input aria-hidden="true" autoComplete="off" className="absolute -left-[10000px] h-px w-px overflow-hidden" id="website" onChange={(event) => setHoneypot(event.target.value)} tabIndex={-1} type="text" value={honeypot} />

          <div className="mt-4 flex justify-center">
            <Button
              className="w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              disabled={!info?.public_booking_enabled || !selectedSlot || slotsLoading || submitting}
              type="submit"
              variant="outline"
            >
              {submitting ? 'Booking…' : 'Confirm appointment'}
            </Button>
          </div>
        </form>
        <p className="text-xs text-[#715b5b]">This booking system is for scheduling only, not urgent support or clinical advice. For help, <Link className="public-text-link" to="/contact">contact HASH</Link>.</p>
        </div>
        )}
      </div>
    </section>
  )
}
