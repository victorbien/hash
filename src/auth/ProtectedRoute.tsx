import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { useAuth } from './useAuth'

export function ProtectedRoute() {
  const { user, loading, configured, application, error } = useAuth()
  const location = useLocation()

  if (!configured) return <ConfigurationMessage />
  if (loading) return <div className="mx-auto max-w-6xl px-4 py-20 text-center" role="status">Loading your volunteer account…</div>
  if (error && user) {
    return <section className="mx-auto max-w-3xl px-4 py-16"><h1 className="text-3xl font-bold">Account data unavailable</h1><p className="mt-4 leading-7 text-[#594140]">{error}</p><Button as="link" className="mt-6" to="/contact" variant="outline">Contact HASH</Button></section>
  }
  if (!user) {
    return <Navigate to="/volunteer/login" replace state={{ from: location.pathname }} />
  }

  const status = application?.status
  if (status !== 'approved') {
    if (location.pathname !== '/volunteer/application-status') {
      return <Navigate to="/volunteer/application-status" replace />
    }
  } else if (location.pathname === '/volunteer/application-status') {
    return <Navigate to="/volunteer/dashboard" replace />
  }

  return <Outlet />
}

export function ConfigurationMessage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-[#f1dfe1] bg-white p-8">
        <h1 className="text-3xl font-bold">Volunteer portal setup in progress</h1>
        <p className="mt-4 leading-7 text-[#594140]">
          Volunteer account services are not configured yet. HASH must connect its Supabase project before registration or sign-in can be used.
        </p>
        <p className="mt-3 text-sm text-[#594140]">
          Administrators: configure <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>, then apply the volunteer database migration.
        </p>
      </div>
    </section>
  )
}
