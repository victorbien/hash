type BrandSectionIntroProps = {
  eyebrow: string
  title: string
  description: string
}

export function BrandSectionIntro({ eyebrow, title, description }: BrandSectionIntroProps) {
  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#ae2736] px-7 py-9 text-white shadow-[0_28px_70px_rgba(174,39,54,0.20)] sm:px-10 sm:py-11 lg:px-14 lg:py-12">
      <div aria-hidden="true" className="absolute -right-20 -top-28 -z-10 size-80 rounded-full border-[36px] border-white/10" />
      <div aria-hidden="true" className="absolute -bottom-28 right-28 -z-10 size-56 rounded-full bg-[#d95d69]/40 blur-2xl" />
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#ffd9dc]">{eyebrow}</p>
        <h1 className="mt-4 font-[League_Spartan] text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-white/90 sm:text-lg sm:leading-8">{description}</p>
      </div>
    </section>
  )
}
