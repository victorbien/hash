import { Link } from 'react-router-dom'
import { resources } from '../data/siteContent'
import { BrandSectionIntro } from '../components/ui/BrandSectionIntro'
import { CmsContentSkeleton } from '../components/ui/CmsContentSkeleton'
import { usePublishedCmsContent } from '../cms/useCmsContent'
import { CmsMediaImage } from '../components/ui/CmsMediaImage'

export function ResourcesPage() {
  const { content, error, configured } = usePublishedCmsContent('resource')

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <BrandSectionIntro
        eyebrow="Resources"
        title="Educational resources for informed, confident communities."
        description="HASH develops practical learning materials and public resources to support HIV literacy, prevention, and community action."
      />
      {error && <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900" role="status">{error}</p>}
      {configured && content?.length === 0 && <p className="mt-6 rounded-2xl border border-[#f3dfe0] bg-white p-6 text-[#594140]">There are no published resources at this time.</p>}
      {configured && content === null && !error ? (
        <CmsContentSkeleton gridClassName="mt-10 grid gap-6 md:grid-cols-3" label="Loading resources" showImage />
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {configured
            ? (content ?? []).map((resource) => (
              <article key={resource.id} className="interactive-card rounded-3xl border border-[#f3dfe0] bg-white p-7 shadow-[0_12px_30px_rgba(174,39,54,0.03)]">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{resource.category ?? 'Resource'}</p>
                <h3 className="mt-4 text-2xl font-bold text-[#251818]">{resource.title}</h3>
                <CmsMediaImage className="mt-4 max-h-56 w-full rounded-xl object-cover" path={resource.image_path} alt={resource.image_alt} />
                <p className="mt-4 text-sm leading-7 text-[#594140]">{resource.summary}</p>
                <Link to={`/resources/${resource.slug}`} className="public-text-link mt-6 inline-block">View resource →</Link>
              </article>
            ))
            : resources.map((resource) => (
              <article key={resource.title} className="interactive-card rounded-3xl border border-[#f3dfe0] bg-white p-7 shadow-[0_12px_30px_rgba(174,39,54,0.03)]">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{resource.type}</p>
                <h3 className="mt-4 text-2xl font-bold text-[#251818]">{resource.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#594140]">{resource.description}</p>
                <a href={resource.href} className="public-text-link mt-6 inline-block">View resource →</a>
              </article>
            ))}
        </div>
      )}
    </div>
  )
}
