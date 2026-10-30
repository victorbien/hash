import { useEffect, useState } from 'react'
import { getCmsMediaUrl } from '../../cms/content'

export function CmsMediaImage({ path, alt, className }: { path: string | null; alt: string | null; className?: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!path || path.toLowerCase().endsWith('.pdf')) return
    let active = true
    void getCmsMediaUrl(path)
      .then((signedUrl) => { if (active) setUrl(signedUrl) })
      .catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [path])

  if (!path || path.toLowerCase().endsWith('.pdf')) return null
  if (error) return <p className="text-sm text-amber-900" role="status">This image could not be loaded.</p>
  if (!url) return <span className="sr-only" role="status">Loading image…</span>
  return <img alt={alt ?? ''} className={className} src={url} />
}
