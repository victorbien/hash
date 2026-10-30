import { Link } from 'react-router-dom'
import { BrandSectionIntro } from '../components/ui/BrandSectionIntro'
import { CmsContentSkeleton } from '../components/ui/CmsContentSkeleton'
import { usePublishedCmsContent } from '../cms/useCmsContent'
import { serviceHighlights } from '../data/siteContent'

export function ServicesPage() {
  const { content, error, configured } = usePublishedCmsContent('service')
  const services = configured
    ? (content ?? []).map((service) => ({
        title: service.title,
        summary: service.summary,
        slug: service.slug,
        href: `/services/${service.slug}`,
      }))
    : serviceHighlights

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <BrandSectionIntro
        eyebrow="Services"
        title="Accessible HIV services, designed for real life."
        description="HASH provides community-centered programmes that support prevention, testing, treatment linkage, self-testing, and ongoing care with a focus on dignity and access."
      />

      {error && <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900" role="status">{error}</p>}
      {configured && content === null && !error && <CmsContentSkeleton count={4} gridClassName="mt-10 grid gap-6 md:grid-cols-2" label="Loading services" />}
      {configured && content?.length === 0 && <p className="mt-6 rounded-2xl border border-[#f3dfe0] bg-white p-6 text-[#594140]">There are no published services at this time.</p>}
      {(!configured || content !== null) && <div className="mt-10 grid gap-6 md:grid-cols-2">
        {services.map((service) => (
          <article key={service.title} id={'slug' in service ? undefined : service.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')} className="interactive-card rounded-3xl border border-[#f3dfe0] bg-white p-8 shadow-[0_12px_30px_rgba(174,39,54,0.03)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Programme</p>
            <h3 className="mt-4 text-3xl font-bold text-[#251818]">{service.title}</h3>
            <p className="mt-5 text-base leading-8 text-[#594140]">{service.summary}</p>
            {'slug' in service
              ? <Link className="public-text-link mt-6 inline-block" to={service.href}>Read service details</Link>
              : <ul className="mt-6 space-y-3 text-sm leading-6 text-[#594140]">
                  <li>• Community-centered delivery</li>
                  <li>• Practical support pathways</li>
                  <li>• Access-focused education and referral</li>
                </ul>}
          </article>
        ))}
      </div>}
    </div>
  )
}
