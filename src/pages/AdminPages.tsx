import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, Outlet, useLocation, useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { useAuth } from '../auth/useAuth'
import {
  cmsContentTypes,
  getCmsContentById,
  isCmsConfigured,
  listCmsContent,
  saveCmsContent,
  uploadCmsMedia,
} from '../cms/content'
import type { CmsContent, CmsContentInput, CmsContentStatus, CmsContentType } from '../cms/content'
import { supabase } from '../lib/supabase'

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  publisher: 'Publisher',
  editor: 'Content editor',
  volunteer_coordinator: 'Volunteer coordinator',
}

function getRole(role: unknown): string | null {
  return typeof role === 'string' && role in roleLabels ? role : null
}

function canSchedule(user: ReturnType<typeof useAuth>['user']) {
  return user?.app_metadata?.role === 'admin' || user?.app_metadata?.scheduling_access === true
}

const contentTypeLabels: Record<CmsContentType, string> = {
  about: 'About',
  service: 'Service',
  resource: 'Resource',
  volunteer: 'Volunteer information',
  home: 'Homepage',
}

const statusStyles: Record<CmsContentStatus, string> = {
  draft: 'bg-amber-100 text-amber-900',
  published: 'bg-green-100 text-green-900',
  archived: 'bg-slate-100 text-slate-700',
}

function AdminConfigurationMessage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <div className="rounded-3xl border border-[#f1dfe1] bg-white p-8">
        <h1 className="text-3xl font-bold">Administration is not configured</h1>
        <p className="mt-4 leading-7 text-[#594140]">
          The website cannot connect to Supabase yet. Add its browser-safe project URL and publishable key to the local environment.
        </p>
        <p className="mt-3 text-sm text-[#594140]">
          Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env</code>, then restart the Vite server. Database migrations are a separate setup step.
        </p>
      </div>
    </section>
  )
}

export function AdminRoute() {
  const { user, loading, configured } = useAuth()
  const [signOutError, setSignOutError] = useState<string | null>(null)

  if (!configured) return <AdminConfigurationMessage />
  if (loading) {
    return <div className="px-4 py-16 text-center" role="status">Checking your HASH staff account…</div>
  }
  if (!user) return <Navigate to="/admin/login" replace />
  if (!getRole(user.app_metadata?.role) && user.app_metadata?.scheduling_access === true) {
    return <Navigate to="/admin/scheduling" replace />
  }
  if (!getRole(user.app_metadata?.role)) {
    async function signOut() {
      if (!supabase) {
        setSignOutError('Administration is not configured.')
        return
      }
      try {
        const { error } = await supabase.auth.signOut()
        if (error) setSignOutError('Sign out failed. Please try again.')
      } catch {
        setSignOutError('Sign out failed. Please try again.')
      }
    }

    return (
      <section className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-3xl font-bold">CMS access not authorised</h1>
        <p className="mt-4 leading-7 text-[#594140]">
          Your account does not have a HASH CMS role. Contact an administrator if you believe this is an error.
        </p>
        {signOutError && <p className="mt-4 text-sm text-red-800" role="alert">{signOutError}</p>}
        <Button className="mt-6" onClick={() => void signOut()} variant="outline">Sign out</Button>
      </section>
    )
  }
  return <Outlet />
}

export function AdminLoginPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const role = getRole(user?.app_metadata?.role)
  const schedulingAccess = canSchedule(user)

  useEffect(() => {
    if (role || schedulingAccess) navigate(role ? '/admin' : '/admin/scheduling', { replace: true })
  }, [navigate, role, schedulingAccess])

  if (!isCmsConfigured()) return <AdminConfigurationMessage />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!supabase) {
      setError('Administration is not configured.')
      return
    }
    setSubmitting(true)
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      const signedInUser = data.user
      if (!getRole(signedInUser.app_metadata?.role) && signedInUser.app_metadata?.scheduling_access !== true) {
        setError('This account is not authorised to access HASH administration or scheduling.')
        return
      }
      navigate(getRole(signedInUser.app_metadata?.role) ? '/admin' : '/admin/scheduling', { replace: true })
    } catch {
      setError('Sign-in failed. Check your details or contact a HASH administrator.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-3xl border border-[#f1dfe1] bg-white p-8 shadow-sm">
        <Link className="public-text-link text-sm" to="/">← HASH website</Link>
        <h1 className="mt-6 text-3xl font-bold">HASH staff sign in</h1>
        <p className="mt-3 text-sm leading-6 text-[#594140]">Use an authorised HASH staff account to manage website content or confidential appointments.</p>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="admin-email">Email address</label>
            <input
              autoComplete="username"
              className="w-full rounded-xl border border-[#e5cdd0] px-4 py-3"
              id="admin-email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="admin-password">Password</label>
            <input
              autoComplete="current-password"
              className="w-full rounded-xl border border-[#e5cdd0] px-4 py-3"
              id="admin-password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>
          {error && <p className="text-sm font-semibold text-red-800" role="alert">{error}</p>}
          <Button className="w-full disabled:opacity-60" disabled={submitting} type="submit" variant="outline">
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </section>
  )
}

