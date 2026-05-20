import { safeParseUrl } from './urlUtils.js'

const RESERVED_SEGMENTS = new Set(['p', 'reel', 'reels', 'stories', 'explore', 'tv'])

function inferTypeFromUrl(parsed) {
  if (!parsed) return 'post'
  const p = parsed.pathname
  if (p.includes('/reel/') || p.includes('/reels/') || p.includes('/tv/')) return 'reel'
  if (p.includes('/stories/')) return 'story'
  const parts = p.split('/').filter(Boolean)
  if (parts.length === 1 && !RESERVED_SEGMENTS.has(parts[0])) return 'profile'
  return 'post'
}

function inferCreatorFromUrl(parsed) {
  if (!parsed) return null
  const parts = parsed.pathname.split('/').filter(Boolean)
  if (parts[0] && !RESERVED_SEGMENTS.has(parts[0])) return parts[0]
  return null
}

function deriveTitleFromCaption(text, url) {
  if (!text || typeof text !== 'string') return null
  const clean = url ? text.replace(url, '').trim() : text.trim()
  if (!clean) return null
  const firstLine = clean.split('\n').find(l => l.trim().length > 0)
  if (!firstLine) return null
  const trimmed = firstLine.trim()
  const sentenceEnd = trimmed.search(/[.!?](\s|$)/)
  const sentence = sentenceEnd > 0 ? trimmed.slice(0, sentenceEnd + 1) : trimmed
  return sentence.slice(0, 120) || null
}

export function extractInstagramShare(input = {}) {
  const { url, text, title, thumbnail } = input
  const parsed = safeParseUrl(url)
  const type = inferTypeFromUrl(parsed)
  const creator = inferCreatorFromUrl(parsed)

  const profileTitle = type === 'profile' && creator ? `@${creator}` : null
  const resolvedTitle = title?.trim() || profileTitle || deriveTitleFromCaption(text, url) || null

  const result = {
    source: 'instagram',
    type,
    url: url || null,
    title: resolvedTitle,
    description: text?.trim() || null,
    creator,
  }
  // Only include thumbnail if present — avoid overwriting payload thumbnail with null
  if (thumbnail) result.thumbnail = thumbnail
  return result
}
