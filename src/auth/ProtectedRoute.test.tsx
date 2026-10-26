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

  it('allows a pending applicant to see their application but redirects them from opportunities', async () => {
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
              <Route path="/volunteer/dashboard" element={<p>Pending dashboard</p>} />
              <Route path="/volunteer/application" element={<p>My application</p>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Pending dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Restricted opportunities')).not.toBeInTheDocument()
  })

  it('restricts a suspended account to its status page', async () => {
    status.value = 'suspended'
    getSession.mockResolvedValue({
      data: { session: { user: { id: 'volunteer-1', email: 'alex@example.test' } } },
      error: null,
    })
    render(
      <MemoryRouter initialEntries={['/volunteer/application']}>
        <AuthProvider>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/volunteer/application" element={<p>Private application data</p>} />
              <Route path="/volunteer/dashboard" element={<p>Restricted account status</p>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Restricted account status')).toBeInTheDocument()
    expect(screen.queryByText('Private application data')).not.toBeInTheDocument()
  })
})
