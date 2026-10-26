import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { Button } from '../components/ui/Button'
import { supabase } from '../lib/supabase'

const inputClass =
  'mt-2 w-full rounded-xl border border-[#f1dfe1] bg-white px-4 py-3 text-[#251818] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
const labelClass = 'block text-sm font-semibold text-[#251818]'

function AuthConfigurationMessage() {
  return (
    <div className="rounded-2xl border border-[#f1dfe1] bg-white p-5 text-sm leading-6 text-[#594140]" role="status">
      Account services are not configured. HASH must connect a Supabase project before this feature can be used.
    </div>
  )
}

function VolunteerPageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="max-w-2xl">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h1 className="text-3xl font-bold tracking-tight text-[#251818] md:text-4xl">{title}</h1>
      <p className="mt-4 text-base leading-7 text-[#594140] md:text-lg">{description}</p>
    </div>
  )
}

function PasswordField({ label, name, autoComplete }: { label: string; name: string; autoComplete: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <label className={labelClass}>
      {label}
      <span className="relative block">
        <input className={`${inputClass} pr-24`} type={visible ? 'text' : 'password'} name={name} autoComplete={autoComplete} required />
        <button
          type="button"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-semibold text-primary underline"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </span>
    </label>
  )
}

export function VolunteerLandingPage() {
  return <VolunteerRegistrationPage />
}

