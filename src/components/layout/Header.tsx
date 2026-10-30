import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { navItems } from '../../data/siteContent'

function navigationLinkClass(isActive: boolean) {
  return [
    'nav-link',
    isActive
      ? 'active-nav-link text-[var(--primary)] hover:text-[var(--primary)] focus-visible:text-[var(--primary)]'
      : '',
  ].join(' ')
}

export function Header() {
  const { pathname } = useLocation()
  const [menuState, setMenuState] = useState({ open: false, pathname })
  const menuOpen = menuState.open && menuState.pathname === pathname

  return (
    <header className="sticky top-0 z-50 border-b border-[#f3dfe0] bg-[#fff8f7]/90 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex items-center justify-between gap-4">
            <Link to="/" className="inline-flex shrink-0 items-center py-1 sm:pr-5" aria-label="HASH home page">
              <img
                src="/assets/images/logo/hash_logo.png"
                alt="HASH logo"
                className="h-12 w-36 object-cover object-center sm:h-16 sm:w-48 xl:h-20 xl:w-56"
              />
            </Link>

            <button
              aria-controls="mobile-navigation"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#f1dfe1] text-[#594140] hover:bg-[#fff1f2] focus-visible:bg-[#fff1f2] xl:hidden"
              onClick={() => setMenuState({ open: !menuOpen, pathname })}
              type="button"
            >
              <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
                {menuOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>

            <nav aria-label="Main navigation" className="hidden min-w-0 flex-1 flex-nowrap items-center justify-end gap-x-7 whitespace-nowrap xl:flex">
              {navItems.filter((item) => item.href !== '/contact').map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) => navigationLinkClass(isActive)}
                  onClick={() => setMenuState({ open: false, pathname })}
                >
                  {item.label}
                </NavLink>
              ))}
              <NavLink aria-label="Book an appointment" className={({ isActive }) => `${navigationLinkClass(isActive)} whitespace-nowrap`} end to="/schedule">Book an appointment</NavLink>
              <NavLink className={({ isActive }) => `${navigationLinkClass(isActive)} whitespace-nowrap`} end to="/get-involved">Get Involved</NavLink>
              <NavLink className={({ isActive }) => `${navigationLinkClass(isActive)} whitespace-nowrap`} end to="/contact">Contact</NavLink>
            </nav>
        </div>

        {menuOpen && (
            <nav aria-label="Mobile navigation" className="mt-3 grid gap-1 border-t border-[#f3dfe0] py-3 xl:hidden" id="mobile-navigation">
              {navItems.filter((item) => item.href !== '/contact').map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    [
                      'nav-link rounded-lg px-3 py-2',
                      isActive ? 'bg-[#fff1f2] text-[var(--primary)]' : 'hover:bg-[#fff1f2]',
                    ].join(' ')
                  }
                  onClick={() => setMenuState({ open: false, pathname })}
                >
                  {item.label}
                </NavLink>
              ))}
              <NavLink aria-label="Book an appointment" className={({ isActive }) => `${navigationLinkClass(isActive)} rounded-lg px-3 py-2 ${isActive ? 'bg-[#fff1f2]' : 'hover:bg-[#fff1f2]'}`} end onClick={() => setMenuState({ open: false, pathname })} to="/schedule">Book an appointment</NavLink>
              <NavLink className={({ isActive }) => `${navigationLinkClass(isActive)} rounded-lg px-3 py-2 ${isActive ? 'bg-[#fff1f2]' : 'hover:bg-[#fff1f2]'}`} end onClick={() => setMenuState({ open: false, pathname })} to="/get-involved">Get Involved</NavLink>
              <NavLink className={({ isActive }) => `${navigationLinkClass(isActive)} rounded-lg px-3 py-2 ${isActive ? 'bg-[#fff1f2]' : 'hover:bg-[#fff1f2]'}`} end onClick={() => setMenuState({ open: false, pathname })} to="/contact">Contact</NavLink>
            </nav>
        )}
      </div>
    </header>
  )
}
