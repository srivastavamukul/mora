import { buildDisplayMemory } from './buildDisplayMemory'

const SOURCE_LABELS = {
  youtube: 'YouTube',
  spotify: 'Spotify',
  instagram: 'Instagram',
  pinterest: 'Pinterest',
  x: 'X',
  twitter: 'X',
  linkedin: 'LinkedIn',
  medium: 'Medium',
  reddit: 'Reddit',
  substack: 'Substack',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  vimeo: 'Vimeo',
  soundcloud: 'SoundCloud',
  bandcamp: 'Bandcamp',
  behance: 'Behance',
  dribbble: 'Dribbble',
  wikipedia: 'Wikipedia',
  github: 'GitHub',
  web: 'Web',
  manual: 'Web',
}

const SOURCE_TO_CAPTURE_TYPE = {
  youtube: 'video',
  vimeo: 'video',
  spotify: 'audio',
  soundcloud: 'audio',
  bandcamp: 'audio',
  instagram: 'image',
  pinterest: 'image',
  behance: 'image',
  dribbble: 'image',
  medium: 'article',
  substack: 'article',
  wikipedia: 'article',
  reddit: 'post',
  x: 'post',
  twitter: 'post',
  linkedin: 'post',
  facebook: 'post',
  tiktok: 'video',
  github: 'repo',
}

// Media packaging noise not covered by buildDisplayMemory site-suffix strip
const TITLE_MEDIA_NOISE = /\s*[\[(](Official\s+(?:Video|Music\s+Video|Audio|Lyric\s+Video)|Full\s+(?:Movie|Film|Video|Episode)|HD|4K|720p|1080p|MV)[\])](\s*[\[(][^\])\s]+[\])])*\s*$/gi

function normalizeSource(raw) {
  if (!raw || typeof raw !== 'string') return 'Web'
  const key = raw.toLowerCase().trim()
  if (SOURCE_LABELS[key]) return SOURCE_LABELS[key]
  if (!key || key === 'web' || key === 'manual') return 'Web'
  return key.charAt(0).toUpperCase() + key.slice(1)
}

function stripTitleMediaNoise(title) {
  if (!title) return title
  let t = title
  let prev
  do {
    prev = t
    t = t.replace(TITLE_MEDIA_NOISE, '').trim()
  } while (t !== prev)
  return t || title
}

function stripDescriptionNoise(desc) {
  if (!desc) return ''
  return String(desc)
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function inferCaptureType(item) {
  const type = (item.type || item.filterKey || '').toLowerCase()
  if (type === 'note' || type === 'journal') return 'note'
  if (type === 'video') return 'video'
  if (type === 'song' || type === 'audio') return 'audio'
  if (type === 'image') return 'image'
  if (type === 'article') return 'article'
  if (type === 'post') return 'post'
  if (type === 'repo') return 'repo'
  if (type === 'link') {
    const src = (item.source || item.metadata?.source || '').toLowerCase()
    return SOURCE_TO_CAPTURE_TYPE[src] || 'link'
  }
  const src = (item.source || item.metadata?.source || '').toLowerCase()
  return SOURCE_TO_CAPTURE_TYPE[src] || 'link'
}

function estimatedReadTime(item) {
  const text = [item.body, item.description].filter(Boolean).join(' ')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  if (words < 50) return null
  return Math.max(1, Math.round(words / 200))
}

function measureContentLength(item) {
  return [item.title, item.description, item.body]
    .filter(Boolean)
    .join(' ')
    .length
}

export function enrichMemoryMetadata(item) {
  if (!item) {
    return {
      displayTitle: 'Saved Memory',
      displayDescription: '',
      sourceLabel: 'Web',
      captureType: 'link',
      estimatedReadTime: null,
      contentLength: 0,
    }
  }

  const base = buildDisplayMemory(item)

  const displayTitle = stripTitleMediaNoise(base.displayTitle) || 'Saved Memory'
  const displayDescription = stripDescriptionNoise(base.displayDescription)

  const rawSource = item.source || item.metadata?.source || ''
  const sourceLabel = normalizeSource(rawSource)
  const captureType = inferCaptureType(item)

  return {
    displayTitle,
    displayDescription,
    sourceLabel,
    captureType,
    estimatedReadTime: estimatedReadTime(item),
    contentLength: measureContentLength(item),
  }
}
