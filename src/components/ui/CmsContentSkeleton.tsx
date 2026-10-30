type CmsContentSkeletonProps = {
  label: string
  count?: number
  gridClassName?: string
  showImage?: boolean
}

export function CmsContentSkeleton({
  label,
  count = 3,
  gridClassName = 'grid gap-6 md:grid-cols-3',
  showImage = false,
}: CmsContentSkeletonProps) {
  return (
    <div aria-label={label} aria-live="polite" className={gridClassName} role="status">
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }, (_, index) => (
        <div
          aria-hidden="true"
          className="animate-pulse rounded-3xl border border-[#f3dfe0] bg-white p-7 shadow-[0_12px_30px_rgba(174,39,54,0.03)]"
          key={index}
        >
          <div className="h-3 w-24 rounded-full bg-[#fce5e7]" />
          <div className="mt-5 h-7 w-3/4 rounded-lg bg-[#f5e8e8]" />
          {showImage && <div className="mt-5 h-40 rounded-2xl bg-[#fff0ef]" />}
          <div className="mt-5 h-3 w-full rounded-full bg-[#f5e8e8]" />
          <div className="mt-2 h-3 w-5/6 rounded-full bg-[#f5e8e8]" />
          <div className="mt-6 h-5 w-28 rounded-full bg-[#fce5e7]" />
        </div>
      ))}
    </div>
  )
}
