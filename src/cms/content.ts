import { supabase } from '../lib/supabase'

export const cmsContentTypes = ['about', 'service', 'resource', 'volunteer', 'home'] as const
export type CmsContentType = (typeof cmsContentTypes)[number]
export type CmsContentStatus = 'draft' | 'published' | 'archived'

export type CmsContent = {
  id: string
  content_type: CmsContentType
  title: string
  slug: string
  summary: string
  body: string
  category: string | null
  status: CmsContentStatus
  featured: boolean
  display_order: number
  image_path: string | null
  image_alt: string | null
  seo_title: string | null
  meta_description: string | null
  created_at: string
  updated_at: string
  published_at: string | null
}

export type CmsContentInput = Pick<
  CmsContent,
  | 'content_type'
  | 'title'
  | 'slug'
  | 'summary'
  | 'body'
  | 'category'
  | 'status'
  | 'featured'
  | 'display_order'
  | 'image_path'
  | 'image_alt'
  | 'seo_title'
  | 'meta_description'
>

const contentColumns = [
  'id',
  'content_type',
  'title',
  'slug',
  'summary',
  'body',
  'category',
  'status',
  'featured',
  'display_order',
  'image_path',
  'image_alt',
  'seo_title',
  'meta_description',
  'created_at',
  'updated_at',
  'published_at',
].join(', ')

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isCmsContent(value: unknown): value is CmsContent {
  if (!isRecord(value)) return false
  return typeof value.id === 'string'
    && cmsContentTypes.some((type) => type === value.content_type)
    && typeof value.title === 'string'
    && typeof value.slug === 'string'
    && typeof value.summary === 'string'
    && typeof value.body === 'string'
    && (typeof value.category === 'string' || value.category === null)
    && (value.status === 'draft' || value.status === 'published' || value.status === 'archived')
    && typeof value.featured === 'boolean'
    && typeof value.display_order === 'number'
    && (typeof value.image_path === 'string' || value.image_path === null)
    && (typeof value.image_alt === 'string' || value.image_alt === null)
    && (typeof value.seo_title === 'string' || value.seo_title === null)
    && (typeof value.meta_description === 'string' || value.meta_description === null)
    && typeof value.created_at === 'string'
    && typeof value.updated_at === 'string'
    && (typeof value.published_at === 'string' || value.published_at === null)
}

function parseCmsContentList(value: unknown): CmsContent[] {
  if (!Array.isArray(value) || !value.every(isCmsContent)) {
    throw new Error('CMS returned content with an unexpected shape.')
  }
  return value
}

function parseCmsContent(value: unknown): CmsContent {
  if (!isCmsContent(value)) throw new Error('CMS returned content with an unexpected shape.')
  return value
}

function requireSupabase() {
  if (!supabase) throw new Error('CMS is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  return supabase
}

export function isCmsConfigured() {
  return Boolean(supabase)
}

export async function getPublicCmsContent(contentType: CmsContentType) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('cms_content')
    .select(contentColumns)
    .eq('content_type', contentType)
    .eq('status', 'published')
    .order('display_order', { ascending: true })
    .order('updated_at', { ascending: false })

  if (error) throw error
  return parseCmsContentList(data)
}

export async function listCmsContent() {
  const client = requireSupabase()
  const { data, error } = await client
    .from('cms_content')
    .select(contentColumns)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return parseCmsContentList(data)
}

export async function getCmsContentById(id: string) {
  const client = requireSupabase()
  const { data, error } = await client
    .from('cms_content')
    .select(contentColumns)
    .eq('id', id)
    .single()

  if (error) throw error
  return parseCmsContent(data)
}

export async function saveCmsContent(input: CmsContentInput, id?: string) {
  const client = requireSupabase()
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser()

  if (userError) throw userError
  if (!user) throw new Error('Sign in with an authorised HASH staff account to save content.')

  const now = new Date().toISOString()
  const record = {
    ...input,
    updated_by: user.id,
    updated_at: now,
    published_at: input.status === 'published' ? now : null,
    archived_at: input.status === 'archived' ? now : null,
  }
  const query = id
    ? client.from('cms_content').update(record).eq('id', id)
    : client.from('cms_content').insert({ ...record, created_by: user.id })
  const { data, error } = await query.select(contentColumns).single()

  if (error) throw error
  return parseCmsContent(data)
}

export async function uploadCmsMedia(file: File) {
  const client = requireSupabase()
  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
  if (!allowedTypes.has(file.type)) {
    throw new Error('Choose a JPEG, PNG, WebP, or PDF file.')
  }
  if (file.size === 0 || file.size > 10 * 1024 * 1024) {
    throw new Error('Choose a file smaller than 10 MB.')
  }

  const fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `uploads/${crypto.randomUUID()}-${fileName}`
  const { error } = await client.storage.from('cms-media').upload(path, file, {
    contentType: file.type,
    upsert: false,
  })

  if (error) throw error
  return path
}

export async function getCmsMediaUrl(path: string) {
  const client = requireSupabase()
  const { data, error } = await client.storage.from('cms-media').createSignedUrl(path, 60 * 30)
  if (error) throw error
  return data.signedUrl
}
