import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminGeneralPreferencesPage } from './AdminPages'

const { from, maybeSingle, update, query } = vi.hoisted(() => {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
    update: vi.fn(),
    then: vi.fn(),
  }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.update.mockReturnValue(query)
  query.then.mockImplementation((resolve: (value: unknown) => unknown) => resolve({ error: null }))
  return { from: vi.fn(), maybeSingle: query.maybeSingle, update: query.update, query }
})

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({ user: { app_metadata: { role: 'admin' } } }),
}))

vi.mock('../lib/supabase', () => ({
  supabase: { from },
}))

describe('Administrator general preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    query.update.mockReturnValue(query)
    query.then.mockImplementation((resolve: (value: unknown) => unknown) => resolve({ error: null }))
    from.mockReturnValue(query)
    maybeSingle.mockResolvedValue({ data: { inactivity_timeout_minutes: 60 }, error: null })
  })

  it('loads and saves the website-wide inactivity timeout', async () => {
    render(<MemoryRouter><AdminGeneralPreferencesPage /></MemoryRouter>)

    const timeoutInput = await screen.findByLabelText(/Session inactivity timeout/i)
    expect(timeoutInput).toHaveValue(60)
    fireEvent.change(timeoutInput, { target: { value: '30' } })
    fireEvent.click(screen.getByRole('button', { name: /save preferences/i }))

    await waitFor(() => expect(update).toHaveBeenCalledWith({ inactivity_timeout_minutes: 30 }))
    expect(await screen.findByRole('status')).toHaveTextContent(/now 30 minutes/)
  })
})
