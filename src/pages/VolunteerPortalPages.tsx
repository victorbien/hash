import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { Button } from '../components/ui/Button'
import { supabase } from '../lib/supabase'

type Opportunity = {
  id: string
  title: string
  description: string
  category: string | null
  location: string | null
  start_at: string | null
  end_at: string | null
  deadline: string | null
  expected_commitment: string | null
  required_skills: string | null
}

type TrainingResource = {
  id: string
  title: string
  description: string | null
  resource_url: string | null
  resource_path: string | null
  required: boolean
  approval_required: boolean
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  pending_review: 'Pending review',
  approved: 'Approved',
  additional_information_required: 'Additional information required',
  not_approved: 'Not approved',
  inactive: 'Inactive',
  suspended: 'Suspended',
}

const inputClass =
  'mt-2 w-full rounded-xl border border-[#f1dfe1] bg-white px-4 py-3 text-[#251818] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
const labelClass = 'block text-sm font-semibold text-[#251818]'

function PortalHeading({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-8 max-w-3xl">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">Volunteer portal</p>
      <h1 className="font-[League_Spartan] text-4xl font-bold tracking-tight text-[#251818] md:text-5xl">{title}</h1>
      {description && <p className="mt-4 max-w-3xl text-base leading-7 text-[#594140] md:text-lg">{description}</p>}
    </header>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl border border-dashed border-[#dfc5c7] bg-white p-8 text-center text-[#594140] shadow-[0_14px_36px_rgba(74,22,27,0.04)]">{children}</div>
}

function DataError({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-800" role="alert">{children}</p>
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

export function VolunteerDashboardPage() {
  const { application, profile } = useAuth()
  const [upcoming, setUpcoming] = useState<Opportunity[]>([])
  const [error, setError] = useState('')
  const firstName = profile?.preferred_name || profile?.first_name || 'volunteer'

  useEffect(() => {
    if (!supabase || application?.status !== 'approved') return
    void supabase.from('opportunities')
      .select('id, title, description, category, location, start_at, end_at, deadline, expected_commitment, required_skills')
      .eq('status', 'published').gte('start_at', new Date().toISOString()).order('start_at').limit(3)
      .then(({ data, error: queryError }) => {
        if (queryError) setError('Upcoming opportunities could not be loaded.')
        else setUpcoming(data ?? [])
      })
  }, [application?.status])

  return (
    <>
      <PortalHeading title={`Welcome, ${firstName}`} description="Your volunteer account overview." />
      {error && <DataError>{error}</DataError>}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-[#f1d5d8] bg-white p-7 shadow-[0_14px_36px_rgba(74,22,27,0.05)]">
          <h2 className="text-xl font-bold">Upcoming opportunities</h2>
          {upcoming.length ? <ul className="mt-4 divide-y divide-[#f1dfe1]">{upcoming.map((item) => <li className="py-4" key={item.id}><Link to={`/volunteer/opportunities/${item.id}`} className="public-text-link">{item.title}</Link><p className="mt-1 text-sm text-[#594140]">{item.start_at ? new Date(item.start_at).toLocaleString() : 'Date to be confirmed'}</p></li>)}</ul> : <p className="mt-4 text-sm leading-6 text-[#594140]">There are no published upcoming opportunities available to display.</p>}
          <Link to="/volunteer/opportunities" className="public-text-link mt-4 inline-block">Browse opportunities</Link>
        </section>
        <section className="rounded-3xl border border-[#f1d5d8] bg-white p-7 shadow-[0_14px_36px_rgba(74,22,27,0.05)]">
          <h2 className="text-xl font-bold">Your participation</h2>
          <p className="mt-3 leading-7 text-[#594140]">Training, announcements, and activity appear here when HASH has published or recorded them for your account.</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-primary">
            <Link to="/volunteer/training" className="public-text-link">Training</Link>
            <Link to="/volunteer/activity" className="public-text-link">Activity</Link>
            <Link to="/volunteer/announcements" className="public-text-link">Announcements</Link>
          </div>
        </section>
      </div>
    </>
  )
}

export function VolunteerApplicationPage() {
  const { application } = useAuth()
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <header className="mb-8 max-w-3xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">Volunteer application</p>
        <h1 className="font-[League_Spartan] text-4xl font-bold tracking-tight text-[#251818] md:text-5xl">Application update</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#594140] md:text-lg">Updates about your application are separate from the volunteer portal.</p>
      </header>
      {!application ? <EmptyState>No application record is available for this account. Please contact HASH for help.</EmptyState> : (
        <section className="max-w-3xl rounded-3xl border border-[#f1d5d8] bg-white p-7 shadow-[0_14px_36px_rgba(74,22,27,0.05)]">
          <p className="text-2xl font-bold text-primary">{statusLabels[application.status] ?? 'Application received'}</p>
          <p className="mt-5 text-sm font-semibold text-[#594140]">Submitted</p>
          <p className="mt-1">{application.submitted_at ? new Date(application.submitted_at).toLocaleDateString() : 'Submission date not recorded'}</p>
          {application.status === 'additional_information_required' && <p className="mt-5 leading-7 text-[#594140]">HASH has requested additional information. Please use its approved contact pathway to clarify what is needed.</p>}
        </section>
      )}
      <Link className="public-text-link mt-6 inline-block" to="/volunteer">← Volunteer information</Link>
    </section>
  )
}

export function VolunteerProfilePage() {
  const { profile, application, refreshVolunteerData, user } = useAuth()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !profile || !application) return
    setBusy(true)
    setError('')
    setMessage('')
    const form = new FormData(event.currentTarget)
    const profileResult = await supabase.from('profiles').update({
      first_name: String(form.get('firstName') || '').trim(),
      last_name: String(form.get('lastName') || '').trim(),
      preferred_name: String(form.get('preferredName') || '').trim() || null,
      pronouns: String(form.get('pronouns') || '').trim() || null,
      phone: String(form.get('phone') || '').trim() || null,
      preferred_contact_method: String(form.get('contactMethod') || '') || null,
      location: String(form.get('location') || '').trim() || null,
      preferred_language: String(form.get('language') || '').trim() || null,
    }).eq('id', profile.id).select('id').maybeSingle()
    const applicationResult = await supabase.from('volunteer_applications').update({
      interests: form.getAll('interests').map(String),
      skills: String(form.get('skills') || '').trim() || null,
      experience: String(form.get('experience') || '').trim() || null,
      motivation: String(form.get('motivation') || '').trim() || null,
    }).eq('user_id', profile.id).select('id').maybeSingle()
    setBusy(false)
    if (profileResult.error || !profileResult.data || applicationResult.error || !applicationResult.data) {
      setError('Your profile could not be saved. Please try again or contact HASH.')
      return
    }
    await refreshVolunteerData()
    setMessage('Your profile has been updated.')
  }

  return (
    <>
      <PortalHeading title="My profile" description="Update your contact details and volunteer profile. Approval status and administrative information cannot be changed here." />
      {!profile || !application ? <EmptyState>Your volunteer profile information is unavailable. Please contact HASH.</EmptyState> : (
        <form onSubmit={(event) => void handleSubmit(event)} className="max-w-3xl space-y-6 rounded-3xl border border-[#f1d5d8] bg-white p-7 shadow-[0_14px_36px_rgba(74,22,27,0.05)]">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className={labelClass}>First name<input name="firstName" className={inputClass} defaultValue={profile.first_name} required /></label>
            <label className={labelClass}>Last name<input name="lastName" className={inputClass} defaultValue={profile.last_name} required /></label>
            <label className={labelClass}>Preferred name<input name="preferredName" className={inputClass} defaultValue={profile.preferred_name ?? ''} /></label>
            <label className={labelClass}>Pronouns<input name="pronouns" className={inputClass} defaultValue={profile.pronouns ?? ''} /></label>
            <label className={labelClass}>Email address<input className={inputClass} value={user?.email ?? ''} disabled /></label>
            <label className={labelClass}>Phone<input name="phone" className={inputClass} type="tel" defaultValue={profile.phone ?? ''} /></label>
            <label className={labelClass}>Preferred contact method<select name="contactMethod" className={inputClass} defaultValue={profile.preferred_contact_method ?? ''}><option value="">Choose one</option><option>Email</option><option>Phone</option><option>Text message</option></select></label>
            <label className={labelClass}>General location<input name="location" className={inputClass} defaultValue={profile.location ?? ''} /></label>
            <label className={labelClass}>Preferred language<input name="language" className={inputClass} defaultValue={profile.preferred_language ?? ''} /></label>
          </div>
          <fieldset>
            <legend className="font-semibold">Volunteer interests</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">{interestChoices.map((interest) => <label key={interest} className="flex gap-2 text-sm"><input className="accent-[#ae2736]" name="interests" type="checkbox" value={interest} defaultChecked={application?.interests.includes(interest)} />{interest}</label>)}</div>
          </fieldset>
          <label className={labelClass}>Skills<textarea name="skills" className={inputClass} rows={3} defaultValue={application?.skills ?? ''} /></label>
          <label className={labelClass}>Experience<textarea name="experience" className={inputClass} rows={3} defaultValue={application?.experience ?? ''} /></label>
          <label className={labelClass}>Motivation<textarea name="motivation" className={inputClass} rows={3} defaultValue={application?.motivation ?? ''} /></label>
          {error && <DataError>{error}</DataError>}
          {message && <p role="status" className="text-sm text-green-800">{message}</p>}
          <Button disabled={busy} className="disabled:cursor-not-allowed disabled:opacity-50" type="submit" variant="outline">{busy ? 'Saving…' : 'Save profile'}</Button>
        </form>
      )}
    </>
  )
}

const interestChoices = [
  'Community outreach',
  'Community education',
  'Event support',
  'Administrative support',
  'Digital and technology support',
  'Communications and awareness',
  'Other',
]

export function VolunteerAvailabilityPage() {
  const { user, application } = useAuth()
  const [editedValue, setEditedValue] = useState<Record<string, unknown> | null>(null)
  const value = editedValue ?? application?.availability ?? {}
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const days = stringArray(value.days)
  const times = stringArray(value.times)

  function toggle(key: 'days' | 'times', item: string, checked: boolean) {
    const current = stringArray(value[key])
    setEditedValue({ ...value, [key]: checked ? [...current, item] : current.filter((entry) => entry !== item) })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !user) return
    setBusy(true)
    setError('')
    setMessage('')
    const form = new FormData(event.currentTarget)
    const nextValue = {
      ...value,
      frequency: String(form.get('frequency') || ''),
      commitment: String(form.get('commitment') || ''),
      notes: String(form.get('notes') || '').trim(),
    }
    const { data, error: updateError } = await supabase.from('volunteer_applications').update({ availability: nextValue }).eq('user_id', user.id).select('id').maybeSingle()
    setBusy(false)
    if (updateError || !data) {
      setError('Availability could not be saved. Please try again.')
      return
    }
    setEditedValue(nextValue)
    setMessage('Your availability has been updated. This does not book a shift.')
  }

  return (
    <>
      <PortalHeading title="My availability" description="Share general scheduling preferences. Availability is private to your account and does not confirm a shift." />
      <form onSubmit={(event) => void handleSubmit(event)} className="max-w-3xl space-y-6 rounded-3xl border border-[#f1d5d8] bg-white p-7 shadow-[0_14px_36px_rgba(74,22,27,0.05)]">
        <fieldset><legend className="font-semibold">Days</legend><div className="mt-3 flex flex-wrap gap-4">{daysOfWeek.map((day) => <label key={day} className="flex gap-2 text-sm"><input className="accent-[#ae2736]" type="checkbox" checked={days.includes(day)} onChange={(event) => toggle('days', day, event.target.checked)} />{day}</label>)}</div></fieldset>
        <fieldset><legend className="font-semibold">Preferred times</legend><div className="mt-3 flex gap-4">{['Morning', 'Afternoon', 'Evening'].map((time) => <label key={time} className="flex gap-2 text-sm"><input className="accent-[#ae2736]" type="checkbox" checked={times.includes(time)} onChange={(event) => toggle('times', time, event.target.checked)} />{time}</label>)}</div></fieldset>
        <label className={labelClass}>Availability pattern<select className={inputClass} name="frequency" defaultValue={String(value.frequency || '')}><option value="">Choose one</option><option>Occasional</option><option>Regular</option><option>Flexible</option></select></label>
        <label className={labelClass}>Approximate commitment<input className={inputClass} name="commitment" defaultValue={String(value.commitment || '')} /></label>
        <label className={labelClass}>Scheduling notes<textarea className={inputClass} name="notes" rows={3} defaultValue={String(value.notes || '')} /></label>
        {error && <DataError>{error}</DataError>}{message && <p role="status" className="text-sm text-green-800">{message}</p>}
        <Button disabled={busy} className="disabled:cursor-not-allowed disabled:opacity-50" type="submit" variant="outline">{busy ? 'Saving…' : 'Save availability'}</Button>
      </form>
    </>
  )
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [category, setCategory] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) return
    void supabase.from('opportunities')
      .select('id, title, description, category, location, start_at, end_at, deadline, expected_commitment, required_skills')
      .eq('status', 'published').order('start_at', { ascending: true, nullsFirst: false })
      .then(({ data, error: queryError }) => {
        setLoading(false)
        if (queryError) setError('Opportunities could not be loaded.')
        else setOpportunities(data ?? [])
      })
  }, [])

  const categories = [...new Set(opportunities.map((item) => item.category).filter((item): item is string => Boolean(item)))]
  const visible = category ? opportunities.filter((item) => item.category === category) : opportunities
  return (
    <>
      <PortalHeading title="Opportunities" description="Browse opportunities published by HASH. Expressing interest does not confirm an assignment." />
      <label className={`${labelClass} mb-6 max-w-sm`}>Filter by category<select className={inputClass} value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
      {error ? <DataError>{error}</DataError> : loading ? <p role="status">Loading opportunities…</p> : visible.length === 0 ? <EmptyState>No published opportunities are available at this time.</EmptyState> : (
        <div className="grid gap-5 md:grid-cols-2">
          {visible.map((item) => <article key={item.id} className="interactive-card rounded-3xl border border-[#f1d5d8] bg-white p-6 shadow-[0_14px_36px_rgba(74,22,27,0.05)]">
            {item.category && <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">{item.category}</p>}
            <h2 className="mt-2 text-xl font-bold">{item.title}</h2>
            <p className="mt-3 line-clamp-3 leading-7 text-[#594140]">{item.description}</p>
            <p className="mt-3 text-sm text-[#594140]">{item.location || 'Location to be confirmed'}{item.start_at ? ` · ${new Date(item.start_at).toLocaleString()}` : ''}</p>
            <Link to={`/volunteer/opportunities/${item.id}`} className="public-text-link mt-4 inline-block">View details</Link>
          </article>)}
        </div>
      )}
    </>
  )
}