export function VolunteerRegistrationPage() {
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const formElement = event.currentTarget
    if (!supabase) {
      setError('The sign-up service is not configured yet. Please contact HASH directly.')
      return
    }
    if (!formElement.checkValidity()) {
      formElement.reportValidity()
      return
    }

    const form = new FormData(formElement)
    if (String(form.get('website') || '').trim()) {
      setSubmitted(true)
      return
    }

    const email = String(form.get('email') || '').trim().toLowerCase()
    const contactMethod = String(form.get('contactMethod') || '')
    const phone = String(form.get('phone') || '').trim()
    if ((contactMethod === 'phone' || contactMethod === 'text') && !phone) {
      setError('Enter a contact number for your selected contact method.')
      return
    }
    setBusy(true)
    try {
      const { error: insertError } = await supabase.from('volunteer_interest_signups').insert({
        first_name: String(form.get('firstName') || '').trim(),
        last_name: String(form.get('lastName') || '').trim(),
        pronouns: String(form.get('pronouns') || '').trim() || null,
        contact_number: phone || null,
        email,
        preferred_contact_method: contactMethod,
        privacy_acknowledged: true,
      })
      if (insertError) {
        setError('We could not save your sign-up. Please try again or contact HASH directly.')
        return
      }
      setSubmitted(true)
    } catch {
      setError('The sign-up service could not be reached. Your details were not submitted; please try again or contact HASH.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="no-print">
        <VolunteerPageHeading
          eyebrow="Volunteer sign-up sheet"
          title="Interested in volunteering with HASH?"
          description="Share your contact details and HASH will get in touch. You do not need to create an account."
        />
        <div className="mt-6 rounded-2xl border border-[#e7c7a4] bg-[#fff8eb] p-5 text-sm leading-6 text-[#594140]">
          HASH (HIV &amp; AIDS Support House, Inc.) uses the details below to respond to your volunteer enquiry. Your online submission is stored in HASH's Supabase database and automatically deleted 14 days after submission. Do not include health information or details about clients or service users. Questions or requests: <a className="public-text-link" href="mailto:hash@hashinfo.org">hash@hashinfo.org</a>.
        </div>
        {!supabase && (
          <div className="mt-4 rounded-2xl border border-[#f1dfe1] bg-white p-5 text-sm leading-6 text-[#594140]" role="status">
            The online sign-up service is not configured yet. You can still print the sheet below or contact HASH directly.
          </div>
        )}
        {submitted ? (
          <p className="mt-8 rounded-2xl bg-[#fff0ef] p-6 leading-7" role="status">
            Thank you for your interest. HASH will contact you using your preferred method.
          </p>
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)} className="mt-8 space-y-6 rounded-3xl border border-[#f1dfe1] bg-white p-6 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className={labelClass}>First name<input className={inputClass} name="firstName" autoComplete="given-name" maxLength={120} required /></label>
              <label className={labelClass}>Last name<input className={inputClass} name="lastName" autoComplete="family-name" maxLength={120} required /></label>
              <label className={labelClass}>Pronouns <span className="font-normal">(optional)</span><input className={inputClass} name="pronouns" maxLength={80} /></label>
              <label className={labelClass}>Contact number <span className="font-normal">(optional unless selected below)</span><input className={inputClass} name="phone" type="tel" autoComplete="tel" maxLength={80} /></label>
              <label className={labelClass}>Email address<input className={inputClass} name="email" type="email" autoComplete="email" maxLength={254} required /></label>
              <label className={labelClass}>Preferred mode of contact
                <select className={inputClass} name="contactMethod" defaultValue="" required>
                  <option value="" disabled>Select a method</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone call</option>
                  <option value="text">Text message</option>
                </select>
              </label>
            </div>
            <label className="flex items-start gap-3 text-sm leading-6 text-[#594140]">
              <input className="mt-1 size-4 accent-[#ae2736]" name="privacyAcknowledgement" type="checkbox" required />
              <span>I understand HASH will use these details to respond to my volunteer enquiry and delete this online sign-up within 14 days after submission.</span>
            </label>
            <input aria-hidden="true" autoComplete="off" className="absolute -left-[10000px]" name="website" tabIndex={-1} type="text" />
            {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button disabled={!supabase || busy} className="w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto" type="submit" variant="outline">
                {busy ? 'Submitting…' : 'Submit sign-up'}
              </Button>
              <Button className="no-print w-full sm:w-auto" onClick={() => window.print()} type="button" variant="outline">Print sign-up sheet</Button>
            </div>
          </form>
        )}
      </div>
      <section aria-labelledby="volunteer-login-heading" className="no-print mt-8 rounded-2xl border border-[#f1dfe1] bg-white px-6 py-5 text-center shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-6 sm:text-left">
        <div>
          <h2 className="text-xl font-bold text-[#251818]" id="volunteer-login-heading">Already a volunteer?</h2>
          <p className="mt-2 text-sm leading-6 text-[#594140]">Sign in to access your volunteer portal, application, and available resources.</p>
        </div>
        <Button as="link" className="mt-4 w-full sm:mt-0 sm:w-auto" to="/volunteer/login" variant="outline">Volunteer login</Button>
      </section>
      <section aria-label="Printable volunteer sign-up sheet" className="volunteer-signup-print">
        <h1>HASH Volunteer Sign-up Sheet</h1>
        <p>HIV &amp; AIDS Support House, Inc. | Questions or privacy requests: hash@hashinfo.org</p>
        <p>HASH will use these details to respond to your volunteer enquiry and keep this sheet for up to 14 days after collection. By writing your details, you acknowledge this use. Please do not write health information or details about clients or service users.</p>
        <table>
          <thead>
            <tr>
              <th>First name</th>
              <th>Last name</th>
              <th>Pronouns (optional)</th>
              <th>Contact number</th>
              <th>Email address</th>
              <th>Preferred contact</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }, (_, index) => (
              <tr key={index}>
                {Array.from({ length: 6 }, (_, cellIndex) => <td key={cellIndex}>&nbsp;</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

export function VolunteerLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, error: authError } = useAuth()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const destination = (location.state as { from?: string } | null)?.from
  if (user) return <Navigate to="/volunteer/dashboard" replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return setError('Account services are not configured. Please contact HASH.')
    setBusy(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: String(form.get('email') || '').trim(),
      password: String(form.get('password') || ''),
    })
    setBusy(false)
    if (signInError) {
      setError('We could not sign you in with those details. Check your email and password, or reset your password.')
      return
    }
    navigate(destination?.startsWith('/volunteer/') ? destination : '/volunteer/dashboard', { replace: true })
  }

  return (
    <section className="mx-auto max-w-xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold">Volunteer sign in</h1>
      <p className="mt-3 leading-7 text-[#594140]">Sign in to access your volunteer account.</p>
      {!supabase && <div className="mt-5"><AuthConfigurationMessage /></div>}
      <form onSubmit={(event) => void handleSubmit(event)} className="mt-8 space-y-5 rounded-3xl border border-[#f1dfe1] bg-white p-7">
        <label className={labelClass}>Email address<input className={inputClass} type="email" name="email" autoComplete="email" required /></label>
        <PasswordField label="Password" name="password" autoComplete="current-password" />
        {(error || authError) && <p role="alert" className="text-sm text-red-800">{error || authError}</p>}
        <Button disabled={busy || !supabase} className="w-full disabled:cursor-not-allowed disabled:opacity-50" type="submit">{busy ? 'Signing in…' : 'Sign in'}</Button>
        <div className="flex flex-wrap justify-between gap-3 text-sm"><Link className="public-text-link" to="/volunteer/forgot-password">Forgot password?</Link><Link className="public-text-link" to="/volunteer/register">Volunteer sign-up sheet</Link></div>
      </form>
    </section>
  )
}

