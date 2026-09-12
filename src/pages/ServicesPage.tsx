import { serviceHighlights } from '../data/siteContent'
import { SectionHeading } from '../components/ui/SectionHeading'

export function ServicesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Services"
        title="Accessible HIV services, designed for real life."
        description="HASH provides community-centered programmes that support prevention, testing, treatment linkage, self-testing, and ongoing care with a focus on dignity and access."
      />

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {serviceHighlights.map((service) => (
          <article key={service.title} id={service.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')} className="rounded-3xl border border-[#f3dfe0] bg-white p-8 shadow-[0_12px_30px_rgba(174,39,54,0.03)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Programme</p>
            <h3 className="mt-4 text-3xl font-bold text-[#251818]">{service.title}</h3>
            <p className="mt-5 text-base leading-8 text-[#594140]">{service.summary}</p>
            <ul className="mt-6 space-y-3 text-sm leading-6 text-[#594140]">
              <li>• Community-centered delivery</li>
              <li>• Practical support pathways</li>
              <li>• Access-focused education and referral</li>
            </ul>
          </article>
        ))}
      </div>
    </div>
  )
}
