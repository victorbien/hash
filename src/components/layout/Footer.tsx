import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t border-[#f3dfe0] bg-[#fff3f2]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <Link to="/" className="inline-flex items-center" aria-label="HASH home page">
            <img
              src="/assets/images/logo/hash_logo.png"
              alt="HASH — HIV & AIDS Support House"
              className="h-16 w-48 object-cover object-center"
            />
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-[#594140]">
            HIV &amp; AIDS Support House works to expand community-centered access to prevention, treatment, support, and advocacy in the Philippines.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#251818]">Explore</h3>
          <ul className="mt-4 space-y-3 text-sm text-[#594140]">
            <li><Link className="public-text-link" to="/about">About</Link></li>
            <li><Link className="public-text-link" to="/services">Services</Link></li>
            <li><Link className="public-text-link" to="/resources">Resources</Link></li>
            <li><Link className="public-text-link" to="/history">History</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#251818]">Connect</h3>
          <ul className="mt-4 space-y-3 text-sm text-[#594140]">
            <li><Link className="public-text-link" to="/get-involved">Get involved</Link></li>
            <li><Link className="public-text-link" to="/volunteer">Volunteer</Link></li>
            <li><Link className="public-text-link" to="/contact">Contact</Link></li>
            <li><a className="public-text-link" href="mailto:hello@hash.org">hello@hash.org</a></li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