function AdminLayout() {
  const { user } = useAuth()
  const role = getRole(user?.app_metadata?.role) ?? 'staff'
  const [signOutError, setSignOutError] = useState<string | null>(null)

  async function handleSignOut() {
    if (!supabase) {
      setSignOutError('Administration is not configured.')
      return
    }
    try {
      const { error } = await supabase.auth.signOut()
      if (error) setSignOutError('Sign out failed. Please try again.')
    } catch {
      setSignOutError('Sign out failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-[#fff8f7]">
      <header className="border-b border-[#f1dfe1] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link aria-label="HASH CMS dashboard" className="inline-flex items-center gap-3" to="/admin">
            <img
              alt="HASH logo"
              className="h-12 w-32 object-cover object-center"
              src="/assets/images/logo/hash_logo.png"
            />
            <span className="text-lg font-bold text-primary">Administrator</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span>{user?.email} · {roleLabels[role] ?? role}</span>
            {canSchedule(user) && <Link className="public-text-link" to="/admin/scheduling">Scheduling</Link>}
            {user?.app_metadata?.role === 'admin' && <Link className="public-text-link" to="/admin/preferences">General preferences</Link>}
            <button className="public-text-link" onClick={() => void handleSignOut()} type="button">Sign out</button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <AdminBreadcrumb />
        <main className="min-w-0">
          {signOutError && <p className="mb-4 text-sm text-red-800" role="alert">{signOutError}</p>}
          <Outlet context={{ canSchedule: canSchedule(user), isAdministrator: user?.app_metadata?.role === 'admin' }} />
        </main>
      </div>
    </div>
  )
}

export { AdminLayout }

export function AdminBreadcrumb() {
  const { pathname } = useLocation()
  const isEditor = pathname === '/admin/content/new' || /^\/admin\/content\/[^/]+\/edit$/.test(pathname)
  const schedulingPath = pathname.startsWith('/admin/scheduling')
  const backHref = isEditor ? '/admin/content' : pathname === '/admin/content' || pathname === '/admin/scheduling' || pathname === '/admin/preferences' || pathname === '/admin/volunteers' ? '/admin' : schedulingPath ? '/admin/scheduling' : '/'
  const backLabel = isEditor ? 'Back to website content' : pathname === '/admin/content' || pathname === '/admin/scheduling' || pathname === '/admin/preferences' || pathname === '/admin/volunteers' ? 'Back to dashboard' : schedulingPath ? 'Back to Scheduling' : 'Back to HASH website'
  const crumbs = [
    { label: 'Administrator', href: '/admin' },
    ...(pathname === '/admin/preferences'
      ? [{ label: 'General preferences', href: null }]
      : []),
    ...(pathname === '/admin/volunteers'
      ? [{ label: 'Volunteer sign-ups', href: null }]
      : []),
    ...(pathname.startsWith('/admin/content')
      ? [{ label: 'Website content', href: '/admin/content' }]
      : []),
    ...(schedulingPath
      ? [{ label: 'Scheduling', href: '/admin/scheduling' }]
      : []),
    ...(pathname === '/admin/content/new'
      ? [{ label: 'Create content', href: null }]
      : /^\/admin\/content\/[^/]+\/edit$/.test(pathname)
        ? [{ label: 'Edit content', href: null }]
        : []),
    ...(!pathname.startsWith('/admin/content') && pathname === '/admin'
      ? [{ label: 'Dashboard', href: null }]
      : []),
    ...(pathname === '/admin/scheduling'
      ? [{ label: 'Calendar', href: null }]
      : pathname.startsWith('/admin/scheduling/appointments/')
        ? [{ label: 'Appointments', href: '/admin/scheduling/appointments' }, { label: pathname.endsWith('/edit') ? 'Edit appointment' : 'Appointment details', href: null }]
        : pathname.startsWith('/admin/scheduling/appointments')
          ? [{ label: 'Appointments', href: pathname.endsWith('/new') ? '/admin/scheduling/appointments' : null }, ...(pathname.endsWith('/new') ? [{ label: 'New appointment', href: null }] : [])]
          : pathname.endsWith('/blocked-times')
            ? [{ label: 'Blocked times', href: null }]
            : pathname.endsWith('/settings')
              ? [{ label: 'Settings', href: null }]
              : []),
  ]

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2 text-sm">
          {crumbs.map((crumb, index) => (
            <li className="flex items-center gap-2" key={crumb.label}>
              {index > 0 && <span aria-hidden="true" className="text-[#8b7474]">/</span>}
              {crumb.href
                ? <Link className="public-text-link" to={crumb.href}>{crumb.label}</Link>
                : <span aria-current="page" className="font-semibold text-[#594140]">{crumb.label}</span>}
            </li>
          ))}
        </ol>
      </nav>
      <Button as="link" to={backHref} variant="outline">← {backLabel}</Button>
    </div>
  )
}

function ContentLoadError({ message }: { message: string }) {
  return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-900" role="alert">{message}</p>
}

function DashboardIcon({ kind }: { kind: 'pages' | 'services' | 'resources' | 'volunteers' | 'media' | 'users' | 'history' | 'calendar' | 'settings' }) {
  const paths: Record<typeof kind, React.ReactNode> = {
    pages: <><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></>,
    services: <><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" /><path d="M3 12h5l2-3 3 6 2-3h6" /></>,
    resources: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21Z" /><path d="M4 5.5v13A2.5 2.5 0 0 1 6.5 16H20" /></>,
    volunteers: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1" /><path d="M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v1" /></>,
    media: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
    history: <><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><path d="M3 3v5h5m4-1v5l3 2" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /><path d="M8 15h.01M12 15h.01M16 15h.01" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z" /></>,
  }

  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      {paths[kind]}
    </svg>
  )
}

