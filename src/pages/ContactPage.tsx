import { Button } from '../components/ui/Button'
import { SectionHeading } from '../components/ui/SectionHeading'

export function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Contact"
        title="Connect with HASH."
        description="Whether you are seeking support, learning about programmes, or exploring a partnership, HASH is available to connect and guide you to the right pathway."
      />

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <form className="rounded-3xl border border-[#f3dfe0] bg-white p-8 shadow-[0_12px_30px_rgba(174,39,54,0.03)]">
          <div className="grid gap-6 md:grid-cols-2">
            <label className="block text-sm font-semibold text-[#251818]">
              Name
              <input type="text" className="mt-2 w-full rounded-xl border border-[#f1dfe1] bg-[#fff8f7] p-3 outline-none ring-0 focus:border-primary" placeholder="Your name" />
            </label>
            <label className="block text-sm font-semibold text-[#251818]">
              Email
              <input type="email" className="mt-2 w-full rounded-xl border border-[#f1dfe1] bg-[#fff8f7] p-3 outline-none ring-0 focus:border-primary" placeholder="you@example.com" />
            </label>
          </div>

          <label className="mt-6 block text-sm font-semibold text-[#251818]">
            Inquiry
            <textarea className="mt-2 min-h-32 w-full rounded-xl border border-[#f1dfe1] bg-[#fff8f7] p-3 outline-none ring-0 focus:border-primary" placeholder="Tell us how we can help" />
          </label>

          <div className="mt-6">
            <Button type="submit" onClick={() => undefined}>Send message</Button>
          </div>
        </form>

        <aside className="rounded-3xl bg-[#fff0ef] p-8">
          <h3 className="text-2xl font-bold text-[#251818]">Need immediate support?</h3>
          <ul className="mt-6 space-y-4 text-base leading-7 text-[#594140]">
            <li><strong>Phone:</strong> Please use HASH’s official contact details as listed in organisational materials.</li>
            <li><strong>Email:</strong> Use the organisation’s verified contact channels for support and programme enquiries.</li>
            <li><strong>Location:</strong> HASH works across the Philippines through community-based programmes and partnerships.</li>
          </ul>
        </aside>
      </div>
    </div>
  )
}
