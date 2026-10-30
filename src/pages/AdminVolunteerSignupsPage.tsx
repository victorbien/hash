import { useEffect, useState } from 'react'
import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js'
import { useAuth } from '../auth/useAuth'
import { Button } from '../components/ui/Button'
import { supabase } from '../lib/supabase'

type VolunteerSignup = {
  id: string
  first_name: string
  last_name: string
  pronouns: string | null
  contact_number: string | null
  email: string
  preferred_contact_method: string
  created_at: string
  expires_at: string
  policies_acknowledged: boolean
  converted_at: string | null
}

async function getConversionErrorMessage(error: Error | null, data: unknown) {
  if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
    return data.error
  }
  if (error instanceof FunctionsHttpError) {
    try {
      const body: unknown = await error.context.json()
      if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
        return body.error
      }
    } catch {
      // Fall back to the HTTP status when the function did not return JSON.
    }
    const status = error.context.status
    if (status === 404) return 'The volunteer conversion function is not deployed to this Supabase project.'
    return `The volunteer conversion function returned HTTP ${status}. Check the Supabase function logs for details.`
  }
  if (error instanceof FunctionsRelayError) {
    return 'Supabase could not reach the volunteer conversion function. Check that it is deployed and inspect its function logs.'
  }
  if (error instanceof FunctionsFetchError) {
    return 'The browser could not reach the volunteer conversion function. Check the network connection and function CORS configuration.'
  }
  if (error) return `The volunteer conversion request failed: ${error.message}`
  return 'The volunteer conversion function returned an unexpected response. Check its deployment and Supabase function logs.'
}

export function AdminVolunteerSignupsPage() {
  const { user } = useAuth()
  const isAdministrator = user?.app_metadata?.role === 'admin'
  const [signups, setSignups] = useState<VolunteerSignup[]>([])
  const [loading, setLoading] = useState(isAdministrator && Boolean(supabase))
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({})
  const [convertingId, setConvertingId] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdministrator || !supabase) return
    let active = true
    void (async () => {
      try {
        const { data, error: loadError } = await supabase
          .from('volunteer_interest_signups')
          .select('id, first_name, last_name, pronouns, contact_number, email, preferred_contact_method, created_at, expires_at, policies_acknowledged, converted_at')
          .is('converted_at', null)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
        if (!active) return
        if (loadError) setError('Volunteer sign-ups could not be loaded. Check the volunteer sign-up and portal migrations.')
        else setSignups(data ?? [])
        setLoading(false)
      } catch {
        if (active) {
          setError('Volunteer sign-ups could not be loaded. Check the database connection and migration setup.')
          setLoading(false)
        }
      }
    })()
    return () => { active = false }
  }, [isAdministrator])

  async function convertSignup(signup: VolunteerSignup) {
    setError('')
    setMessage('')
    if (!supabase) {
      setError('Volunteer sign-ups cannot be converted because Supabase is not configured.')
      return
    }
    if (!confirmed[signup.id]) {
      setError('Confirm the application communications agreement before sending an invitation.')
      return
    }
    setConvertingId(signup.id)
    try {
      const { data, error: conversionError } = await supabase.functions.invoke('admin-convert-volunteer-signup', {
        body: { signup_id: signup.id, application_communications_acknowledged: true },
      })
      if (conversionError || !data?.success) {
        setError(await getConversionErrorMessage(conversionError, data))
        return
      }
      setSignups((current) => current.filter((item) => item.id !== signup.id))
      setMessage(`An account invitation was sent to ${signup.email}. Their application remains pending until HASH confirms required training is complete.`)
    } catch {
      setError('The account invitation could not be sent because the conversion service could not be reached. Check the sign-up before retrying.')
    } finally {
      setConvertingId(null)
    }
  }

  if (!isAdministrator) {
    return (
      <section className="rounded-3xl border border-[#f1dfe1] bg-white p-8">
        <h1 className="text-3xl font-bold">Access not authorised</h1>
        <p className="mt-4 leading-7 text-[#594140]">Only a HASH Administrator can review volunteer sign-ups and send account invitations.</p>
      </section>
    )
  }

  return (
    <section>
      <header className="mb-8 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">Volunteer administration</p>
        <h1 className="mt-2 text-4xl font-bold">Volunteer sign-ups</h1>
        <p className="mt-3 leading-7 text-[#594140]">Convert an online enquiry into a pending volunteer account. Conversion sends a password-setup invitation and does not approve portal access. Sign-ups are removed after 14 days.</p>
      </header>
      {error && <p className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-900" role="alert">{error}</p>}
      {message && <p className="mb-5 rounded-xl bg-green-50 p-4 text-sm text-green-900" role="status">{message}</p>}
      {!supabase && <p className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900" role="status">Supabase is not configured. Sign-ups cannot be loaded.</p>}
      {loading && <p role="status">Loading volunteer sign-ups…</p>}
      {!loading && !error && signups.length === 0 && (
        <div className="rounded-3xl border border-dashed border-[#dfc5c7] bg-white p-8 text-center text-[#594140]">
          There are no unconverted, unexpired online volunteer sign-ups.
        </div>
      )}
      <div className="space-y-5">
        {signups.map((signup) => (
          <article className="rounded-3xl border border-[#f1d5d8] bg-white p-6 shadow-[0_14px_36px_rgba(74,22,27,0.05)] sm:p-7" key={signup.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{signup.first_name} {signup.last_name}</h2>
                <a className="public-text-link mt-1 inline-block" href={`mailto:${signup.email}`}>{signup.email}</a>
              </div>
              <p className="text-sm text-[#594140]">Received {new Date(signup.created_at).toLocaleDateString()} · Expires {new Date(signup.expires_at).toLocaleDateString()}</p>
            </div>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <SignupDetail label="Pronouns" value={signup.pronouns} />
              <SignupDetail label="Contact number" value={signup.contact_number} />
              <SignupDetail label="Preferred contact" value={signup.preferred_contact_method} />
              <SignupDetail label="Privacy and conduct acceptance" value={signup.policies_acknowledged ? 'Accepted' : 'Not accepted'} />
            </dl>
            <div className="mt-6 border-t border-[#f1dfe1] pt-5">
              <label className="flex items-start gap-3 text-sm leading-6 text-[#594140]">
                <input
                  className="mt-1 size-4 accent-[#ae2736]"
                  checked={Boolean(confirmed[signup.id])}
                  onChange={(event) => setConfirmed((current) => ({ ...current, [signup.id]: event.target.checked }))}
                  type="checkbox"
                />
                <span>I confirm I have explained that account creation requires HASH to process the volunteer application and contact them about it, and the person agrees to this communication.</span>
              </label>
              <Button
                className="mt-4 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!signup.policies_acknowledged || convertingId !== null}
                onClick={() => void convertSignup(signup)}
                type="button"
                variant="outline"
              >
                {convertingId === signup.id ? 'Sending invitation…' : 'Create account and invite'}
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function SignupDetail({ label, value }: { label: string; value: string | null }) {
  return <div><dt className="font-semibold text-[#594140]">{label}</dt><dd className="mt-1">{value || 'Not provided'}</dd></div>
}