function DashboardLinkCard({
  title,
  description,
  to,
  kind,
}: {
  title: string
  description: string
  to: string
  kind: 'pages' | 'services' | 'resources' | 'volunteers' | 'calendar' | 'settings'
}) {
  return (
    <Link className="interactive-card group block rounded-2xl border border-transparent p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" to={to}>
      <DashboardIcon kind={kind} />
      <h2 className="mt-3 text-xl font-bold group-hover:text-primary">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#594140]">{description}</p>
    </Link>
  )
}

export function AdminDashboardPage() {
  const { canSchedule: schedulingEnabled, isAdministrator } = useOutletContext<{ canSchedule: boolean; isAdministrator: boolean } | undefined>() ?? { canSchedule: false, isAdministrator: false }
  const [items, setItems] = useState<CmsContent[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void listCmsContent()
      .then((content) => { if (active) setItems(content) })
      .catch(() => { if (active) setError('We could not load the CMS dashboard. Check the database connection and CMS migration.') })
    return () => { active = false }
  }, [])

  const publishedCount = items?.filter((item) => item.status === 'published').length ?? 0
  const draftCount = items?.filter((item) => item.status === 'draft').length ?? 0
  const recent = items?.slice(0, 5) ?? []

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-[#f1dfe1] bg-white p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e8dfe0] pb-5">
          <div className="flex items-center gap-3">
            <DashboardIcon kind="pages" />
            <h1 className="text-3xl font-bold">HASH Administrator</h1>
          </div>
          <span className="rounded-full bg-[#fff0ef] px-3 py-1 text-sm font-semibold text-primary">Administration</span>
        </div>
      </header>

      <section aria-label="Website content" className="rounded-3xl border border-[#f1dfe1] bg-white p-5 sm:p-8">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-[0.15em] text-[#594140]">Website content</h2>
        <div className="grid gap-2 border-b border-[#e8dfe0] pb-5 sm:grid-cols-2">
          <DashboardLinkCard kind="pages" title="Pages" description="Homepage, About, and other website sections" to="/admin/content?area=pages" />
          <DashboardLinkCard kind="services" title="Services" description="Service descriptions, images, and publication" to="/admin/content?type=service" />
          <DashboardLinkCard kind="resources" title="Resources" description="Reports, documents, and educational materials" to="/admin/content?type=resource" />
          <DashboardLinkCard kind="volunteers" title="Volunteer information" description="Public website content about volunteering" to="/admin/content?type=volunteer" />
        </div>

        <section aria-label="Content overview" className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Total Items', count: items?.length, href: '/admin/content' },
            { label: 'Published', count: publishedCount, href: '/admin/content?status=published' },
            { label: 'Draft', count: draftCount, href: '/admin/content?status=draft' },
          ].map(({ label, count, href }) => (
            <Link
              className="interactive-card block rounded-2xl border border-[#f1dfe1] bg-white p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              key={label}
              to={href}
            >
              <span className="block text-sm font-semibold text-[#594140]">{label}</span>
              <span className="mt-2 block text-3xl font-black">{count ?? '—'}</span>
              <span className="public-text-link mt-2 inline-block">View content</span>
            </Link>
          ))}
        </section>
        {error && <div className="mt-5"><ContentLoadError message={error} /></div>}
        <section className="mt-5 rounded-2xl border border-[#f1dfe1] bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Recently updated</h2>
            <Link className="public-text-link" to="/admin/content">View all</Link>
          </div>
          {!items && !error && <p className="mt-4" role="status">Loading content…</p>}
          {items?.length === 0 && <p className="mt-4 text-sm text-[#594140]">No CMS content yet. Public CMS areas remain empty until verified content is added and published.</p>}
          <ul className="mt-4 divide-y divide-[#f1dfe1]">
            {recent.map((item) => (
              <li className="flex flex-wrap items-center justify-between gap-3 py-4" key={item.id}>
                <div><p className="font-semibold">{item.title}</p><p className="text-sm text-[#594140]">{contentTypeLabels[item.content_type]}</p></div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusStyles[item.status]}`}>{item.status}</span>
              </li>
            ))}
          </ul>
        </section>
      </section>

      <section aria-label="Volunteer administration" className="rounded-3xl border border-[#f1dfe1] bg-white p-5 sm:p-8">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-[0.15em] text-[#594140]">Volunteer administration</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <DashboardLinkCard kind="volunteers" title="Volunteer sign-ups" description="Review public enquiries and invite people to create pending volunteer accounts" to="/admin/volunteers" />
        </div>
      </section>

      {(schedulingEnabled || isAdministrator) && (
        <section aria-label="Administration tools" className="rounded-3xl border border-[#f1dfe1] bg-white p-5 sm:p-8">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-[0.15em] text-[#594140]">Administration tools</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {schedulingEnabled && (
            <DashboardLinkCard kind="calendar" title="Scheduling" description="Confidential appointments, calendar availability, and blocked times" to="/admin/scheduling" />
            )}
            {isAdministrator && (
              <DashboardLinkCard kind="settings" title="General Preferences" description="Set website-wide session inactivity timeout" to="/admin/preferences" />
            )}
          </div>
        </section>
      )}

      <section aria-label="Administrative information" className="rounded-3xl border border-[#f1dfe1] bg-white p-5 sm:p-8">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-[0.15em] text-[#594140]">Administrative information</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <Link className="interactive-card flex items-start gap-4 rounded-xl border border-transparent p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" to="/admin/content">
            <span className="mt-1"><DashboardIcon kind="media" /></span>
            <span><span className="block font-bold">Media Library</span><span className="mt-1 block text-sm leading-6 text-[#594140]">Manage images and documents attached to website content.</span></span>
          </Link>
          <div className="flex items-start gap-4 rounded-xl p-3">
            <span className="mt-1"><DashboardIcon kind="users" /></span>
            <span><span className="block font-bold">Users &amp; Permissions</span><span className="mt-1 block text-sm leading-6 text-[#594140]">Staff roles are managed through the trusted Supabase administrator process.</span></span>
          </div>
          <div className="flex items-start gap-4 rounded-xl p-3">
            <span className="mt-1"><DashboardIcon kind="history" /></span>
            <span><span className="block font-bold">Revision History</span><span className="mt-1 block text-sm leading-6 text-[#594140]">Content changes are recorded. Browsing and restoring revisions are not available yet.</span></span>
          </div>
        </div>
      </section>
    </section>
  )
}

function formatTimeout(minutes: number) {
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  const hourLabel = `${hours} hour${hours === 1 ? '' : 's'}`
  return remainingMinutes ? `${hourLabel} ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}` : hourLabel
}

export function AdminGeneralPreferencesPage() {
  const { user } = useAuth()
  const [timeoutMinutes, setTimeoutMinutes] = useState('')
  const isAdministrator = user?.app_metadata?.role === 'admin'
  const [loading, setLoading] = useState(isAdministrator && Boolean(supabase))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isAdministrator || !supabase) return
    let active = true
    void (async () => {
      try {
        const { data, error: loadError } = await supabase
          .from('general_preferences')
          .select('inactivity_timeout_minutes')
          .eq('id', 1)
          .maybeSingle()
        if (!active) return
        const minutes = data?.inactivity_timeout_minutes
        if (loadError || typeof minutes !== 'number' || !Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
          setError('Could not load general preferences. Check that the general preferences migration has been applied.')
          return
        }
        setTimeoutMinutes(String(minutes))
      } catch {
        if (active) setError('Could not load general preferences. Check the database connection and migration.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [isAdministrator])

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!supabase) {
      setError('General preferences cannot be saved because Supabase is not configured.')
      return
    }
    const minutes = Number(timeoutMinutes)
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
      setError('Enter a whole number of minutes from 1 to 1440.')
      return
    }
    setSaving(true)
    try {
      const { error: saveError } = await supabase
        .from('general_preferences')
        .update({ inactivity_timeout_minutes: minutes })
        .eq('id', 1)
      if (saveError) {
        setError('Could not save the inactivity timeout. Check your Administrator permissions and database setup.')
        return
      }
      setMessage(`The inactivity timeout is now ${formatTimeout(minutes)}. Active sessions will use the updated setting within one minute.`)
    } catch {
      setError('Could not save general preferences because the database connection failed.')
    } finally {
      setSaving(false)
    }
  }

  if (!isAdministrator) {
    return (
      <section className="rounded-3xl border border-[#f1dfe1] bg-white p-8">
        <h1 className="text-3xl font-bold">Access not authorised</h1>
        <p className="mt-4 leading-7 text-[#594140]">Only a HASH Administrator can change website-wide general preferences.</p>
      </section>
    )
  }

  return (
    <section className="max-w-3xl rounded-3xl border border-[#f1dfe1] bg-white p-6 sm:p-8">
      <h1 className="text-3xl font-bold">General Preferences</h1>
      <p className="mt-3 leading-7 text-[#594140]">Configure settings that apply across the public website, Administrator, and volunteer portal.</p>
      {!supabase && <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900" role="status">Supabase is not configured. General preferences cannot be loaded or saved.</p>}
      <form className="mt-8 space-y-5" onSubmit={(event) => void handleSave(event)}>
        <div>
          <label className="block text-sm font-semibold" htmlFor="inactivity-timeout">Session inactivity timeout (minutes)</label>
          <p className="mt-1 text-sm leading-6 text-[#594140]">Administrators and volunteers are automatically signed out after this much inactivity. Choose 1–1440 minutes; the default is 60 minutes.</p>
          <input
            className="mt-2 w-full max-w-xs rounded-xl border border-[#f1dfe1] bg-white px-4 py-3"
            disabled={loading || saving}
            id="inactivity-timeout"
            max={1440}
            min={1}
            onChange={(event) => setTimeoutMinutes(event.target.value)}
            required
            type="number"
            value={timeoutMinutes}
          />
          {timeoutMinutes && Number.isInteger(Number(timeoutMinutes)) && Number(timeoutMinutes) >= 1 && Number(timeoutMinutes) <= 1440 && (
            <p className="mt-2 text-sm text-[#594140]">Current duration: {formatTimeout(Number(timeoutMinutes))}</p>
          )}
        </div>
        {loading && <p role="status" className="text-sm text-[#594140]">Loading preferences…</p>}
        {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-900">{error}</p>}
        {message && <p role="status" className="rounded-xl bg-green-50 p-4 text-sm text-green-900">{message}</p>}
        <Button disabled={loading || saving || !supabase} type="submit" variant="outline">
          {saving ? 'Saving…' : 'Save preferences'}
        </Button>
      </form>
    </section>
  )
}

export function AdminContentListPage() {
  const [searchParams] = useSearchParams()
  const [items, setItems] = useState<CmsContent[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState(searchParams.get('area') ?? searchParams.get('type') ?? '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? '')
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    let active = true
    void listCmsContent()
      .then((content) => { if (active) setItems(content) })
      .catch(() => { if (active) setError('We could not load website content. Check your permissions and database setup.') })
    return () => { active = false }
  }, [])

  const filteredItems = items?.filter((item) => {
    const searchMatches = `${item.title} ${item.slug} ${item.summary}`.toLowerCase().includes(search.toLowerCase())
    const matchesType = !typeFilter
      || (typeFilter === 'pages' && (item.content_type === 'home' || item.content_type === 'about'))
      || item.content_type === typeFilter
    return searchMatches
      && matchesType
      && (!statusFilter || item.status === statusFilter)
      && (!categoryFilter || item.category === categoryFilter)
  })
  const categories = [...new Set(items?.flatMap((item) => item.category ? [item.category] : []) ?? [])].sort()

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">CMS</p><h1 className="mt-2 text-4xl font-bold">Website content</h1></div>
        <Button as="link" to="/admin/content/new" variant="outline">Create content</Button>
      </div>
      {error && <div className="mt-6"><ContentLoadError message={error} /></div>}
      {!items && !error && <p className="mt-6" role="status">Loading content…</p>}
      {items?.length === 0 && <p className="mt-6 rounded-2xl bg-white p-6">No content items yet.</p>}
      {items && items.length > 0 && (
        <>
        <div className="mt-6 grid gap-3 rounded-2xl border border-[#f1dfe1] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-semibold">Search
            <input className="mt-2 block w-full rounded-xl border border-[#e5cdd0] px-4 py-3" onChange={(event) => setSearch(event.target.value)} placeholder="Title, slug, or summary" type="search" value={search} />
          </label>
          <label className="text-sm font-semibold">Content area
            <select className="mt-2 block w-full rounded-xl border border-[#e5cdd0] bg-white px-4 py-3" onChange={(event) => setTypeFilter(event.target.value)} value={typeFilter}>
              <option value="">All areas</option>
              <option value="pages">Pages</option>
              {cmsContentTypes.map((type) => <option key={type} value={type}>{contentTypeLabels[type]}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Status
            <select className="mt-2 block w-full rounded-xl border border-[#e5cdd0] bg-white px-4 py-3" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
              <option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
            </select>
          </label>
          <label className="text-sm font-semibold">Category
            <select className="mt-2 block w-full rounded-xl border border-[#e5cdd0] bg-white px-4 py-3" onChange={(event) => setCategoryFilter(event.target.value)} value={categoryFilter}>
              <option value="">All categories</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-[#f1dfe1] bg-white">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-[#fff0ef]"><tr><th className="p-4">Title</th><th className="p-4">Type</th><th className="p-4">Status</th><th className="p-4">Updated</th><th className="p-4"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody className="divide-y divide-[#f1dfe1]">
              {filteredItems?.map((item) => (
                <tr key={item.id}>
                  <td className="p-4 font-semibold">{item.title}</td>
                  <td className="p-4">{contentTypeLabels[item.content_type]}</td>
                  <td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusStyles[item.status]}`}>{item.status}</span></td>
                  <td className="p-4">{new Date(item.updated_at).toLocaleDateString()}</td>
                  <td className="p-4"><Link className="public-text-link" to={`/admin/content/${item.id}/edit`}>Edit</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredItems?.length === 0 && <p className="mt-4 text-sm text-[#594140]">No content matches these filters.</p>}
        </>
      )}
    </section>
  )
}

