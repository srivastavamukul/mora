// Extract structured metadata from an Instagram share input (no API calls)

function safeParseUrl(url) {
  if (!url || typeof url !== 'string') return null
  try { return new URL(url) } catch { return null }
}

function inferCreatorFromUrl(parsed) {
  if (!parsed) return null
  const parts = parsed.pathname.split('/').filter(Boolean)
  // instagram.com/username/... or instagram.com/p/shortcode/
  if (parts[0] && parts[0] !== 'p' && parts[0] !== 'reel' && parts[0] !== 'stories') {
    return parts[0]
  }
  if (parts[0] === 'reel' && parts.length === 1) return null
  return null
}

function inferTypeFromUrl(parsed) {
  if (!parsed) return 'post'
  const p = parsed.pathname
  if (p.includes('/reel/')) return 'reel'
  if (p.includes('/stories/')) return 'story'
  return 'post'
}

/**
 * extractInstagramShare({ url, text, title, source })
 * Returns Instagram-specific metadata. Deterministic, no API calls.
 */
export function extractInstagramShare(input = {}) {
  const { url, text, title } = input
  const parsed = safeParseUrl(url)

  return {
    source: 'instagram',
    type: inferTypeFromUrl(parsed),
    url: url || null,
    title: title?.trim() || (text ? text.slice(0, 80).trim() : null) || 'Instagram Post',
    thumbnail: null,
    creator: inferCreatorFromUrl(parsed),
  }
}