export function OpportunityDetailsPage() {
  const { opportunityId } = useParams()
  const { user } = useAuth()
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!supabase || !opportunityId) return
    void supabase.from('opportunities')
      .select('id, title, description, category, location, start_at, end_at, deadline, expected_commitment, required_skills')
      .eq('id', opportunityId).eq('status', 'published').maybeSingle()
      .then(({ data, error: queryError }) => {
        setLoading(false)
        if (queryError) setError('Opportunity details could not be loaded.')
        else setOpportunity(data)
      })
  }, [opportunityId])

  async function expressInterest() {
    if (!supabase || !user || !opportunity) return
    setBusy(true)
    setError('')
    const { error: insertError } = await supabase.from('opportunity_applications').insert({
      opportunity_id: opportunity.id,
      volunteer_id: user.id,
    })
    setBusy(false)
    if (insertError?.code === '23505') {
      setMessage('You have already expressed interest in this opportunity.')
    } else if (insertError) {
      setError('Your interest could not be recorded. Please try again.')
    } else {
      setMessage('Your interest has been recorded. This is not a confirmed assignment.')
    }
  }

  if (loading) return <p role="status">Loading opportunity…</p>
  if (error && !opportunity) return <DataError>{error}</DataError>
  if (!opportunity) return <EmptyState>This opportunity is not available.</EmptyState>
  return (
    <>
      <Link to="/volunteer/opportunities" className="public-text-link mb-6 inline-block">← All opportunities</Link>
      <article className="max-w-3xl rounded-3xl border border-[#f1d5d8] bg-white p-7 shadow-[0_14px_36px_rgba(74,22,27,0.05)]">
        <PortalHeading title={opportunity.title} description={opportunity.category ?? undefined} />
        <p className="whitespace-pre-wrap leading-7 text-[#594140]">{opportunity.description}</p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <Detail label="Location" value={opportunity.location} />
          <Detail label="Date" value={opportunity.start_at ? new Date(opportunity.start_at).toLocaleString() : null} />
          <Detail label="Expected commitment" value={opportunity.expected_commitment} />
          <Detail label="Required skills" value={opportunity.required_skills} />
          <Detail label="Application deadline" value={opportunity.deadline ? new Date(opportunity.deadline).toLocaleDateString() : null} />
        </dl>
        {error && <div className="mt-5"><DataError>{error}</DataError></div>}
        {message && <p role="status" className="mt-5 text-sm text-green-800">{message}</p>}
        <Button className="mt-6 disabled:cursor-not-allowed disabled:opacity-50" disabled={busy} onClick={() => void expressInterest()} variant="outline">{busy ? 'Submitting…' : 'Express interest'}</Button>
      </article>
    </>
  )
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return <div><dt className="text-xs font-bold uppercase tracking-wide text-[#594140]">{label}</dt><dd className="mt-1">{value || 'Not specified'}</dd></div>
}

