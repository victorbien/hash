import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { SectionHeading } from '../components/ui/SectionHeading'
import { CmsMediaImage } from '../components/ui/CmsMediaImage'
import { CmsContentSkeleton } from '../components/ui/CmsContentSkeleton'
import { CmsSeoMeta } from '../components/ui/CmsSeoMeta'
import { quickFacts, serviceHighlights, stats } from '../data/siteContent'
import { usePublishedCmsContent } from '../cms/useCmsContent'

export function HomePage() {
  const { content: homeContent, error, configured } = usePublishedCmsContent('home')
  const { content: publishedServices, error: servicesError } = usePublishedCmsContent('service')
  const heroContent = homeContent?.[0]
  const isHomeLoading = configured && homeContent === null && !error
  const homepageSections = homeContent?.slice(1) ?? []
  const whoWeAre = homepageSections.find((item) => item.slug === 'who-we-are')
  const quickFactSections = homepageSections.filter((item) => item.category === 'Quick fact')
  const additionalHomepageSections = homepageSections.filter(
    (item) => item !== whoWeAre && item.category !== 'Quick fact',
  )

  return (
    <>
      {heroContent && <CmsSeoMeta title={heroContent.seo_title || `${heroContent.title} | HASH`} description={heroContent.meta_description || heroContent.summary} />}
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_top_left,_rgba(174,39,54,0.13),_transparent_50%)]" />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center">
            <span className="mb-5 inline-flex w-fit rounded-full bg-[#fce5e7] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Community first
            </span>
            {isHomeLoading ? (
              <div aria-label="Loading homepage" aria-live="polite" className="max-w-xl space-y-5" role="status">
                <span className="sr-only">Loading homepage</span>
                <div aria-hidden="true" className="animate-pulse space-y-4">
                  <div className="h-12 w-4/5 rounded-xl bg-[#f5e8e8] md:h-16" />
                  <div className="h-5 w-full rounded-full bg-[#fce5e7]" />
                  <div className="h-5 w-11/12 rounded-full bg-[#fce5e7]" />
                  <div className="h-5 w-3/4 rounded-full bg-[#fce5e7]" />
                </div>
              </div>
            ) : (
              <>
                <h1 className="max-w-xl text-5xl font-black tracking-tight text-[#251818] md:text-6xl">
                  {heroContent?.title ?? (configured ? 'HASH community information' : 'Compassionate HIV support rooted in community care.')}
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-8 text-[#594140]">
                  {heroContent?.summary || (configured ? 'Homepage information is being prepared.' : 'HASH works to make HIV prevention, testing, treatment linkage, and support more accessible, stigma-free, and human-centered for people across the Philippines.')}
                </p>
              </>
            )}
            {error && <p className="mt-3 max-w-xl text-sm text-amber-900" role="status">{error}</p>}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button as="link" to="/about" variant="outline">Learn About HASH</Button>
              <Button as="link" to="/services" variant="outline">Explore Services</Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-[#f8dfe1] blur-3xl" />
            {configured
              ? heroContent?.image_path
                ? <CmsMediaImage className="relative h-[520px] w-full rounded-[2rem] object-cover shadow-[0_35px_80px_rgba(174,39,54,0.18)]" path={heroContent.image_path} alt={heroContent.image_alt} />
                : <div className={`relative h-[520px] rounded-[2rem] bg-[#fff0ef] ${isHomeLoading ? 'animate-pulse' : ''}`} aria-hidden="true" />
              : <img
                  src="/assets/images/mainpage/hero-hash.jpg"
                  alt="HASH volunteers and community members in a supportive outreach setting"
                  className="relative h-[520px] w-full rounded-[2rem] object-cover shadow-[0_35px_80px_rgba(174,39,54,0.18)]"
                />}
            {!configured && <div className="absolute bottom-6 left-6 max-w-xs rounded-2xl border border-white/60 bg-white/85 p-4 shadow-lg backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Trusted care</p>
              <p className="mt-2 text-sm leading-6 text-[#594140]">
                “People deserve access to HIV care that is respectful, practical, and stigma-free.”
              </p>
            </div>}
          </div>
        </div>
      </section>

      {isHomeLoading && (
        <section aria-label="Loading homepage sections" className="bg-[#fff8f7] py-16 sm:py-20">
          <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
            <div aria-hidden="true" className="animate-pulse rounded-[2rem] bg-[#ae2736]/20 p-10">
              <div className="h-3 w-24 rounded-full bg-white/70" />
              <div className="mt-5 h-10 w-2/3 rounded-xl bg-white/70" />
              <div className="mt-5 h-4 w-4/5 rounded-full bg-white/60" />
              <div className="mt-3 h-4 w-3/5 rounded-full bg-white/60" />
            </div>
            <CmsContentSkeleton count={4} gridClassName="grid gap-5 sm:grid-cols-2 xl:grid-cols-4" label="Loading homepage sections" />
          </div>
        </section>
      )}

      {configured && homeContent && homeContent.length > 1 && (
        <section aria-label="Who we are" className="bg-[#fff8f7] py-16 sm:py-20">
          <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
            {whoWeAre && (
              <article className="relative isolate overflow-hidden rounded-[2rem] bg-[#ae2736] p-8 text-white shadow-[0_28px_70px_rgba(174,39,54,0.20)] sm:p-10 lg:p-12">
                <div aria-hidden="true" className="absolute -right-20 -top-28 -z-10 size-80 rounded-full border-[36px] border-white/10" />
                <div aria-hidden="true" className="absolute -bottom-28 right-28 -z-10 size-56 rounded-full bg-[#d95d69]/40 blur-2xl" />
                <div className="max-w-3xl">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#ffd9dc]">Our story</p>
                  <h2 className="mt-4 font-[League_Spartan] text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{whoWeAre.title}</h2>
                  {whoWeAre.summary && <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-white">{whoWeAre.summary}</p>}
                  {whoWeAre.body && <p className="mt-4 max-w-2xl leading-7 text-white/85">{whoWeAre.body}</p>}
                </div>
              </article>
            )}

            {quickFactSections.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {quickFactSections.map((item, index) => (
                  <article
                    className="interactive-card group relative isolate min-h-48 overflow-hidden rounded-3xl border border-[#f1d5d8] bg-white p-6 shadow-[0_14px_36px_rgba(74,22,27,0.05)]"
                    key={item.id}
                  >
                    <div aria-hidden="true" className="absolute -right-8 -top-9 -z-10 size-28 rounded-full bg-[#fff0ef] transition duration-200 group-hover:scale-125" />
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{item.title}</p>
                      <span aria-hidden="true" className="text-xs font-bold tracking-widest text-[#d9a3a8]">{String(index + 1).padStart(2, '0')}</span>
                    </div>
                    {item.summary && <p className="mt-7 text-xl font-black leading-snug text-[#251818]">{item.summary}</p>}
                    {item.body && <p className="mt-3 text-sm leading-6 text-[#594140]">{item.body}</p>}
                    <div aria-hidden="true" className="absolute bottom-0 left-6 h-1 w-10 rounded-t-full bg-primary transition-all duration-200 group-hover:w-16" />
                  </article>
                ))}
              </div>
            )}

            {additionalHomepageSections.length > 0 && (
              <div className="grid gap-5 md:grid-cols-2">
                {additionalHomepageSections.map((item) => (
                  <article className="interactive-card group relative overflow-hidden rounded-3xl border border-[#f1d5d8] bg-white p-7 shadow-[0_14px_36px_rgba(74,22,27,0.04)] sm:p-8" key={item.id}>
                    <div aria-hidden="true" className="absolute right-0 top-0 h-1.5 w-24 rounded-bl-full bg-primary transition-all duration-200 group-hover:w-36" />
                    {item.category && <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{item.category}</p>}
                    <h2 className="mt-3 font-[League_Spartan] text-3xl font-bold text-[#251818]">{item.title}</h2>
                    {item.summary && <p className="mt-3 font-semibold leading-7 text-[#594140]">{item.summary}</p>}
                    {item.body && <p className="mt-3 whitespace-pre-line leading-7 text-[#594140]">{item.body}</p>}
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {!configured && <section className="bg-[#fff0ef] py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-2 md:grid-cols-4 sm:px-6 lg:px-8">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white p-6 text-center shadow-[0_18px_40px_rgba(174,39,54,0.06)]">
              <div className="text-3xl font-black text-primary">{stat.value}</div>
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.15em] text-[#594140]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>}

      {!configured && <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Who we are"
          title="A community-based organisation working for better HIV outcomes."
          description="HASH brings together prevention, testing, treatment linkage, community support, and advocacy to make care more accessible and more humane."
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {quickFacts.map((fact, index) => (
            <article
              key={fact.label}
              className="group relative isolate min-h-52 overflow-hidden rounded-3xl border border-[#f3dfe0] bg-white p-6 shadow-[0_12px_30px_rgba(174,39,54,0.04)] transition duration-200 hover:-translate-y-1 hover:border-[#e8b9be] hover:shadow-[0_20px_40px_rgba(174,39,54,0.10)]"
            >
              <div aria-hidden="true" className="absolute -right-7 -top-8 -z-10 h-28 w-28 rounded-full bg-[#fff0ef] transition duration-200 group-hover:scale-125" />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{fact.label}</p>
                <span aria-hidden="true" className="text-sm font-bold tracking-widest text-[#d9a3a8]">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="mt-7 text-2xl font-black leading-tight text-[#251818]">{fact.value}</h3>
              <p className="mt-3 text-sm leading-6 text-[#594140]">{fact.detail}</p>
              <div aria-hidden="true" className="absolute bottom-0 left-6 h-1 w-10 rounded-t-full bg-primary/70 transition-all duration-200 group-hover:w-16" />
            </article>
          ))}
        </div>
      </section>}

      <section className="relative isolate overflow-hidden bg-white py-16 sm:py-20">
        <div aria-hidden="true" className="absolute -right-40 top-12 -z-10 size-96 rounded-full bg-[#fce5e7]/45 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="What we offer"
            title="Services designed around access, trust, and dignity."
            description="From community screening to self-testing and case management, HASH’s programmes are built to meet people where they are."
            className="border-l-4 border-primary pl-5 sm:pl-7"
          />
          {configured && servicesError && <p className="mt-5 text-sm text-amber-900" role="status">{servicesError}</p>}
          {configured && publishedServices?.length === 0 && <p className="mt-8 text-[#594140]">There are no published services at this time.</p>}
          {configured && publishedServices === null && !servicesError ? (
            <CmsContentSkeleton count={4} gridClassName="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4" label="Loading services" />
          ) : <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {configured
              ? (publishedServices ?? []).map((service, index) => (
                  <article key={service.id} className="interactive-card group relative isolate flex h-full min-h-80 flex-col overflow-hidden rounded-[1.75rem] border border-[#f1d5d8] bg-white p-6 shadow-[0_14px_36px_rgba(74,22,27,0.05)] sm:p-7">
                    <div aria-hidden="true" className="absolute -right-8 -top-10 -z-10 size-32 rounded-full bg-[#fff0ef] transition duration-200 group-hover:scale-125" />
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center rounded-full bg-[#fce5e7] px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary">Our services</span>
                      <span aria-hidden="true" className="font-[League_Spartan] text-2xl font-bold text-[#e8c4c7]">{String(index + 1).padStart(2, '0')}</span>
                    </div>
                    <h3 className="mt-7 font-[League_Spartan] text-2xl font-bold leading-tight text-[#251818]">{service.title}</h3>
                    <p className="mt-4 flex-1 text-sm leading-7 text-[#594140]">{service.summary}</p>
                    <Link to={`/services/${service.slug}`} className="public-outline-link mt-7 w-fit gap-2">
                      Learn more <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                    </Link>
                    <div aria-hidden="true" className="absolute bottom-0 left-7 h-1 w-12 rounded-t-full bg-primary/70 transition-all duration-200 group-hover:w-20" />
                  </article>
                ))
              : serviceHighlights.map((service, index) => (
                  <article key={service.title} className="interactive-card group relative isolate flex h-full min-h-80 flex-col overflow-hidden rounded-[1.75rem] border border-[#f1d5d8] bg-white p-6 shadow-[0_14px_36px_rgba(74,22,27,0.05)] sm:p-7">
                    <div aria-hidden="true" className="absolute -right-8 -top-10 -z-10 size-32 rounded-full bg-[#fff0ef] transition duration-200 group-hover:scale-125" />
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center rounded-full bg-[#fce5e7] px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary">Our services</span>
                      <span aria-hidden="true" className="font-[League_Spartan] text-2xl font-bold text-[#e8c4c7]">{String(index + 1).padStart(2, '0')}</span>
                    </div>
                    <h3 className="mt-7 font-[League_Spartan] text-2xl font-bold leading-tight text-[#251818]">{service.title}</h3>
                    <p className="mt-4 flex-1 text-sm leading-7 text-[#594140]">{service.summary}</p>
                    <Link to={service.href} className="public-outline-link mt-7 w-fit gap-2">
                      Learn more <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                    </Link>
                    <div aria-hidden="true" className="absolute bottom-0 left-7 h-1 w-12 rounded-t-full bg-primary/70 transition-all duration-200 group-hover:w-20" />
                  </article>
                ))}
          </div>}
        </div>
      </section>

      {!configured && <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Why HASH"
          title="Evidence-informed, community-led, and deeply human."
          description="HASH combines grassroots trust with practical, organised care pathways to support communities affected by HIV and related health challenges."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <div className="interactive-card group rounded-3xl border border-[#f5dfe0] bg-[#fff8f7] p-7">
            <span aria-hidden="true" className="mb-5 block h-1.5 w-12 rounded-full bg-primary transition-all duration-200 group-hover:w-20" />
            <h3 className="text-2xl font-bold text-[#251818]">Prevention</h3>
            <p className="mt-4 text-sm leading-7 text-[#594140]">HASH promotes HIV prevention through community education, prevention programmes, screening, and access to PrEP and self-testing support.</p>
          </div>
          <div className="interactive-card group rounded-3xl border border-[#f5dfe0] bg-[#fff0ef] p-7">
            <span aria-hidden="true" className="mb-5 block h-1.5 w-12 rounded-full bg-primary transition-all duration-200 group-hover:w-20" />
            <h3 className="text-2xl font-bold text-[#251818]">Care</h3>
            <p className="mt-4 text-sm leading-7 text-[#594140]">The organisation links people to treatment and care, while building systems that help communities navigate support more confidently.</p>
          </div>
          <div className="interactive-card group rounded-3xl border border-[#eee3bf] bg-[#fbf6e8] p-7">
            <span aria-hidden="true" className="mb-5 block h-1.5 w-12 rounded-full bg-[#a57a24] transition-all duration-200 group-hover:w-20" />
            <h3 className="text-2xl font-bold text-[#251818]">Advocacy</h3>
            <p className="mt-4 text-sm leading-7 text-[#594140]">HASH works with partners, leaders, and communities to strengthen HIV awareness, policy, and accountability across settings.</p>
          </div>
        </div>
      </section>}
    </>
  )
}
