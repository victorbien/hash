import { render, screen, within } from '@testing-library/react'
import { vi } from 'vitest'
import { HistoryPage } from './HistoryPage'

const cmsState = vi.hoisted(() => ({
  content: null as null | Array<{ id: string; title: string; body: string; summary: string; category: string | null }>,
  error: null as string | null,
  configured: false,
}))

vi.mock('../cms/useCmsContent', () => ({
  usePublishedCmsContent: () => cmsState,
}))

describe('HistoryPage', () => {
  it('shows a detailed locally supplied timeline when CMS is not configured', () => {
    cmsState.content = null
    cmsState.error = null
    cmsState.configured = false

    render(<HistoryPage />)

    expect(screen.getByRole('heading', { name: /Community-Based Screening guidelines take shape/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Project HEAD delivers ARVs during lockdowns/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Quezon City community screening partnership sets reach targets/i })).toBeInTheDocument()
    expect(screen.getByText(/These are project targets, not reported completion figures/i)).toBeInTheDocument()
  })

  it('renders only published key milestones supplied by the CMS hook', () => {
    cmsState.configured = true
    cmsState.content = [
      { id: 'about', title: 'Mission', body: 'Mission details', summary: '', category: 'About HASH' },
      { id: 'milestone', title: '2024: Community outreach', body: 'A published milestone', summary: '', category: 'Key milestones' },
    ]

    render(<HistoryPage />)

    expect(screen.getByRole('heading', { name: '2024: Community outreach' })).toBeInTheDocument()
    expect(screen.getByText('A published milestone')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Mission' })).not.toBeInTheDocument()
  })

  it('shows an accessible skeleton while the CMS timeline is loading', () => {
    cmsState.configured = true
    cmsState.content = null
    cmsState.error = null

    render(<HistoryPage />)

    const loadingTimeline = screen.getByRole('status', { name: 'Loading HASH history' })
    expect(within(loadingTimeline).getByText('Loading HASH history')).toHaveClass('sr-only')
  })
})
