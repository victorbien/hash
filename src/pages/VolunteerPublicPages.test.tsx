import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ForgotPasswordPage, ResetPasswordPage, VolunteerDocumentPage, VolunteerLandingPage, VolunteerLoginPage, VolunteerRegistrationPage } from './VolunteerPublicPages'

const { from, insert, signInWithPassword, resetPasswordForEmail, updateUser } = vi.hoisted(() => ({
  from: vi.fn(),
  insert: vi.fn(),
  signInWithPassword: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({
  supabase: { from, auth: { signInWithPassword, resetPasswordForEmail, updateUser } },
}))

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({ user: null }),
}))

function renderRegistration() {
  return render(
    <MemoryRouter initialEntries={['/volunteer/register']}>
      <Routes>
        <Route path="/volunteer/register" element={<VolunteerRegistrationPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function fillSignUpFields() {
  fireEvent.change(screen.getByLabelText(/^First name/), { target: { value: 'Alex' } })
  fireEvent.change(screen.getByLabelText(/^Last name/), { target: { value: 'Volunteer' } })
  fireEvent.change(screen.getByLabelText(/^Email address/), { target: { value: 'alex@example.test' } })
  fireEvent.change(screen.getByLabelText(/^Preferred mode of contact/), { target: { value: 'email' } })
  fireEvent.click(screen.getByLabelText(/I understand HASH will use these details/))
  fireEvent.click(screen.getByLabelText(/I have read and agree to the/))
}

describe('volunteer sign-up sheet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    from.mockReturnValue({ insert })
    insert.mockResolvedValue({ error: null })
    signInWithPassword.mockResolvedValue({ error: null })
    resetPasswordForEmail.mockResolvedValue({ error: null })
    updateUser.mockResolvedValue({ error: null })
  })

  it('shows the sign-up sheet directly on the volunteer page', () => {
    render(<MemoryRouter><VolunteerLandingPage /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /interested in volunteering with HASH/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit sign-up/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /already a volunteer/i })).toBeInTheDocument()
  })

  it('keeps the volunteer login page reachable from the sign-up sheet', async () => {
    render(
      <MemoryRouter initialEntries={['/volunteer']}>
        <Routes>
          <Route path="/volunteer" element={<VolunteerLandingPage />} />
          <Route path="/volunteer/login" element={<VolunteerLoginPage />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('link', { name: /volunteer login/i }))

    expect(await screen.findByRole('heading', { name: /volunteer sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument()
  })

  it('collects the requested fields and stores the submission in Supabase', async () => {
    renderRegistration()
    fillSignUpFields()
    fireEvent.change(screen.getByLabelText(/^Pronouns/), { target: { value: 'they/them' } })
    fireEvent.change(screen.getByLabelText(/^Contact number/), { target: { value: '+639123456789' } })
    fireEvent.click(screen.getByRole('button', { name: /submit sign-up/i }))

    await waitFor(() => expect(from).toHaveBeenCalledWith('volunteer_interest_signups'))
    expect(insert).toHaveBeenCalledWith({
      first_name: 'Alex',
      last_name: 'Volunteer',
      pronouns: 'they/them',
      contact_number: '+639123456789',
      email: 'alex@example.test',
      preferred_contact_method: 'email',
      privacy_acknowledged: true,
      policies_acknowledged: true,
    })
    expect(await screen.findByRole('status')).toHaveTextContent(/Thank you for your interest/)
  })

  it('requires a contact number when phone contact is selected', async () => {
    renderRegistration()
    fillSignUpFields()
    fireEvent.change(screen.getByLabelText(/^Preferred mode of contact/), { target: { value: 'phone' } })
    fireEvent.click(screen.getByRole('button', { name: /submit sign-up/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/Enter a contact number/)
    expect(insert).not.toHaveBeenCalled()
  })

  it('provides a printable paper sign-up sheet', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    renderRegistration()
    expect(screen.getByRole('region', { name: /printable volunteer sign-up sheet/i })).toBeInTheDocument()
    const printButton = screen.getByRole('button', { name: /print sign-up sheet/i })
    expect(printButton).toHaveClass('public-outline-link', 'w-full', 'sm:w-auto')
    expect(printButton).toHaveAttribute('type', 'button')
    fireEvent.click(printButton)
    expect(print).toHaveBeenCalledOnce()
    print.mockRestore()
  })

  it('uses the shared centered form-button design for submission', () => {
    renderRegistration()
    const submitButton = screen.getByRole('button', { name: /submit sign-up/i })
    expect(submitButton).toHaveClass('public-outline-link', 'w-full', 'sm:w-auto')
    expect(submitButton).toHaveAttribute('type', 'submit')
  })

  it('links to temporary privacy and conduct documents and requires acceptance', () => {
    renderRegistration()

    expect(screen.getByRole('link', { name: 'Privacy Notice' })).toHaveAttribute('href', '/volunteer/privacy-notice')
    expect(screen.getByRole('link', { name: 'Code of Conduct' })).toHaveAttribute('href', '/volunteer/code-of-conduct')
    expect(screen.getByLabelText(/I have read and agree to the/)).toBeRequired()
  })

  it('shows temporary volunteer document content', () => {
    render(
      <MemoryRouter>
        <VolunteerDocumentPage document="privacy-notice" />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Volunteer Privacy Notice' })).toBeInTheDocument()
    expect(screen.getByText(/This is temporary guidance/)).toBeInTheDocument()
    expect(screen.getByText(/scheduled for deletion within 14 days/)).toBeInTheDocument()
  })

  it('supports sign-in and shows a generic invalid-credentials error', async () => {
    signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } })
    render(
      <MemoryRouter initialEntries={['/volunteer/login']}>
        <Routes>
          <Route path="/volunteer/login" element={<VolunteerLoginPage />} />
          <Route path="/volunteer/dashboard" element={<p>Volunteer dashboard</p>} />
        </Routes>
      </MemoryRouter>,
    )
    fireEvent.change(screen.getByLabelText(/^Email address/), { target: { value: 'alex@example.test' } })
    const password = screen.getByLabelText(/^Password/) as HTMLInputElement
    fireEvent.change(password, { target: { value: 'secret-value' } })
    const signInButton = screen.getByRole('button', { name: /^Sign in$/i })
    expect(signInButton).toHaveClass('public-outline-link', 'w-full')
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password).toHaveAttribute('type', 'text')
    fireEvent.click(signInButton)

    expect(await screen.findByRole('alert')).toHaveTextContent(/We could not sign you in/)
    expect(screen.getByRole('alert')).not.toHaveTextContent('alex@example.test')
  })

  it('redirects after a successful sign-in', async () => {
    render(
      <MemoryRouter initialEntries={['/volunteer/login']}>
        <Routes>
          <Route path="/volunteer/login" element={<VolunteerLoginPage />} />
          <Route path="/volunteer/dashboard" element={<p>Volunteer dashboard</p>} />
        </Routes>
      </MemoryRouter>,
    )
    fireEvent.change(screen.getByLabelText(/^Email address/), { target: { value: 'alex@example.test' } })
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: 'secret-value' } })
    fireEvent.click(screen.getByRole('button', { name: /^Sign in$/i }))

    expect(await screen.findByText('Volunteer dashboard')).toBeInTheDocument()
  })

  it('requests a password reset and uses a generic confirmation', async () => {
    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText(/^Email address/), { target: { value: 'alex@example.test' } })
    fireEvent.click(screen.getByRole('button', { name: /request reset link/i }))

    expect(await screen.findByRole('status')).toHaveTextContent(/If an account matches that address/)
    expect(resetPasswordForEmail).toHaveBeenCalledWith(
      'alex@example.test',
      expect.objectContaining({ redirectTo: expect.stringContaining('/volunteer/reset-password') }),
    )
  })

  it('handles expired password-reset sessions without changing the password', async () => {
    updateUser.mockResolvedValue({ error: { message: 'Invalid token' } })
    render(<MemoryRouter><ResetPasswordPage /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText(/^New password/), { target: { value: 'safe-passphrase-123' } })
    fireEvent.change(screen.getByLabelText(/^Confirm new password/), { target: { value: 'safe-passphrase-123' } })
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid or expired/)
    expect(updateUser).toHaveBeenCalledWith({ password: 'safe-passphrase-123' })
  })
})
