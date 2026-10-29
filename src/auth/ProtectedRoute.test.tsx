import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthContext'
import { ProtectedRoute } from './ProtectedRoute'

const { getSession, onAuthStateChange, from, status } = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  from: vi.fn(),
  status: { value: 'pending_review' },
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession,
      onAuthStateChange,
    },
    from,
  },
}))

describe('volunteer route protection', () => {
  beforeEach(() => {
    getSession.mockResolvedValue({ data: { session: null }, error: null })
    onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
    status.value = 'pending_review'
    from.mockImplementation((table: string) => {
      const data = table === 'profiles'
        ? {
            id: 'volunteer-1',
            first_name: 'Alex',
            last_name: 'Volunteer',
            preferred_name: null,
            pronouns: null,
            phone: null,
            preferred_contact_method: null,
            location: null,
            preferred_language: null,
          }
        : {
            id: 'application-1',
            status: status.value,
            interests: [],
            availability: {},
            skills: null,
            experience: null,
            motivation: null,
            submitted_at: null,
          }
      const query = {
        select: vi.fn(),
        eq: vi.fn(),
        maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
      }
      query.select.mockReturnValue(query)
      query.eq.mockReturnValue(query)
      return query
    })
  })

  it('redirects unauthenticated visitors to sign in before rendering private content', async () => {
    render(
      <MemoryRouter initialEntries={['/volunteer/application']}>
        <AuthProvider>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/volunteer/application" element={<p>Private application data</p>} />
            </Route>
            <Route path="/volunteer/login" element={<h1>Volunteer sign in</h1>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.queryByText('Private application data')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Volunteer sign in' })).toBeInTheDocument())
  })

  it('keeps pending applicants outside the portal and directs them to application status', async () => {
    getSession.mockResolvedValue({
      data: { session: { user: { id: 'volunteer-1', email: 'alex@example.test' } } },
      error: null,
    })
    render(
      <MemoryRouter initialEntries={['/volunteer/opportunities']}>
        <AuthProvider>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/volunteer/opportunities" element={<p>Restricted opportunities</p>} />
              <Route path="/volunteer/dashboard" element={<p>Volunteer portal dashboard</p>} />
              <Route path="/volunteer/application-status" element={<p>Application status page</p>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Application status page')).toBeInTheDocument()
    expect(screen.queryByText('Volunteer portal dashboard')).not.toBeInTheDocument()
    expect(screen.queryByText('Restricted opportunities')).not.toBeInTheDocument()
  })

  it('keeps application status outside the volunteer portal for suspended accounts', async () => {
    status.value = 'suspended'
    getSession.mockResolvedValue({
      data: { session: { user: { id: 'volunteer-1', email: 'alex@example.test' } } },
      error: null,
    })
    render(
      <MemoryRouter initialEntries={['/volunteer/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/volunteer/application-status" element={<p>Application status page</p>} />
              <Route path="/volunteer/dashboard" element={<p>Volunteer portal dashboard</p>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Application status page')).toBeInTheDocument()
    expect(screen.queryByText('Volunteer portal dashboard')).not.toBeInTheDocument()
  })

  it('allows approved volunteers into the portal and redirects them away from application status', async () => {
    status.value = 'approved'
    getSession.mockResolvedValue({
      data: { session: { user: { id: 'volunteer-1', email: 'alex@example.test' } } },
      error: null,
    })
    render(
      <MemoryRouter initialEntries={['/volunteer/application-status']}>
        <AuthProvider>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/volunteer/application-status" element={<p>Application status page</p>} />
              <Route path="/volunteer/dashboard" element={<p>Trained volunteer portal</p>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Trained volunteer portal')).toBeInTheDocument()
    expect(screen.queryByText('Application status page')).not.toBeInTheDocument()
  })
})
