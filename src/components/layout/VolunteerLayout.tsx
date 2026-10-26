import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

const baseNavigation = [
  { label: 'Dashboard', href: '/volunteer/dashboard' },
  { label: 'My application', href: '/volunteer/application' },
  { label: 'My profile', href: '/volunteer/profile' },
  { label: 'My availability', href: '/volunteer/availability' },
  { label: 'My training', href: '/volunteer/training' },
  { label: 'Settings', href: '/volunteer/settings' },
]
const approvedNavigation = [
  { label: 'Opportunities', href: '/volunteer/opportunities' },
  { label: 'My activity', href: '/volunteer/activity' },
  { label: 'Announcements', href: '/volunteer/announcements' },
  { label: 'Resources', href: '/volunteer/resources' },
]

export function VolunteerLayout() {
  const { application, profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [signOutError, setSignOutError] = useState('')
  const navigate = useNavigate()
  const status = application?.status
  const restricted = status === 'suspended' || status === 'inactive' || status === 'not_approved'
  const navigation = restricted
    ? [{ label: 'Dashboard', href: '/volunteer/dashboard' }]
    : status === 'approved'
      ? [...baseNavigation.slice(0, 2), ...approvedNavigation, ...baseNavigation.slice(2)]
      : baseNavigation

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
          <Link to="/" className="flex items-center gap-3 font-bold text-primary" aria-label="Return to HASH public website">
            <img src="/assets/images/logo/hash_logo.png" alt="" className="h-12 w-auto" />
            <span className="hidden sm:inline">Volunteer portal</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-[#594140] sm:inline">
              {profile?.preferred_name || profile?.first_name || 'Volunteer'}
            </span>
            <button
              className="rounded-full border border-[#f1dfe1] px-4 py-2 text-sm font-semibold text-primary hover:bg-[#fff1f2] md:hidden"
              aria-expanded={menuOpen}
              aria-controls="volunteer-navigation"
              onClick={() => setMenuOpen((open) => !open)}
            >
              Menu
            </button>
            <button onClick={() => void handleSignOut()} className="hidden text-sm font-semibold text-primary hover:underline md:inline">
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
            {navigation.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-[#fff0ef] text-primary' : 'text-[#594140] hover:bg-[#fff8f7] hover:text-primary'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link to="/" className="rounded-full px-3 py-2 text-sm font-semibold text-[#594140] transition-colors hover:bg-[#fff8f7] hover:text-primary">Public HASH website</Link>
            <button onClick={() => void handleSignOut()} className="rounded-full px-3 py-2 text-left text-sm font-semibold text-primary md:hidden">Sign out</button>
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
