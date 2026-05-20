import { safeParseUrl } from './urlUtils.js'

function inferCreatorFromUrl(parsed) {
  if (!parsed) return null
  const parts = parsed.pathname.split('/').filter(Boolean)
  if (parts[0] && parts[0] !== 'p' && parts[0] !== 'reel' && parts[0] !== 'stories') {
    return parts[0]
  }
  return null
}

function inferTypeFromUrl(parsed) {
  if (!parsed) return 'post'
  const p = parsed.pathname
  if (p.includes('/reel/')) return 'reel'
  if (p.includes('/stories/')) return 'story'
  return 'post'
}

export function extractInstagramShare(input = {}) {
  const { url, text, title } = input
  const parsed = safeParseUrl(url)
  return {
    source: 'instagram',
    type: inferTypeFromUrl(parsed),
    url: url || null,
    title: title?.trim() || (text ? text.slice(0, 80).trim() : null) || null,
    thumbnail: null,
    creator: inferCreatorFromUrl(parsed),
  }
}
