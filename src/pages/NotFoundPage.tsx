import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">404</p>
      <h1 className="mt-4 text-5xl font-black text-[#251818]">Page not found</h1>
      <p className="mt-4 text-lg text-[#594140]">
        The page you are looking for does not exist or may have moved.
      </p>
      <Link to="/" className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-[#8b1d2e]">
        Return home
      </Link>
    </div>
  )
}
