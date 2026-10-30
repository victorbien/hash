import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

const baseNavigation = [
  { label: 'Dashboard', href: '/volunteer/dashboard' },
  { label: 'My profile', href: '/volunteer/profile' },
  { label: 'My availability', href: '/volunteer/availability' },
  { label: 'My training', href: '/volunteer/training' },
  { label: 'Settings', href: '/volunteer/settings' },
]
const portalNavigation = [
  ...baseNavigation.slice(0, 1),
  ...baseNavigation.slice(1, 3),
  { label: 'Opportunities', href: '/volunteer/opportunities' },
  { label: 'My activity', href: '/volunteer/activity' },
  { label: 'Announcements', href: '/volunteer/announcements' },
  { label: 'Resources', href: '/volunteer/resources' },
  ...baseNavigation.slice(3),
]

export function VolunteerLayout() {
  const { profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [signOutError, setSignOutError] = useState('')
  const navigate = useNavigate()
  async function handleSignOut() {
    try {
      await signOut()
      navigate('/volunteer/login', { replace: true })
    } catch {
      setSignOutError('Sign out could not be completed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-[#fff8f7]">
      <header className="border-b border-[#f1dfe1] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-3 font-bold text-primary" aria-label="Return to HASH public website">
            <img src="/assets/images/logo/hash_logo.png" alt="HASH logo" className="h-12 w-32 object-cover object-center" />
            <span className="text-lg">Volunteer portal</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-[#594140] sm:inline">
              {profile?.preferred_name || profile?.first_name || 'Volunteer'}
            </span>
            <button
              className="rounded-full border border-[#f1d5d8] px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-[#fff1f2] focus-visible:bg-[#fff1f2] md:hidden"
              aria-expanded={menuOpen}
              aria-controls="volunteer-navigation"
              onClick={() => setMenuOpen((open) => !open)}
              type="button"
            >
              Menu
            </button>
            <button onClick={() => void handleSignOut()} className="public-text-link hidden text-sm md:inline" type="button">
              Sign out
            </button>
          </div>
        </div>
        <nav
          id="volunteer-navigation"
          aria-label="Volunteer portal navigation"
          className={`${menuOpen ? 'block' : 'hidden'} border-t border-[#f1dfe1] px-4 py-3 md:block`}
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
            {portalNavigation.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${isActive ? 'bg-[#fce5e7] text-primary' : 'text-[#594140] hover:bg-[#fff8f7] hover:text-primary'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link to="/" className="rounded-full px-3 py-2 text-sm font-semibold text-[#594140] transition-colors hover:bg-[#fff8f7] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">Public HASH website</Link>
            <button onClick={() => void handleSignOut()} className="rounded-full px-3 py-2 text-left text-sm font-semibold text-primary transition-colors hover:bg-[#fff1f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:hidden" type="button">Sign out</button>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {signOutError && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{signOutError}</p>}
        <Outlet />
      </main>
    </div>
  )
}