export function VolunteerTrainingPage() {
  const { user, application } = useAuth()
  const [resources, setResources] = useState<TrainingResource[]>([])
  const [progress, setProgress] = useState<Record<string, { status: string; completed_at: string | null }>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!supabase || !user || application?.status !== 'approved') return
    void Promise.all([
      supabase.from('training_resources').select('id, title, description, resource_url, resource_path, required, approval_required').eq('status', 'published').order('title'),
      supabase.from('volunteer_training_progress').select('training_resource_id, status, completed_at').eq('volunteer_id', user.id),
    ]).then(([resourceResult, progressResult]) => {
      setLoading(false)
      if (resourceResult.error || progressResult.error) {
        setError('Training information could not be loaded.')
        return
      }
      setResources(resourceResult.data ?? [])
      setProgress(Object.fromEntries((progressResult.data ?? []).map((item) => [item.training_resource_id, { status: item.status, completed_at: item.completed_at }])))
    })
  }, [user, application?.status])

  async function markStarted(id: string) {
    if (!supabase || !user) return
    const { error: saveError } = await supabase.from('volunteer_training_progress').upsert({
      training_resource_id: id,
      volunteer_id: user.id,
      status: 'in_progress',
    }, { onConflict: 'volunteer_id,training_resource_id' })
    if (saveError) {
      setError('Training progress could not be saved.')
      return
    }
    setProgress((current) => ({ ...current, [id]: { status: 'in_progress', completed_at: null } }))
    setMessage('Training marked as in progress. Opening a resource does not mark it complete.')
  }

  async function openResource(resource: TrainingResource) {
    if (!supabase || !resource.resource_path) return
    const { data, error: signedError } = await supabase.storage.from('volunteer-resources').createSignedUrl(resource.resource_path, 300)
    if (signedError || !data?.signedUrl) {
      setError('This resource could not be opened. Please contact HASH.')
      return
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <PortalHeading title="My training" description="Access training resources assigned or published by HASH. Resources opened here are not automatically marked complete." />
      {error && <DataError>{error}</DataError>}{message && <p role="status" className="mb-5 text-sm text-green-800">{message}</p>}
      {loading ? <p role="status">Loading training…</p> : resources.length === 0 ? <EmptyState>No training resources have been published for your account.</EmptyState> : (
        <div className="grid gap-5 md:grid-cols-2">{resources.map((item) => {
          const completion = progress[item.id]
          return <article key={item.id} className="interactive-card rounded-3xl border border-[#f1d5d8] bg-white p-6 shadow-[0_14px_36px_rgba(74,22,27,0.05)]">
          <div className="flex items-start justify-between gap-3"><h2 className="text-xl font-bold">{item.title}</h2><span className="rounded-full bg-[#fff0ef] px-3 py-1 text-xs font-semibold text-primary">{item.required ? 'Required' : 'Optional'}</span></div>
          {item.description && <p className="mt-3 leading-7 text-[#594140]">{item.description}</p>}
          <p className="mt-3 text-sm text-[#594140]">Status: {completion?.status === 'completed' ? `Completed${completion.completed_at ? ` on ${new Date(completion.completed_at).toLocaleDateString()}` : ''}` : completion?.status === 'in_progress' ? 'In progress' : 'Not started'}</p>
          <div className="mt-4 flex flex-wrap gap-4">
            {item.resource_url && <a href={item.resource_url} target="_blank" rel="noreferrer" className="public-text-link">Open resource</a>}
            {item.resource_path && <button onClick={() => void openResource(item)} className="public-text-link" type="button">Open secure resource</button>}
            {completion?.status !== 'completed' && <button onClick={() => void markStarted(item.id)} className="public-text-link" type="button">Mark in progress</button>}
          </div>
        </article>
        })}</div>
      )}
    </>
  )
}

