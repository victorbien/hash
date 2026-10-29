import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminVolunteerSignupsPage } from './AdminVolunteerSignupsPage'

const { from, invoke, useAuthMock } = vi.hoisted(() => ({
  from: vi.fn(),
  invoke: vi.fn(),
  useAuthMock: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({
  supabase: { from, functions: { invoke } },
}))

vi.mock('../auth/useAuth', () => ({
  useAuth: useAuthMock,
}))

const signup = {
  id: 'signup-1',
  first_name: 'Alex',
  last_name: 'Volunteer',
  pronouns: 'they/them',
  contact_number: '+639123456789',
  email: 'alex@example.test',
  preferred_contact_method: 'email',
  created_at: '2026-10-25T00:00:00Z',
  expires_at: '2026-11-08T00:00:00Z',
  policies_acknowledged: true,
  converted_at: null,
}

describe('administrator volunteer sign-ups', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthMock.mockReturnValue({ user: { app_metadata: { role: 'admin' } } })
    const query = {
      select: vi.fn(),
      is: vi.fn(),
      gt: vi.fn(),
      order: vi.fn(),
    }
    query.select.mockReturnValue(query)
    query.is.mockReturnValue(query)
    query.gt.mockReturnValue(query)
    query.order.mockResolvedValue({ data: [signup], error: null })
    from.mockReturnValue(query)
  })

  it('lists sign-ups and requires confirmation before inviting an account', async () => {
    render(<AdminVolunteerSignupsPage />)

    expect(await screen.findByRole('heading', { name: 'Alex Volunteer' })).toBeInTheDocument()
    expect(screen.getByText('they/them')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /create account and invite/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/confirm the application communications agreement/i)
    expect(invoke).not.toHaveBeenCalled()
  })

  it('invokes the secure conversion and confirms that the account remains pending', async () => {
    invoke.mockResolvedValue({ data: { success: true }, error: null })
    render(<AdminVolunteerSignupsPage />)
    fireEvent.click(await screen.findByLabelText(/I confirm I have explained/))
    fireEvent.click(screen.getByRole('button', { name: /create account and invite/i }))

    await waitFor(() => expect(invoke).toHaveBeenCalledWith('admin-convert-volunteer-signup', {
      body: { signup_id: 'signup-1', application_communications_acknowledged: true },
    }))
    expect(await screen.findByRole('status')).toHaveTextContent(/application remains pending/)
    expect(screen.queryByRole('heading', { name: 'Alex Volunteer' })).not.toBeInTheDocument()
  })

  it('shows the conversion function error instead of a generic failure', async () => {
    invoke.mockResolvedValue({
      data: null,
      error: new FunctionsHttpError(new Response(
        JSON.stringify({ success: false, error: 'The volunteer account invitation service is not configured.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )),
    })
    render(<AdminVolunteerSignupsPage />)
    fireEvent.click(await screen.findByLabelText(/I confirm I have explained/))
    fireEvent.click(screen.getByRole('button', { name: /create account and invite/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('The volunteer account invitation service is not configured.')
  })

  it('does not expose volunteer sign-ups to non-administrators', () => {
    useAuthMock.mockReturnValue({ user: { app_metadata: { role: 'editor' } } })
    render(<AdminVolunteerSignupsPage />)

    expect(screen.getByRole('heading', { name: 'Access not authorised' })).toBeInTheDocument()
    expect(from).not.toHaveBeenCalled()
  })
})
