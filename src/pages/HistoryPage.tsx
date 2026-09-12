import { timelineEvents } from '../data/siteContent'
import { SectionHeading } from '../components/ui/SectionHeading'

export function HistoryPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="History"
        title="HASH's growth in HIV community response."
        description="From a small volunteer-led initiative to a leading community-based HIV organisation, HASH has remained committed to accessible, stigma-free care."
      />

      <div className="mt-12 space-y-8">
        {timelineEvents.map((event) => (
          <div key={event.year} className="grid gap-4 rounded-3xl border border-[#f3dfe0] bg-white p-7 md:grid-cols-[140px_1fr]">
            <div className="text-2xl font-black text-primary">{event.year}</div>
            <div>
              <h3 className="text-2xl font-bold text-[#251818]">{event.title}</h3>
              <p className="mt-3 text-base leading-8 text-[#594140]">{event.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
