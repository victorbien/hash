import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VolunteerLayout } from '../components/layout/VolunteerLayout'
import {
  VolunteerDashboardPage,
  OpportunitiesPage,
  VolunteerActivityPage,
  VolunteerApplicationPage,
  VolunteerAvailabilityPage,
  VolunteerProfilePage,
  VolunteerSettingsPage,
  VolunteerTrainingPage,
} from './VolunteerPortalPages'

const { from, useAuthMock } = vi.hoisted(() => ({
  from: vi.fn(),
  useAuthMock: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({
  supabase: { from },
}))

vi.mock('../auth/useAuth', () => ({
  useAuth: useAuthMock,
}))

function query(result: { data: unknown; error: null }) {
  const promise = Promise.resolve(result)
  const builder = {
    select: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    gte: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(),
    then: promise.then.bind(promise),
  }
  builder.select.mockReturnValue(builder)
  builder.update.mockReturnValue(builder)
  builder.upsert.mockReturnValue(promise)
  builder.eq.mockReturnValue(builder)
  builder.order.mockReturnValue(builder)
  builder.gte.mockReturnValue(builder)
  builder.limit.mockReturnValue(builder)
  builder.maybeSingle.mockReturnValue(promise)
  return builder
}

function profileState() {
  return {
    user: { id: 'volunteer-1', email: 'alex@example.test' },
    profile: {
      id: 'volunteer-1',
      first_name: 'Alex',
      last_name: 'Volunteer',
      preferred_name: null,
      pronouns: null,
      phone: null,
      preferred_contact_method: null,
      location: null,
      preferred_language: null,
    },
    application: {
      id: 'application-1',
      status: 'approved',
      interests: [],
      availability: { days: ['Monday'], times: ['Morning'] },
      skills: null,
      experience: null,
      motivation: null,
      submitted_at: '2026-10-01T00:00:00Z',
    },
    refreshVolunteerData: vi.fn(),
    signOut: vi.fn(),
    loading: false,
    configured: true,
    error: null,
  }
}

describe('volunteer portal pages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthMock.mockReturnValue(profileState())
    from.mockImplementation(() => query({ data: null, error: null }))
  })

  it('shows application updates separately from the volunteer portal', () => {
    const auth = profileState()
    auth.application.status = 'pending_review'
    useAuthMock.mockReturnValue(auth)
    render(<MemoryRouter><VolunteerApplicationPage /></MemoryRouter>)
    expect(screen.getByText('Pending review')).toBeInTheDocument()
    expect(screen.getByText(new Date('2026-10-01T00:00:00Z').toLocaleDateString())).toBeInTheDocument()
    expect(screen.getByText('Volunteer application')).toHaveClass('text-xs', 'uppercase', 'text-primary')
    expect(screen.queryByText('Volunteer portal')).not.toBeInTheDocument()
  })

  it('uses the HASH brand in the portal header and navigation', () => {
    render(
      <MemoryRouter initialEntries={['/volunteer/dashboard']}>
        <Routes>
          <Route path="/volunteer" element={<VolunteerLayout />}>
            <Route path="dashboard" element={<p>Dashboard content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('img', { name: 'HASH logo' })).toHaveClass('h-12', 'w-32', 'object-cover')
    expect(screen.getByRole('navigation', { name: 'Volunteer portal navigation' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Public HASH website' })).toHaveAttribute('href', '/')
    expect(screen.queryByRole('link', { name: 'My application' })).not.toBeInTheDocument()
  })

  it('does not show applicant statuses in the volunteer dashboard', () => {
    render(<MemoryRouter><VolunteerDashboardPage /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: /welcome, alex/i })).toBeInTheDocument()
    expect(screen.queryByText(/application status/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/pending review/i)).not.toBeInTheDocument()
  })

  it('saves only editable profile and application fields', async () => {
    const auth = profileState()
    useAuthMock.mockReturnValue(auth)
    from.mockImplementation(() => query({ data: { id: 'saved-row' }, error: null }))
    render(<VolunteerProfilePage />)
    expect(screen.getByRole('button', { name: /save profile/i })).toHaveClass('public-outline-link')
    fireEvent.change(screen.getByLabelText(/^First name/), { target: { value: 'Alexandra' } })
    fireEvent.click(screen.getByRole('button', { name: /save profile/i }))

    expect(await screen.findByRole('status')).toHaveTextContent(/profile has been updated/)
    expect(from).toHaveBeenCalledWith('profiles')
    expect(from).toHaveBeenCalledWith('volunteer_applications')
    expect(auth.refreshVolunteerData).toHaveBeenCalled()
  })

  it('persists structured availability without implying a booked shift', async () => {
    from.mockImplementation(() => query({ data: { id: 'saved-row' }, error: null }))
    render(<VolunteerAvailabilityPage />)
    fireEvent.click(screen.getByLabelText('Tuesday'))
    fireEvent.click(screen.getByRole('button', { name: /save availability/i }))

    expect(await screen.findByRole('status')).toHaveTextContent(/does not book a shift/)
    expect(from).toHaveBeenCalledWith('volunteer_applications')
  })

  it('shows an empty state instead of fabricated opportunities', async () => {
    render(<MemoryRouter><OpportunitiesPage /></MemoryRouter>)
    expect(await screen.findByText(/No published opportunities are available/)).toBeInTheDocument()
  })

  it('shows an empty activity state when no participation is recorded', async () => {
    render(<VolunteerActivityPage />)
    await waitFor(() => expect(screen.getByText(/No activity has been recorded/)).toBeInTheDocument())
  })

  it('records training as in progress but never marks it completed', async () => {
    from.mockImplementation((table: string) => {
      if (table === 'training_resources') {
        return query({
          data: [{
            id: 'training-1',
            title: 'Volunteer induction',
            description: 'Approved induction resource',
            resource_url: 'https://example.test/induction',
            resource_path: null,
            required: true,
            approval_required: true,
          }],
          error: null,
        })
      }
      return query({ data: [], error: null })
    })
    render(<VolunteerTrainingPage />)
    fireEvent.click(await screen.findByRole('button', { name: /mark in progress/i }))

    expect(await screen.findByText(/Status: In progress/)).toBeInTheDocument()
    expect(screen.getByText(/does not mark it complete/)).toBeInTheDocument()
  })

  it('signs out through the authentication provider', async () => {
    const auth = profileState()
    useAuthMock.mockReturnValue(auth)
    render(
      <MemoryRouter initialEntries={['/volunteer/settings']}>
        <Routes>
          <Route path="/volunteer/settings" element={<VolunteerSettingsPage />} />
          <Route path="/volunteer/login" element={<p>Sign-in page</p>} />
        </Routes>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: /^sign out$/i }))

    expect(await screen.findByText('Sign-in page')).toBeInTheDocument()
    expect(auth.signOut).toHaveBeenCalled()
  })
})
