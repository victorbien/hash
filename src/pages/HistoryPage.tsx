import { timelineEvents } from '../data/siteContent'
import { BrandSectionIntro } from '../components/ui/BrandSectionIntro'
import { usePublishedCmsContent } from '../cms/useCmsContent'

export function HistoryPage() {
  const { content, error, configured } = usePublishedCmsContent('about')
  const milestones = configured
    ? (content ?? [])
        .filter((item) => item.category === 'Key milestones')
        .map((item, index) => ({
          id: item.id,
          period: item.title.match(/\b(?:19|20)\d{2}(?:[–-]\d{4})?\+?\b/)?.[0] ?? String(index + 1).padStart(2, '0'),
          title: item.title,
          description: item.body || item.summary,
        }))
    : timelineEvents.map((event) => ({
        id: `${event.year}-${event.title}`,
        period: event.year,
        title: event.title,
        description: event.description,
      }))

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <BrandSectionIntro
        eyebrow="History"
        title="HASH's growth in HIV community response."
        description="From a small volunteer-led initiative to a leading community-based HIV organisation, HASH has remained committed to accessible, stigma-free care."
      />

      {error && <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900" role="status">{error}</p>}

      {configured && content === null && !error ? (
        <div aria-label="Loading HASH history" aria-live="polite" className="mt-12 space-y-5" role="status">
          <span className="sr-only">Loading HASH history</span>
          {[0, 1, 2, 3].map((placeholder) => (
            <div aria-hidden="true" className="animate-pulse rounded-3xl border border-[#f1d5d8] bg-white p-7 shadow-[0_14px_36px_rgba(74,22,27,0.04)]" key={placeholder}>
              <div className="grid gap-5 md:grid-cols-[140px_1fr]">
                <div className="h-8 w-24 rounded-lg bg-[#fce5e7]" />
                <div>
                  <div className="h-7 w-2/3 rounded-lg bg-[#f5e8e8]" />
                  <div className="mt-4 h-4 w-full rounded-full bg-[#f5e8e8]" />
                  <div className="mt-2 h-4 w-4/5 rounded-full bg-[#f5e8e8]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : configured && content === null ? null : milestones.length > 0 ? (
        <div className="relative mt-12 space-y-5 before:absolute before:bottom-8 before:left-[2.15rem] before:top-8 before:w-px before:bg-[#efcbd0] md:before:left-[5.15rem]">
          {milestones.map((event, index) => (
            <article key={event.id} className="interactive-card group relative grid gap-5 rounded-3xl border border-[#f1d5d8] bg-white p-6 shadow-[0_14px_36px_rgba(74,22,27,0.04)] sm:p-7 md:grid-cols-[140px_1fr]">
              <div className="flex items-start gap-4 md:block">
                <span aria-hidden="true" className="relative z-10 mt-1 flex size-7 shrink-0 items-center justify-center rounded-full border-4 border-white bg-primary shadow-[0_0_0_1px_#efcbd0] md:ml-[3.45rem]" />
                <p className="font-[League_Spartan] text-2xl font-bold text-primary md:mt-3">{event.period}</p>
              </div>
              <div className="md:py-1">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Milestone {String(index + 1).padStart(2, '0')}</p>
                <h2 className="mt-2 font-[League_Spartan] text-2xl font-bold text-[#251818]">{event.title}</h2>
                <p className="mt-3 text-base leading-8 text-[#594140]">{event.description}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-2xl border border-[#f3dfe0] bg-white p-6 text-[#594140]">
          There are no published history milestones at this time.
        </p>
      )}
    </div>
  )
}
