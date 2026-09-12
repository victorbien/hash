import { SectionHeading } from '../components/ui/SectionHeading'

export function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="About HASH"
        title="A community-powered response to HIV and care access."
        description="HASH is a Philippine community-based organisation established in 2015 by advocates committed to improving access to HIV prevention, treatment, care, and support services."
      />

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <article className="rounded-3xl bg-white p-8 shadow-[0_12px_30px_rgba(174,39,54,0.04)]">
          <h3 className="text-3xl font-bold text-[#251818]">Mission</h3>
          <p className="mt-5 text-base leading-8 text-[#594140]">
            HASH works to ensure that people affected by HIV have access to quality, stigma-free, community-centered services. The organisation focuses on prevention, testing, treatment linkage, PrEP, HIV self-testing, youth engagement, workplace HIV policies, harm reduction, community-led monitoring, digital health, and advocacy.
          </p>
        </article>

        <article className="rounded-3xl bg-[#fff0ef] p-8 shadow-[0_12px_30px_rgba(174,39,54,0.04)]">
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
            <div key={item} className="flex gap-4 rounded-2xl border border-[#f3dfe0] bg-white p-5">
              <div className="mt-1 h-3 w-3 rounded-full bg-primary" />
              <p className="text-base leading-7 text-[#594140]">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