export function VolunteerActivityPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<Array<{ id: string; activity_type: string; activity_date: string; hours: number | null; status: string }>>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase || !user) return
    void supabase.from('volunteer_activity').select('id, activity_type, activity_date, hours, status').eq('volunteer_id', user.id).order('activity_date', { ascending: false })
      .then(({ data, error: queryError }) => {
        setLoading(false)
        if (queryError) setError('Activity history could not be loaded.')
        else setItems(data ?? [])
      })
  }, [user])

  return (
    <>
      <PortalHeading title="My activity" description="Recorded participation and verified hours associated with your account." />
      {error ? <DataError>{error}</DataError> : loading ? <p role="status">Loading activity…</p> : items.length === 0 ? <EmptyState>No activity has been recorded for your account yet.</EmptyState> : (
        <div className="overflow-x-auto rounded-2xl border border-[#f1d5d8] bg-white shadow-[0_14px_36px_rgba(74,22,27,0.05)]"><table className="w-full min-w-[36rem] text-left text-sm"><thead><tr className="border-b border-[#f1dfe1] bg-[#fff8f7]"><th className="p-4">Activity</th><th className="p-4">Date</th><th className="p-4">Status</th><th className="p-4">Verified hours</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b border-[#f1dfe1] last:border-0"><td className="p-4">{item.activity_type}</td><td className="p-4">{new Date(item.activity_date).toLocaleDateString()}</td><td className="p-4">{item.status}</td><td className="p-4">{item.hours ?? 'Not recorded'}</td></tr>)}</tbody></table></div>
      )}
    </>
  )
}

