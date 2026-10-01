import { Link, NavLink } from 'react-router-dom'
import { navItems } from '../../data/siteContent'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#f3dfe0] bg-[#fff8f7]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center py-1 pr-5" aria-label="HASH home page">
          <img
            src="/assets/images/logo/hash_logo.png"
            alt="HASH logo"
            className="h-20 w-auto object-contain sm:h-24"
          />
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) => ['nav-link', isActive ? 'active-nav-link' : ''].join(' ')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/contact"
            className="hidden rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-[#fff1f2] sm:inline-flex"
          >
            Get Support
          </Link>
          <Link to="/get-involved" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b42d42]">
            Get Involved
          </Link>
        </div>
      </div>
    </header>
  )
}
