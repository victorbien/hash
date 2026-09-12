import { Button } from '../components/ui/Button'
import { SectionHeading } from '../components/ui/SectionHeading'

export function GetInvolvedPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Get involved"
        title="Support a more inclusive HIV response."
        description="HASH works with volunteers, partners, advocates, and communities to strengthen prevention, education, and support pathways."
      />

      <div className="mt-10 grid gap-8 md:grid-cols-3">
        {[
          {
            title: 'Volunteer',
            text: 'Contribute time, energy, and community support through outreach, education, and service delivery.',
          },
          {
            title: 'Partner',
            text: 'Collaborate on programmes, research, awareness, and local response initiatives.',
          },
          {
            title: 'Support',
            text: 'Help expand programmes that improve access to prevention, testing, and community case management.',
          },
        ].map((item) => (
          <div key={item.title} className="rounded-3xl border border-[#f3dfe0] bg-white p-7 shadow-[0_12px_30px_rgba(174,39,54,0.03)]">
            <h3 className="text-2xl font-bold text-[#251818]">{item.title}</h3>
            <p className="mt-4 text-base leading-8 text-[#594140]">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-3xl bg-[#fff0ef] p-8 text-center">
        <h3 className="text-3xl font-bold text-[#251818]">Ready to connect?</h3>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-[#594140]">
          Reach out to HASH to learn more about programmes, partnerships, or ways to support the organisation’s work.
        </p>
        <div className="mt-6 flex justify-center">
          <Button as="a" href="/contact">Contact HASH</Button>
        </div>
      </div>
    </div>
  )
}
