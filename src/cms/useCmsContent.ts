import { useEffect, useState } from 'react'
import { getPublicCmsContent, isCmsConfigured } from './content'
import type { CmsContent, CmsContentType } from './content'

export function usePublishedCmsContent(contentType: CmsContentType) {
  const [content, setContent] = useState<CmsContent[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void getPublicCmsContent(contentType)
      .then((items) => { if (active) setContent(items) })
      .catch(() => { if (active) setError('Published content could not be refreshed. The content shown below may not be current.') })
    return () => { active = false }
  }, [contentType])

  return { content, error, configured: isCmsConfigured() }
}
