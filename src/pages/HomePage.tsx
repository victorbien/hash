import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { SectionHeading } from '../components/ui/SectionHeading'
import { quickFacts, serviceHighlights, stats } from '../data/siteContent'

export function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_top_left,_rgba(174,39,54,0.13),_transparent_50%)]" />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center">
            <span className="mb-5 inline-flex w-fit rounded-full bg-[#fce5e7] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Community first
            </span>
            <h1 className="max-w-xl text-5xl font-black tracking-tight text-[#251818] md:text-6xl">
              Compassionate HIV support rooted in community care.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#594140]">
              HASH works to make HIV prevention, testing, treatment linkage, and support more accessible, stigma-free, and human-centered for people across the Philippines.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button as="a" href="/about">Learn About HASH</Button>
              <Button as="a" href="/services" variant="secondary">Explore Services</Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-[#f8dfe1] blur-3xl" />
            <img
              src="/assets/images/mainpage/hero-hash.jpg"
              alt="HASH volunteers and community members in a supportive outreach setting"
              className="relative h-[520px] w-full rounded-[2rem] object-cover shadow-[0_35px_80px_rgba(174,39,54,0.18)]"
            />
            <div className="absolute bottom-6 left-6 max-w-xs rounded-2xl border border-white/60 bg-white/85 p-4 shadow-lg backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Trusted care</p>
              <p className="mt-2 text-sm leading-6 text-[#594140]">
                “People deserve access to HIV care that is respectful, practical, and stigma-free.”
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fff0ef] py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-2 md:grid-cols-4 sm:px-6 lg:px-8">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white p-6 text-center shadow-[0_18px_40px_rgba(174,39,54,0.06)]">
              <div className="text-3xl font-black text-primary">{stat.value}</div>
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.15em] text-[#594140]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Who we are"
          title="A community-based organisation working for better HIV outcomes."
          description="HASH brings together prevention, testing, treatment linkage, community support, and advocacy to make care more accessible and more humane."
        />

        <div className="mt-10 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {quickFacts.map((fact) => (
            <article key={fact.label} className="rounded-3xl border border-[#f3dfe0] bg-white p-6 shadow-[0_12px_30px_rgba(174,39,54,0.03)]">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{fact.label}</p>
              <h3 className="mt-4 text-2xl font-black text-[#251818]">{fact.value}</h3>
              <p className="mt-3 text-sm leading-6 text-[#594140]">{fact.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="What we offer"
            title="Services designed around access, trust, and dignity."
            description="From community screening to self-testing and case management, HASH’s programmes are built to meet people where they are."
          />

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {serviceHighlights.map((service) => (
              <article key={service.title} className="flex h-full flex-col rounded-3xl border border-[#f3dfe0] bg-[#fff8f7] p-6 shadow-[0_12px_30px_rgba(174,39,54,0.02)]">
                <div className="mb-5 h-12 w-12 rounded-2xl bg-[#fce5e7] text-xl font-black text-primary flex items-center justify-center">♥</div>
                <h3 className="text-2xl font-bold text-[#251818]">{service.title}</h3>
                <p className="mt-4 flex-1 text-sm leading-7 text-[#594140]">{service.summary}</p>
                <Link to={service.href} className="mt-6 text-sm font-semibold text-primary hover:text-[#8b1d2e]">
                  Learn more →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Why HASH"
          title="Evidence-informed, community-led, and deeply human."
          description="HASH combines grassroots trust with practical, organised care pathways to support communities affected by HIV and related health challenges."
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          <div className="rounded-3xl bg-[#fff0ef] p-6">
            <h3 className="text-2xl font-bold text-[#251818]">Prevention</h3>
            <p className="mt-4 text-sm leading-7 text-[#594140]">HASH promotes HIV prevention through community education, prevention programmes, screening, and access to PrEP and self-testing support.</p>
          </div>
          <div className="rounded-3xl bg-[#fce5e7] p-6">
            <h3 className="text-2xl font-bold text-[#251818]">Care</h3>
            <p className="mt-4 text-sm leading-7 text-[#594140]">The organisation links people to treatment and care, while building systems that help communities navigate support more confidently.</p>
          </div>
          <div className="rounded-3xl bg-[#f4e7bb] p-6">
            <h3 className="text-2xl font-bold text-[#251818]">Advocacy</h3>
            <p className="mt-4 text-sm leading-7 text-[#594140]">HASH works with partners, leaders, and communities to strengthen HIV awareness, policy, and accountability across settings.</p>
          </div>
        </div>
      </section>
    </>
  )
}
