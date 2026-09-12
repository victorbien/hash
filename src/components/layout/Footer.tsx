import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t border-[#f3dfe0] bg-[#fff3f2]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <p className="text-2xl font-black tracking-tight text-primary">HASH</p>
          <p className="mt-4 max-w-sm text-sm leading-6 text-[#594140]">
            HIV &amp; AIDS Support House works to expand community-centered access to prevention, treatment, support, and advocacy in the Philippines.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#251818]">Explore</h3>
          <ul className="mt-4 space-y-3 text-sm text-[#594140]">
            <li><Link to="/about">About</Link></li>
            <li><Link to="/services">Services</Link></li>
            <li><Link to="/resources">Resources</Link></li>
            <li><Link to="/history">History</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#251818]">Connect</h3>
          <ul className="mt-4 space-y-3 text-sm text-[#594140]">
            <li><Link to="/get-involved">Get involved</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><a href="mailto:hello@hash.org">hello@hash.org</a></li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