export function VolunteerAnnouncementsPage() {
  const [items, setItems] = useState<Array<{ id: string; title: string; body: string; published_at: string }>>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!supabase) return
    void supabase.from('announcements').select('id, title, body, published_at').eq('status', 'published').order('published_at', { ascending: false })
      .then(({ data, error: queryError }) => {
        setLoading(false)
        if (queryError) setError('Announcements could not be loaded.')
        else setItems(data ?? [])
      })
  }, [])
  return (
    <>
      <PortalHeading title="Announcements" description="Updates published for volunteers by HASH." />
      {error ? <DataError>{error}</DataError> : loading ? <p role="status">Loading announcements…</p> : items.length === 0 ? <EmptyState>There are no published announcements.</EmptyState> : <div className="space-y-5">{items.map((item) => <article key={item.id} className="rounded-3xl border border-[#f1d5d8] bg-white p-6 shadow-[0_14px_36px_rgba(74,22,27,0.05)]"><p className="text-xs font-semibold text-primary">{new Date(item.published_at).toLocaleDateString()}</p><h2 className="mt-2 text-xl font-bold">{item.title}</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-[#594140]">{item.body}</p></article>)}</div>}
    </>
  )
}

export function VolunteerResourcesPage() {
  const [items, setItems] = useState<TrainingResource[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!supabase) return
    void supabase.from('training_resources').select('id, title, description, resource_url, resource_path, required, approval_required').eq('status', 'published').order('title')
      .then(({ data, error: queryError }) => {
        setLoading(false)
        if (queryError) setError('Resources could not be loaded.')
        else setItems(data ?? [])
      })
  }, [])
  async function openResource(resource: TrainingResource) {
    if (!supabase || !resource.resource_path) return
    const { data, error: signedError } = await supabase.storage.from('volunteer-resources').createSignedUrl(resource.resource_path, 300)
    if (signedError || !data?.signedUrl) {
      setError('This resource could not be opened. Please contact HASH.')
      return
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }
  return (
    <>
      <PortalHeading title="Resources" description="Resources published for volunteer use by HASH." />
      {error ? <DataError>{error}</DataError> : loading ? <p role="status">Loading resources…</p> : items.length === 0 ? <EmptyState>No volunteer resources have been published.</EmptyState> : <div className="grid gap-5 md:grid-cols-2">{items.map((item) => <article key={item.id} className="interactive-card rounded-3xl border border-[#f1d5d8] bg-white p-6 shadow-[0_14px_36px_rgba(74,22,27,0.05)]"><h2 className="text-xl font-bold">{item.title}</h2>{item.description && <p className="mt-3 leading-7 text-[#594140]">{item.description}</p>}{item.resource_url && <a className="public-text-link mt-4 inline-block" href={item.resource_url} target="_blank" rel="noreferrer">Open resource</a>}{item.resource_path && <button onClick={() => void openResource(item)} className="public-text-link mt-4 block" type="button">Open secure resource</button>}</article>)}</div>}
    </>
  )
}

export function VolunteerSettingsPage() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    setError('')
    setMessage('')
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password') || '')
    if (password.length < 12) return setError('Use a password with at least 12 characters.')
    if (password !== String(form.get('confirmPassword') || '')) return setError('Passwords do not match.')
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) setError('Password could not be changed. Please try again.')
    else {
      setMessage('Your password has been updated.')
      event.currentTarget.reset()
    }
  }
  async function handleSignOut() {
    try {
      await signOut()
      navigate('/volunteer/login', { replace: true })
    } catch {
      setError('Sign out could not be completed. Please try again.')
    }
  }
  return (
    <>
      <PortalHeading title="Account settings" description="Manage your account password or sign out. To request account deactivation or deletion, contact HASH; account removal is handled through an authorised process." />
      <form onSubmit={(event) => void changePassword(event)} className="max-w-xl space-y-5 rounded-3xl border border-[#f1d5d8] bg-white p-7 shadow-[0_14px_36px_rgba(74,22,27,0.05)]">
        <h2 className="text-xl font-bold">Change password</h2>
        <label className={labelClass}>New password<input className={inputClass} type="password" name="password" minLength={12} autoComplete="new-password" required /></label>
        <label className={labelClass}>Confirm new password<input className={inputClass} type="password" name="confirmPassword" minLength={12} autoComplete="new-password" required /></label>
        {error && <DataError>{error}</DataError>}{message && <p role="status" className="text-sm text-green-800">{message}</p>}
        <Button type="submit" variant="outline">Update password</Button>
      </form>
      <div className="mt-6 max-w-xl rounded-3xl border border-[#f1d5d8] bg-white p-7 shadow-[0_14px_36px_rgba(74,22,27,0.05)]"><h2 className="text-xl font-bold">Sign out</h2><p className="mt-2 leading-7 text-[#594140]">End your current volunteer portal session on this device.</p><Button className="mt-4" onClick={() => void handleSignOut()} variant="outline">Sign out</Button></div>
      <p className="mt-6 text-sm text-[#594140]">For account deletion or deactivation, <Link to="/contact" className="public-text-link">contact HASH</Link>.</p>
    </>
  )
}