const emptyInput: CmsContentInput = {
  content_type: 'about',
  title: '',
  slug: '',
  summary: '',
  body: '',
  category: '',
  status: 'draft',
  featured: false,
  display_order: 0,
  image_path: '',
  image_alt: '',
  seo_title: '',
  meta_description: '',
}

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function AdminContentEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const role = getRole(user?.app_metadata?.role)
  const canPublish = role === 'admin' || role === 'publisher'
  const [input, setInput] = useState<CmsContentInput>(() => ({
    ...emptyInput,
    content_type: role === 'volunteer_coordinator' ? 'volunteer' : emptyInput.content_type,
  }))
  const [initialLoading, setInitialLoading] = useState(Boolean(id))
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)
  const [editingBlocked, setEditingBlocked] = useState(false)

  useEffect(() => {
    if (!id) return
    let active = true
    void getCmsContentById(id)
      .then((content) => {
        if (!active) return
        if (!canPublish && content.status !== 'draft') {
          setEditingBlocked(true)
          setError('Only an authorised publisher can change published or archived content.')
          return
        }
        setInput({
          content_type: content.content_type,
          title: content.title,
          slug: content.slug,
          summary: content.summary,
          body: content.body,
          category: content.category ?? '',
          status: content.status,
          featured: content.featured,
          display_order: content.display_order,
          image_path: content.image_path ?? '',
          image_alt: content.image_alt ?? '',
          seo_title: content.seo_title ?? '',
          meta_description: content.meta_description ?? '',
        })
      })
      .catch(() => {
        if (active) setError('We could not load this content item. It may have been removed or you may not have permission.')
      })
      .finally(() => { if (active) setInitialLoading(false) })
    return () => { active = false }
  }, [canPublish, id])

  function change<K extends keyof CmsContentInput>(key: K, value: CmsContentInput[K]) {
    setInput((current) => ({ ...current, [key]: value }))
  }

  async function handleUpload(file: File | undefined) {
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const path = await uploadCmsMedia(file)
      change('image_path', path)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'The file could not be uploaded.')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    if (!input.title.trim() || !input.slug.trim()) {
      setError('Add a title and URL slug before saving.')
      return
    }
    if (input.image_path && !input.image_path.toLowerCase().endsWith('.pdf') && !input.image_alt?.trim()) {
    setError('Add alternative text for the uploaded image.')
    return
    }
    setSubmitting(true)
    try {
      await saveCmsContent({
        ...input,
        title: input.title.trim(),
        slug: input.slug.trim(),
        summary: input.summary.trim(),
        body: input.body.trim(),
        category: input.category?.trim() || null,
        image_path: input.image_path?.trim() || null,
        image_alt: input.image_alt?.trim() || null,
        seo_title: input.seo_title?.trim() || null,
        meta_description: input.meta_description?.trim() || null,
      }, id)
      setSuccess('Content saved.')
      navigate('/admin/content', { replace: true })
    } catch (saveError) {
      setError(saveError instanceof Error && saveError.message.includes('duplicate key')
        ? 'That URL slug is already used for this content type. Choose a unique slug.'
        : 'We could not save this content. Check your permissions, required fields, and database connection.')
    } finally {
      setSubmitting(false)
    }
  }

  if (initialLoading) return <p role="status">Loading content…</p>
  if (editingBlocked) {
    return (
      <section>
        <Link className="public-text-link text-sm" to="/admin/content">← Website content</Link>
        <h1 className="mt-3 text-4xl font-bold">Publisher approval required</h1>
        <div className="mt-6"><ContentLoadError message={error ?? 'Only an authorised publisher can edit this content.'} /></div>
      </section>
    )
  }

  return (
    <section>
      <Link className="public-text-link text-sm" to="/admin/content">← Website content</Link>
      <h1 className="mt-3 text-4xl font-bold">{id ? 'Edit content' : 'Create content'}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#594140]">Use plain text and structured fields. Drafts are private; only authorised publishers can make content public.</p>
      <form className="mt-8 max-w-3xl space-y-6 rounded-2xl border border-[#f1dfe1] bg-white p-6 sm:p-8" onSubmit={handleSubmit}>
        {error && <ContentLoadError message={error} />}
        {success && <p className="rounded-xl bg-green-50 p-4 text-sm text-green-900" role="status">{success}</p>}
        <Button onClick={() => setPreview((current) => !current)} variant="outline">
          {preview ? 'Hide preview' : 'Preview content'}
        </Button>
        {preview && (
          <article aria-label="Content preview" className="rounded-2xl border border-[#f1dfe1] bg-[#fff8f7] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">{contentTypeLabels[input.content_type]} · Preview</p>
            <h2 className="mt-3 text-3xl font-bold">{input.title || 'Untitled content'}</h2>
            {input.summary && <p className="mt-4 text-lg leading-7 text-[#594140]">{input.summary}</p>}
            {input.body && <p className="mt-4 whitespace-pre-line leading-7 text-[#594140]">{input.body}</p>}
          </article>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-semibold">Content area
            <select className="mt-2 block w-full rounded-xl border border-[#e5cdd0] bg-white px-4 py-3" onChange={(event) => change('content_type', event.target.value as CmsContentType)} value={input.content_type}>
              {cmsContentTypes
                .filter((type) => role !== 'volunteer_coordinator' || type === 'volunteer')
                .map((type) => <option key={type} value={type}>{contentTypeLabels[type]}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Status
            <select className="mt-2 block w-full rounded-xl border border-[#e5cdd0] bg-white px-4 py-3" onChange={(event) => change('status', event.target.value as CmsContentStatus)} value={input.status}>
              <option value="draft">Draft</option>
              {canPublish && <><option value="published">Published</option><option value="archived">Archived</option></>}
            </select>
          </label>
        </div>
        <label className="block text-sm font-semibold">Title
          <input className="mt-2 block w-full rounded-xl border border-[#e5cdd0] px-4 py-3" maxLength={180} onChange={(event) => { const title = event.target.value; setInput((current) => ({ ...current, title, slug: id ? current.slug : slugify(title) })) }} required value={input.title} />
        </label>
        <label className="block text-sm font-semibold">URL slug
          <input className="mt-2 block w-full rounded-xl border border-[#e5cdd0] px-4 py-3" maxLength={180} onChange={(event) => change('slug', slugify(event.target.value))} pattern="[a-z0-9]+(-[a-z0-9]+)*" required value={input.slug} />
          <span className="mt-1 block font-normal text-[#594140]">Lowercase letters, numbers, and hyphens.</span>
        </label>
        <label className="block text-sm font-semibold">Summary
          <textarea className="mt-2 block w-full rounded-xl border border-[#e5cdd0] px-4 py-3" maxLength={500} onChange={(event) => change('summary', event.target.value)} rows={3} value={input.summary} />
        </label>
        <label className="block text-sm font-semibold">Content
          <textarea className="mt-2 block w-full rounded-xl border border-[#e5cdd0] px-4 py-3" maxLength={20000} onChange={(event) => change('body', event.target.value)} rows={10} value={input.body} />
          <span className="mt-1 block font-normal text-[#594140]">Plain text only. HTML and scripts are not accepted.</span>
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-semibold">Category
            <input className="mt-2 block w-full rounded-xl border border-[#e5cdd0] px-4 py-3" maxLength={100} onChange={(event) => change('category', event.target.value)} value={input.category ?? ''} />
          </label>
          <label className="text-sm font-semibold">Display order
            <input className="mt-2 block w-full rounded-xl border border-[#e5cdd0] px-4 py-3" min={0} onChange={(event) => change('display_order', Number(event.target.value))} type="number" value={input.display_order} />
          </label>
        </div>
        <fieldset className="space-y-4 rounded-xl border border-[#f1dfe1] p-4">
          <legend className="px-2 font-semibold">Image or document</legend>
          <label className="block text-sm font-semibold">Upload (JPEG, PNG, WebP, or PDF; max 10 MB)
            <input accept="image/jpeg,image/png,image/webp,application/pdf" className="mt-2 block w-full text-sm" disabled={uploading} onChange={(event) => void handleUpload(event.target.files?.[0])} type="file" />
          </label>
          {uploading && <p role="status">Uploading file…</p>}
          <div className="text-sm">
            <p className="font-semibold">Attached file</p>
            <p className="mt-2 break-all text-[#594140]">{input.image_path || 'No file selected'}</p>
            {input.image_path && <button className="public-text-link mt-2 cursor-pointer" onClick={() => change('image_path', '')} type="button">Remove attachment</button>}
          </div>
          <label className="block text-sm font-semibold">Alternative text or document link label
            <input className="mt-2 block w-full rounded-xl border border-[#e5cdd0] px-4 py-3" maxLength={500} onChange={(event) => change('image_alt', event.target.value)} value={input.image_alt ?? ''} />
          </label>
        </fieldset>
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input checked={input.featured} onChange={(event) => change('featured', event.target.checked)} type="checkbox" />
          Feature this item
        </label>
        <fieldset className="grid gap-5 rounded-xl border border-[#f1dfe1] p-4">
          <legend className="px-2 font-semibold">Search metadata</legend>
          <label className="text-sm font-semibold">SEO title
            <input className="mt-2 block w-full rounded-xl border border-[#e5cdd0] px-4 py-3" maxLength={180} onChange={(event) => change('seo_title', event.target.value)} value={input.seo_title ?? ''} />
          </label>
          <label className="text-sm font-semibold">Meta description
            <textarea className="mt-2 block w-full rounded-xl border border-[#e5cdd0] px-4 py-3" maxLength={320} onChange={(event) => change('meta_description', event.target.value)} rows={2} value={input.meta_description ?? ''} />
          </label>
        </fieldset>
        <div className="flex flex-wrap gap-3">
          <Button disabled={submitting || uploading} type="submit" variant="outline">{submitting ? 'Saving…' : canPublish && input.status === 'published' ? 'Publish changes' : 'Save draft'}</Button>
          <Button as="link" to="/admin/content" variant="outline">Cancel</Button>
        </div>
      </form>
    </section>
  )
}
