import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PublicSchedulingPage } from './PublicSchedulingPage'

const { getPublicAppointmentOptions, getPublicAppointmentSlots, getPublicSchedulingInfo, createPublicAppointment } = vi.hoisted(() => ({
  getPublicAppointmentOptions: vi.fn(),
  getPublicAppointmentSlots: vi.fn(),
  getPublicSchedulingInfo: vi.fn(),
  createPublicAppointment: vi.fn(),
}))

vi.mock('../scheduling/data', () => ({
  getPublicAppointmentOptions,
  getPublicAppointmentSlots,
  getPublicSchedulingInfo,
  createPublicAppointment,
}))

function renderBookingPage() {
  return render(<MemoryRouter><PublicSchedulingPage /></MemoryRouter>)
}

describe('client appointment booking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getPublicAppointmentOptions.mockResolvedValue({
      types: [
        { id: 'prep', name: 'PrEP', online_eligible: false, display_order: 0, is_default: true },
        { id: 'eprep', name: 'ePrEP', online_eligible: true, display_order: 1, is_default: false },
        { id: 'hiv', name: 'HIV Testing', online_eligible: false, display_order: 2, is_default: false },
        { id: 'labs', name: 'Laboratory Tests', online_eligible: false, display_order: 3, is_default: false },
        { id: 'stk', name: 'Self-Test Kit (STK)', online_eligible: true, display_order: 4, is_default: false },
      ],
      venues: [
        { id: 'clinic', name: 'HASH Clinic', is_online: false, display_order: 0, is_default: true },
        { id: 'achieve', name: 'ACHIEVE', is_online: false, display_order: 1, is_default: false },
        { id: 'online', name: 'Online', is_online: true, display_order: 2, is_default: false },
      ],
    })
    getPublicSchedulingInfo.mockResolvedValue({
      timezone: 'Asia/Manila',
      advance_booking_days: 90,
      default_duration_minutes: 30,
      public_booking_enabled: true,
    })
    getPublicAppointmentSlots.mockResolvedValue([
      { slot_start: '2026-10-27T01:00:00.000Z', duration_minutes: 30, timezone: 'Asia/Manila' },
    ])
    createPublicAppointment.mockResolvedValue('HASH-AB12CD34')
  })

  it('books the selected available slot and shows the returned reference without claiming email was sent', async () => {
    const user = userEvent.setup()
    renderBookingPage()

    await user.click(await screen.findByRole('button', { name: '9:00 AM' }))
    await user.type(screen.getByRole('textbox', { name: 'First name' }), 'Taylor')
    await user.type(screen.getByRole('textbox', { name: 'Last name' }), 'Client')
    await user.click(screen.getByRole('button', { name: 'Confirm appointment' }))

    expect(createPublicAppointment).toHaveBeenCalledWith(expect.objectContaining({
      client_first_name: 'Taylor',
      client_last_name: 'Client',
      client_email: null,
      client_phone: null,
      appointment_type: 'PrEP',
      venue: 'HASH Clinic',
      start_at: '2026-10-27T01:00:00.000Z',
    }), '')
    expect(await screen.findByRole('heading', { name: 'Your appointment is booked.' })).toBeInTheDocument()
    expect(screen.getByText('HASH-AB12CD34')).toBeInTheDocument()
    expect(screen.getByText('Keep this reference for your records. No confirmation email or text message has been sent.')).toBeInTheDocument()
  })

  it('shows contact guidance instead of disabled booking fields when public booking is disabled', async () => {
    getPublicSchedulingInfo.mockResolvedValue({
      timezone: 'Asia/Manila',
      advance_booking_days: 90,
      default_duration_minutes: 30,
      public_booking_enabled: false,
    })
    renderBookingPage()

    expect(await screen.findByRole('heading', { name: 'Online booking is unavailable' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Contact HASH' })).toHaveAttribute('href', '/contact')
    expect(getPublicAppointmentSlots).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Confirm appointment' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Appointment type')).not.toBeInTheDocument()
  })

  it('keeps the selected appointment time visible and marked as selected', async () => {
    const user = userEvent.setup()
    renderBookingPage()

    const timeSlot = await screen.findByRole('button', { name: '9:00 AM' })
    await user.click(timeSlot)

    expect(timeSlot).toBeInTheDocument()
    expect(timeSlot).toHaveAttribute('aria-pressed', 'true')
    expect(timeSlot).toHaveClass('is-selected')
  })

  it('links the booking error contact guidance to the Contact page', async () => {
    const user = userEvent.setup()
    createPublicAppointment.mockRejectedValueOnce(
      new Error('We could not complete your booking. Please try again or contact HASH.'),
    )
    renderBookingPage()

    await user.click(await screen.findByRole('button', { name: '9:00 AM' }))
    await user.type(screen.getByRole('textbox', { name: 'First name' }), 'Taylor')
    await user.type(screen.getByRole('textbox', { name: 'Last name' }), 'Client')
    await user.click(screen.getByRole('button', { name: 'Confirm appointment' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('We could not complete your booking. Please try again or contact HASH.')
    expect(within(alert).getByRole('link', { name: 'contact HASH' })).toHaveAttribute('href', '/contact')
  })

  it('loads configured types and venues and applies per-type online eligibility', async () => {
    const user = userEvent.setup()
    getPublicAppointmentOptions.mockResolvedValue({
      types: [{ id: 'remote', name: 'Remote consultation', online_eligible: true, display_order: 0, is_default: true }],
      venues: [{ id: 'virtual', name: 'Virtual clinic', is_online: true, display_order: 0, is_default: true }],
    })
    renderBookingPage()

    const typeSelect = await screen.findByRole('combobox', { name: 'Appointment type' })
    const venueSelect = screen.getByRole('combobox', { name: 'Venue' })
    expect(typeSelect).toHaveValue('Remote consultation')
    expect(venueSelect).toHaveValue('Virtual clinic')
    expect(await screen.findByRole('button', { name: '9:00 AM' })).toBeInTheDocument()
    expect(getPublicAppointmentSlots).toHaveBeenCalledWith(expect.any(String), 'Remote consultation', 'Virtual clinic')

    await user.selectOptions(typeSelect, 'Remote consultation')
    expect(typeSelect).toHaveValue('Remote consultation')
  })

  it('uses the configured default appointment type and venue', async () => {
    getPublicAppointmentOptions.mockResolvedValue({
      types: [
        { id: 'prep', name: 'PrEP', online_eligible: false, display_order: 0, is_default: false },
        { id: 'eprep', name: 'ePrEP', online_eligible: true, display_order: 1, is_default: true },
      ],
      venues: [
        { id: 'clinic', name: 'HASH Clinic', is_online: false, display_order: 0, is_default: false },
        { id: 'online', name: 'Online', is_online: true, display_order: 1, is_default: true },
      ],
    })
    renderBookingPage()

    expect(await screen.findByRole('combobox', { name: 'Appointment type' })).toHaveValue('ePrEP')
    expect(screen.getByRole('combobox', { name: 'Venue' })).toHaveValue('Online')
  })

  it('refreshes availability after the selected slot is booked by another client', async () => {
    const user = userEvent.setup()
    createPublicAppointment.mockRejectedValueOnce(new Error('That time is no longer available. Choose another available time.'))
    renderBookingPage()
    await user.click(await screen.findByRole('button', { name: '9:00 AM' }))
    await user.type(screen.getByRole('textbox', { name: 'First name' }), 'Taylor')
    await user.type(screen.getByRole('textbox', { name: 'Last name' }), 'Client')
    await user.click(screen.getByRole('button', { name: 'Confirm appointment' }))

    await waitFor(() => expect(getPublicAppointmentSlots).toHaveBeenCalledTimes(2))
    expect(await screen.findByRole('alert')).toHaveTextContent('That time was just booked. Choose another available time.')
  })
})
