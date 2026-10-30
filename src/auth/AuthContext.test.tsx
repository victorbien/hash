import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthContext'
import { useAuth } from './useAuth'

const { getSession, onAuthStateChange, signOut, from, preferenceMinutes } = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signOut: vi.fn(),
  from: vi.fn(),
  preferenceMinutes: { value: 1 },
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: { getSession, onAuthStateChange, signOut },
    from,
  },
}))

function SessionStatus() {
  const { user } = useAuth()
  return <p>{user?.id ?? 'signed out'}</p>
}

describe('site-wide inactivity timeout', () => {
  beforeEach(() => {
    vi.useRealTimers()
    localStorage.clear()
    vi.clearAllMocks()
    preferenceMinutes.value = 1
    getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'staff-user', app_metadata: { role: 'admin' } },
        },
      },
      error: null,
    })
    onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
    signOut.mockResolvedValue({ error: null })
    from.mockImplementation((table: string) => {
      const query = {
        select: vi.fn(),
        eq: vi.fn(),
        maybeSingle: vi.fn(),
      }
      query.select.mockReturnValue(query)
      query.eq.mockReturnValue(query)
      query.maybeSingle.mockResolvedValue(table === 'general_preferences'
        ? { data: { inactivity_timeout_minutes: preferenceMinutes.value }, error: null }
        : { data: null, error: null })
      return query
    })
  })

  it('signs an authenticated session out after the configured idle period', async () => {
    vi.useFakeTimers()
    const now = new Date('2026-10-26T10:00:00Z')
    vi.setSystemTime(now)
    localStorage.setItem('hash:last-authenticated-activity', String(now.getTime() - 60_000))

    render(<AuthProvider><SessionStatus /></AuthProvider>)
    await act(async () => { await Promise.resolve(); await Promise.resolve() })
    expect(screen.getByText('staff-user')).toBeInTheDocument()

    await act(async () => { await vi.advanceTimersByTimeAsync(1000) })

    expect(signOut).toHaveBeenCalledOnce()
  })

  it('resets inactivity after user activity', async () => {
    vi.useFakeTimers()
    const now = new Date('2026-10-26T10:00:00Z')
    vi.setSystemTime(now)
    localStorage.setItem('hash:last-authenticated-activity', String(now.getTime() - 59_000))

    render(<AuthProvider><SessionStatus /></AuthProvider>)
    await act(async () => { await Promise.resolve(); await Promise.resolve() })
    expect(screen.getByText('staff-user')).toBeInTheDocument()

    await act(async () => {
      window.dispatchEvent(new Event('keydown'))
      await vi.advanceTimersByTimeAsync(59_000)
    })
    expect(signOut).not.toHaveBeenCalled()

    await act(async () => { await vi.advanceTimersByTimeAsync(2000) })
    expect(signOut).toHaveBeenCalledOnce()
  })

  it('does not let activity after the timeout revive an expired session', async () => {
    vi.useFakeTimers()
    const now = new Date('2026-10-26T10:00:00Z')
    vi.setSystemTime(now)
    localStorage.setItem('hash:last-authenticated-activity', String(now.getTime() - 60_000))

    render(<AuthProvider><SessionStatus /></AuthProvider>)
    await act(async () => { await Promise.resolve(); await Promise.resolve() })
    expect(screen.getByText('staff-user')).toBeInTheDocument()
    await act(async () => { window.dispatchEvent(new Event('keydown')) })

    expect(signOut).toHaveBeenCalledOnce()
  })
})