export function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) {
      setError('Password reset is not configured. Please contact HASH.')
      return
    }
    const form = new FormData(event.currentTarget)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(String(form.get('email') || '').trim(), {
      redirectTo: `${window.location.origin}/volunteer/reset-password`,
    })
    if (resetError) {
      setError('We could not process the request right now. Please try again later.')
      return
    }
    setSubmitted(true)
  }

  return (
    <section className="mx-auto max-w-xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold">Reset your password</h1>
      <p className="mt-3 leading-7 text-[#594140]">Enter your email address to request a secure password reset.</p>
      {submitted ? <p className="mt-6 rounded-2xl bg-[#fff0ef] p-5 leading-7" role="status">If an account matches that address and email delivery is configured, the authentication service will send password-reset instructions.</p> : (
        <form onSubmit={(event) => void handleSubmit(event)} className="mt-8 space-y-5 rounded-3xl border border-[#f1dfe1] bg-white p-7">
          <label className={labelClass}>Email address<input className={inputClass} type="email" name="email" autoComplete="email" required /></label>
          {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
          <Button disabled={!supabase} className="w-full disabled:cursor-not-allowed disabled:opacity-50" type="submit">Request reset link</Button>
        </form>
      )}
      <Link className="public-text-link mt-5 inline-block" to="/volunteer/login">Back to sign in</Link>
    </section>
  )
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return setError('Password reset is not configured. Please contact HASH.')
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password') || '')
    if (password.length < 12) return setError('Use a password with at least 12 characters.')
    if (password !== String(form.get('confirmPassword') || '')) return setError('Passwords do not match.')
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError('This password reset link is invalid or expired. Request a new link and try again.')
      return
    }
    setMessage('Your password has been updated.')
    window.setTimeout(() => navigate('/volunteer/login', { replace: true }), 1200)
  }

  return (
    <section className="mx-auto max-w-xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold">Choose a new password</h1>
      <form onSubmit={(event) => void handleSubmit(event)} className="mt-8 space-y-5 rounded-3xl border border-[#f1dfe1] bg-white p-7">
        <label className={labelClass}>New password<input className={inputClass} type="password" name="password" minLength={12} autoComplete="new-password" required /></label>
        <label className={labelClass}>Confirm new password<input className={inputClass} type="password" name="confirmPassword" minLength={12} autoComplete="new-password" required /></label>
        {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
        {message && <p role="status" className="text-sm text-green-800">{message}</p>}
        <Button disabled={!supabase} className="w-full disabled:cursor-not-allowed disabled:opacity-50" type="submit">Update password</Button>
      </form>
    </section>
  )
}
