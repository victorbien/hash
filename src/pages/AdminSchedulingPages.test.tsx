import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SchedulingOptionsManager } from './AdminSchedulingPages'

const {
  getAppointmentOptions,
  saveAppointmentType,
  saveAppointmentVenue,
  deleteAppointmentType,
  deleteAppointmentVenue,
  setDefaultAppointmentOption,
  reorderAppointmentOptions,
} = vi.hoisted(() => ({
  getAppointmentOptions: vi.fn(),
  saveAppointmentType: vi.fn(),
  saveAppointmentVenue: vi.fn(),
  deleteAppointmentType: vi.fn(),
  deleteAppointmentVenue: vi.fn(),
  setDefaultAppointmentOption: vi.fn(),
  reorderAppointmentOptions: vi.fn(),
}))

vi.mock('../scheduling/data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../scheduling/data')>()
  return {
    ...actual,
    getAppointmentOptions,
    saveAppointmentType,
    saveAppointmentVenue,
    deleteAppointmentType,
    deleteAppointmentVenue,
    setDefaultAppointmentOption,
    reorderAppointmentOptions,
  }
})

describe('scheduling appointment options', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    getAppointmentOptions.mockResolvedValue({
      types: [
        { id: 'type-prep', name: 'PrEP', online_eligible: false, display_order: 0, is_default: true },
        { id: 'type-hiv', name: 'HIV Testing', online_eligible: false, display_order: 1, is_default: false },
      ],
      venues: [
        { id: 'venue-clinic', name: 'HASH Clinic', is_online: false, display_order: 0, is_default: true },
        { id: 'venue-achieve', name: 'ACHIEVE', is_online: false, display_order: 1, is_default: false },
      ],
    })
  })

  it('edits and deletes appointment types, and adds and deletes venues', async () => {
    const user = userEvent.setup()
    render(<SchedulingOptionsManager />)

    const typeRow = await screen.findByText('PrEP')
    await user.click(within(typeRow.closest('li')!).getByRole('button', { name: 'Edit' }))
    const typeInput = screen.getByRole('textbox', { name: 'Type name' })
    await user.clear(typeInput)
    await user.type(typeInput, 'PrEP Plus')
    await user.click(screen.getByRole('checkbox', { name: 'Allow this type at the venue marked as online' }))
    await user.click(screen.getByRole('button', { name: 'Save type' }))

    await waitFor(() => expect(saveAppointmentType).toHaveBeenCalledWith({
      id: 'type-prep',
      name: 'PrEP Plus',
      online_eligible: true,
    }))

    await user.type(screen.getByRole('textbox', { name: 'Venue name' }), 'Community site')
    await user.click(screen.getByRole('button', { name: 'Add venue' }))
    await waitFor(() => expect(saveAppointmentVenue).toHaveBeenCalledWith({
      id: undefined,
      name: 'Community site',
      is_online: false,
    }))

    await user.click(within(screen.getByText('PrEP').closest('li')!).getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(deleteAppointmentType).toHaveBeenCalledWith('type-prep'))

    await user.click(within(screen.getByText('HASH Clinic').closest('li')!).getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(deleteAppointmentVenue).toHaveBeenCalledWith('venue-clinic'))
  })

  it('reorders options and sets a primary appointment type and venue', async () => {
    const user = userEvent.setup()
    render(<SchedulingOptionsManager />)
    await screen.findByText('HIV Testing')

    await user.click(screen.getByRole('button', { name: 'Move HIV Testing up' }))
    await waitFor(() => expect(reorderAppointmentOptions).toHaveBeenCalledWith('type', ['type-hiv', 'type-prep']))

    await user.click(screen.getAllByRole('button', { name: 'Set default' })[0])
    await waitFor(() => expect(setDefaultAppointmentOption).toHaveBeenCalledWith('type', 'type-hiv'))
    expect(await screen.findByRole('status')).toHaveTextContent('Default appointment type updated.')
  })
})
