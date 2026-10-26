import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BrandSectionIntro } from '../components/ui/BrandSectionIntro'
import { CmsContentSkeleton } from '../components/ui/CmsContentSkeleton'
import { CmsSeoMeta } from '../components/ui/CmsSeoMeta'
import { getCmsMediaUrl, isCmsConfigured } from '../cms/content'
import type { CmsContentType } from '../cms/content'
import { usePublishedCmsContent } from '../cms/useCmsContent'
import { NotFoundPage } from './NotFoundPage'

export function PublicCmsDetailPage({ contentType }: { contentType: Extract<CmsContentType, 'service' | 'resource'> }) {
  const { slug } = useParams()
  const { content, error } = usePublishedCmsContent(contentType)
  const item = content?.find((entry) => entry.slug === slug)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [mediaError, setMediaError] = useState(false)
  const isDocument = Boolean(item?.image_path?.toLowerCase().endsWith('.pdf'))

  useEffect(() => {
    if (!item?.image_path) return
    let active = true
    void getCmsMediaUrl(item.image_path)
      .then((url) => { if (active) setMediaUrl(url) })
      .catch(() => { if (active) setMediaError(true) })
    return () => { active = false }
  }, [item?.image_path])

  if (content === null) {
    if (!isCmsConfigured()) return <NotFoundPage />
    if (error) return <p className="px-4 py-16 text-center text-amber-900" role="alert">{error}</p>
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <CmsContentSkeleton count={1} gridClassName="mx-auto max-w-4xl" label="Loading content" />
      </div>
    )
  }
  if (!item) {
    return <NotFoundPage />
  }

  return (
    <article className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <CmsSeoMeta title={item.seo_title || `${item.title} | HASH`} description={item.meta_description || item.summary} />
      <Link className="public-text-link" to={`/${contentType === 'service' ? 'services' : 'resources'}`}>← All {contentType === 'service' ? 'services' : 'resources'}</Link>
      {error && <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900" role="status">{error}</p>}
      <div className="mt-6">
        <BrandSectionIntro
          eyebrow={item.category || (contentType === 'service' ? 'Service' : 'Resource')}
          title={item.title}
          description={item.summary}
        />
      </div>
      <div className="mx-auto max-w-4xl">
      {item.image_path && !isDocument && mediaUrl && (
        <img className="mt-8 max-h-[32rem] w-full rounded-3xl object-cover" src={mediaUrl} alt={item.image_alt ?? ''} />
      )}
      {item.body && <p className="mt-8 whitespace-pre-line text-base leading-8 text-[#594140]">{item.body}</p>}
      {item.image_path && isDocument && mediaUrl && (
        <a className="action-button mt-8 inline-flex rounded-full bg-primary px-6 py-3 font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" href={mediaUrl} rel="noreferrer" target="_blank">
          {item.image_alt || `Open ${item.title}`}
        </a>
      )}
      {mediaError && <p className="mt-6 text-sm text-amber-900" role="status">The attached file could not be opened. Please contact HASH for assistance.</p>}
      </div>
    </article>
  )
}
