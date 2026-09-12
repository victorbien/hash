import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

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

  it('renders the 404 page for unknown routes', () => {
    render(
      <MemoryRouter initialEntries={['/missing-route']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument()
  })
})
