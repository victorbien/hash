import { Button } from '../components/ui/Button'
import { BrandSectionIntro } from '../components/ui/BrandSectionIntro'
import { CmsContentSkeleton } from '../components/ui/CmsContentSkeleton'
import { CmsMediaImage } from '../components/ui/CmsMediaImage'
import { CmsSeoMeta } from '../components/ui/CmsSeoMeta'
import { usePublishedCmsContent } from '../cms/useCmsContent'

export function AboutPage() {
  const { content, error, configured } = usePublishedCmsContent('about')
  const aboutSections = content?.filter((section) => section.category !== 'Key milestones') ?? []
  const hasMilestones = content?.some((section) => section.category === 'Key milestones') ?? false

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <BrandSectionIntro
        eyebrow="About HASH"
        title="A community-powered response to HIV and care access."
        description="HASH is a Philippine community-based organisation established in 2015 by advocates committed to improving access to HIV prevention, treatment, care, and support services."
      />
      {content?.[0] && <CmsSeoMeta title={content[0].seo_title || 'About HASH'} description={content[0].meta_description || content[0].summary} />}

      {error && <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900" role="status">{error}</p>}
      {configured ? content && content.length > 0 ? (
        <>
          {aboutSections.length > 0 && (
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {aboutSections.map((section) => (
                <article className="interactive-card rounded-3xl border border-[#f3dfe0] bg-white p-8 shadow-[0_12px_30px_rgba(174,39,54,0.04)]" key={section.id}>
                  {section.category && <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">{section.category}</p>}
                  <h2 className="mt-2 text-3xl font-bold text-[#251818]">{section.title}</h2>
                  <CmsMediaImage className="mt-5 max-h-80 w-full rounded-2xl object-cover" path={section.image_path} alt={section.image_alt} />
                  {section.summary && <p className="mt-4 font-semibold leading-7 text-[#594140]">{section.summary}</p>}
                  <p className="mt-4 whitespace-pre-line leading-8 text-[#594140]">{section.body}</p>
                </article>
              ))}
            </div>
          )}
          {hasMilestones && (
            <Button as="link" className="mt-8" to="/history" variant="outline">
              Explore HASH’s history
            </Button>
          )}
        </>
      ) : content === null && !error ? (
        <CmsContentSkeleton count={2} gridClassName="mt-12 grid gap-6 md:grid-cols-2" label="Loading About content" showImage />
      ) : (
        <p className="mt-8 rounded-2xl border border-[#f3dfe0] bg-white p-6 text-[#594140]">There is no published About content at this time.</p>
      ) : (
        <>
      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <article className="interactive-card rounded-3xl bg-white p-8 shadow-[0_12px_30px_rgba(174,39,54,0.04)]">
          <h3 className="text-3xl font-bold text-[#251818]">Mission</h3>
          <p className="mt-5 text-base leading-8 text-[#594140]">
            HASH works to ensure that people affected by HIV have access to quality, stigma-free, community-centered services. The organisation focuses on prevention, testing, treatment linkage, PrEP, HIV self-testing, youth engagement, workplace HIV policies, harm reduction, community-led monitoring, digital health, and advocacy.
          </p>
        </article>

        <article className="interactive-card rounded-3xl bg-[#fff0ef] p-8 shadow-[0_12px_30px_rgba(174,39,54,0.04)]">
          <h3 className="text-3xl font-bold text-[#251818]">Approach</h3>
          <p className="mt-5 text-base leading-8 text-[#594140]">
            HASH takes a community-led, people-centered approach to HIV care. It combines service delivery with education, outreach, and partnership-building to reduce barriers and strengthen trust for the people it serves.
          </p>
        </article>
      </div>

      <section className="mt-16">
        <h3 className="text-3xl font-bold text-[#251818]">Key milestones</h3>
        <div className="mt-8 space-y-5">
          {[
            'Founded in 2015 by community advocates committed to improving HIV response in the Philippines.',
            'Expanded from a volunteer-led initiative into a leading community-based HIV organisation.',
            'Pioneered Community-Based HIV Screening (CBS) as part of a practical, localised prevention and testing model.',
            'Built community case management, self-testing distribution, and PrEP support pathways.',
            'Continued partnerships and strategic initiatives from 2024–2027 in youth leadership, workplace HIV policy, and community-led monitoring.',
          ].map((item) => (
            <div key={item} className="interactive-card flex gap-4 rounded-2xl border border-[#f3dfe0] bg-white p-5">
              <div className="mt-1 h-3 w-3 rounded-full bg-primary" />
              <p className="text-base leading-7 text-[#594140]">{item}</p>
            </div>
          ))}
        </div>
      </section>
        </>
      )}
    </div>
  )
}
