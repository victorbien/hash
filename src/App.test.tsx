import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import App from './App'

vi.mock('./cms/useCmsContent', () => ({
  usePublishedCmsContent: (contentType: string) => ({
    content: contentType === 'home'
      ? [{
          id: 'home-hero',
          content_type: 'home',
          title: 'Compassionate HIV support rooted in community care.',
          slug: 'hero',
          summary: '',
          body: '',
          category: 'Homepage',
          status: 'published',
          featured: true,
          display_order: 0,
          image_path: null,
          image_alt: null,
          seo_title: null,
          meta_description: null,
          created_at: '',
          updated_at: '',
          published_at: '',
        }]
      : [],
    error: null,
    configured: true,
  }),
}))

describe('HASH website routing', () => {
  it('renders the home page at the root route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /Compassionate HIV support rooted in community care/i })).toBeInTheDocument()
  })

  it('renders the about page', () => {
    render(
      <MemoryRouter initialEntries={['/about']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /A community-powered response to HIV and care access/i })).toBeInTheDocument()
  })

  it('keeps the volunteer privacy notice publicly accessible', () => {
    render(
      <MemoryRouter initialEntries={['/volunteer/privacy-notice']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Volunteer Privacy Notice' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument()
  })

  it('keeps the volunteer code of conduct publicly accessible', () => {
    render(
      <MemoryRouter initialEntries={['/volunteer/code-of-conduct']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Volunteer Code of Conduct' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument()
  })

  it('uses the Learn more outline style for homepage and page-navigation calls to action', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    for (const label of ['Learn About HASH', 'Explore Services']) {
      const link = screen.getByRole('link', { name: label })
      expect(link).toHaveClass('public-outline-link')
    }
  })

  it('keeps the active navigation item branded in primary red on hover and keyboard focus', () => {
    render(
      <MemoryRouter initialEntries={['/about']}>
        <App />
      </MemoryRouter>,
    )

    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    const aboutLink = within(nav).getByRole('link', { name: /^about$/i })

    expect(aboutLink).toHaveClass('text-[var(--primary)]')
    expect(aboutLink).toHaveClass('hover:text-[var(--primary)]')
    expect(aboutLink).toHaveClass('focus-visible:text-[var(--primary)]')
  })

  it('styles all header links like the primary navigation links', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    const appointmentLink = screen.getByRole('link', { name: 'Book an appointment' })
    const involvedLink = screen.getByRole('link', { name: 'Get Involved' })
    expect(screen.queryByRole('link', { name: 'Get Support' })).not.toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    const aboutLink = within(nav).getByRole('link', { name: /^about$/i })
    const contactLink = within(nav).getByRole('link', { name: 'Contact' })

    for (const link of [appointmentLink, involvedLink, contactLink]) {
      expect(link).toHaveClass('nav-link')
      expect(link).not.toHaveClass('border-primary')
      expect(link).not.toHaveClass('bg-primary')
    }
    expect(aboutLink).toHaveClass('nav-link')
  })

  it('provides a toggleable mobile menu with the full navigation', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    const openButton = screen.getByRole('button', { name: 'Open navigation menu' })
    fireEvent.click(openButton)

    const mobileNav = screen.getByRole('navigation', { name: 'Mobile navigation' })
    expect(within(mobileNav).getByRole('link', { name: 'About' })).toBeInTheDocument()
    expect(within(mobileNav).getByRole('link', { name: 'Book an appointment' })).toHaveAttribute('href', '/schedule')
    expect(within(mobileNav).queryByRole('link', { name: 'Get Support' })).not.toBeInTheDocument()
    expect(within(mobileNav).getAllByRole('link').at(-1)).toHaveTextContent('Contact')
    expect(screen.getByRole('button', { name: 'Close navigation menu' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('uses a single-line desktop navigation and a mobile menu below wide screens', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toHaveClass('hidden', 'xl:flex', 'flex-nowrap')
    expect(screen.getByRole('button', { name: 'Open navigation menu' })).toHaveClass('xl:hidden')
  })

  it('marks the appointment navigation link active on the scheduling route', () => {
    render(
      <MemoryRouter initialEntries={['/schedule']}>
        <App />
      </MemoryRouter>,
    )

    const nav = screen.getByRole('navigation', { name: 'Main navigation' })
    const appointmentLink = within(nav).getByRole('link', { name: 'Book an appointment' })
    expect(appointmentLink).toHaveAttribute('aria-current', 'page')
    expect(appointmentLink).toHaveClass('active-nav-link', 'text-[var(--primary)]')
  })

  it('enlarges the logo without increasing its fixed header height', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    const logo = screen.getByRole('img', { name: 'HASH logo' })
    expect(logo).toHaveClass('h-12', 'w-36', 'sm:h-16', 'sm:w-48', 'xl:h-20', 'xl:w-56', 'object-cover')
  })

  it('renders the 404 page for unknown routes', () => {
    render(
      <MemoryRouter initialEntries={['/missing-route']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument()
  })
})
