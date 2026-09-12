import { resources } from '../data/siteContent'
import { SectionHeading } from '../components/ui/SectionHeading'

export function ResourcesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Resources"
        title="Educational resources for informed, confident communities."
        description="HASH develops practical learning materials and public resources to support HIV literacy, prevention, and community action."
      />

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {resources.map((resource) => (
          <article key={resource.title} className="rounded-3xl border border-[#f3dfe0] bg-white p-7 shadow-[0_12px_30px_rgba(174,39,54,0.03)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{resource.type}</p>
            <h3 className="mt-4 text-2xl font-bold text-[#251818]">{resource.title}</h3>
            <p className="mt-4 text-sm leading-7 text-[#594140]">{resource.description}</p>
            <a href={resource.href} className="mt-6 inline-block text-sm font-semibold text-primary">View resource →</a>
          </article>
        ))}
      </div>
    </div>
  )
}
