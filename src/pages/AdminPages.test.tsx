import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthContext'
import { AdminBreadcrumb, AdminContentListPage, AdminDashboardPage, AdminLoginPage, AdminRoute } from './AdminPages'

const { getSession, onAuthStateChange, listCmsContent } = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  listCmsContent: vi.fn(),
}))

vi.mock('../cms/content', () => ({
  cmsContentTypes: ['about', 'service', 'resource', 'volunteer', 'home'],
  getCmsContentById: vi.fn(),
  isCmsConfigured: () => true,
  listCmsContent,
  saveCmsContent: vi.fn(),
  uploadCmsMedia: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession,
      onAuthStateChange,
    },
  },
}))

describe('CMS route protection', () => {
  beforeEach(() => {
    getSession.mockResolvedValue({ data: { session: null }, error: null })
    onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
    listCmsContent.mockResolvedValue([
      {
        id: 'service-published',
        content_type: 'service',
        title: 'Published service',
        slug: 'published-service',
        summary: '',
        body: '',
        category: 'Services',
        status: 'published',
        featured: false,
        display_order: 0,
        image_path: null,
        image_alt: null,
        seo_title: null,
        meta_description: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        published_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'service-draft',
        content_type: 'service',
        title: 'Draft service',
        slug: 'draft-service',
        summary: '',
        body: '',
        category: 'Services',
        status: 'draft',
        featured: false,
        display_order: 1,
        image_path: null,
        image_alt: null,
        seo_title: null,
        meta_description: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        published_at: null,
      },
    ])
  })

  it('redirects unauthenticated visitors from administration to staff sign in', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/content']}>
        <AuthProvider>
          <Routes>
            <Route element={<AdminRoute />}>
              <Route path="/admin/content" element={<p>Private CMS content</p>} />
            </Route>
            <Route path="/admin/login" element={<AdminLoginPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.queryByText('Private CMS content')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('heading', { name: 'HASH staff sign in' })).toBeInTheDocument())
  })

  it('shows the simple admin dashboard areas and labels unavailable admin tools', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminDashboardPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'HASH Administrator' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Pages.*Homepage, About/s })).toHaveAttribute('href', '/admin/content?area=pages')
    expect(screen.getByRole('link', { name: /Services.*Service descriptions/s })).toHaveAttribute('href', '/admin/content?type=service')
    expect(screen.getByRole('link', { name: /Total Items.*View content/s })).toHaveAttribute('href', '/admin/content')
    expect(screen.getByRole('link', { name: /Published.*View content/s })).toHaveAttribute('href', '/admin/content?status=published')
    expect(screen.getByRole('link', { name: /Draft.*View content/s })).toHaveAttribute('href', '/admin/content?status=draft')
    expect(screen.getByText(/Staff roles are managed through the trusted Supabase administrator process/)).toBeInTheDocument()
    expect(screen.getByText(/Browsing and restoring revisions are not available yet/)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Total Items')).toBeInTheDocument())
  })

  it.each([
    'published',
    'draft',
  ])('opens the %s content list with the matching filter selected', async (status) => {
    render(
      <MemoryRouter initialEntries={[`/admin/content?status=${status}`]}>
        <AdminContentListPage />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Website content' })).toBeInTheDocument())
    expect(screen.getByLabelText('Status')).toHaveValue(status)
    expect(screen.getByRole('link', { name: 'Create content' })).toBeInTheDocument()
  })

  it.each([
    ['/admin', 'Dashboard', 'Back to HASH website', '/'],
    ['/admin/content', 'Website content', 'Back to dashboard', '/admin'],
    ['/admin/preferences', 'General preferences', 'Back to dashboard', '/admin'],
    ['/admin/content/new', 'Create content', 'Back to website content', '/admin/content'],
    ['/admin/content/item-1/edit', 'Edit content', 'Back to website content', '/admin/content'],
  ])('shows breadcrumbs and a back link on %s', (path, current, backLabel, backHref) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <AdminBreadcrumb />
      </MemoryRouter>,
    )

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent(current)
    expect(screen.getByRole('link', { name: `← ${backLabel}` })).toHaveAttribute('href', backHref)
  })
})
