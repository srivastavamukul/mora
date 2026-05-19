// Extract structured metadata from a YouTube share input (no API calls)

function safeParseUrl(url) {
  if (!url || typeof url !== 'string') return null
  try { return new URL(url) } catch { return null }
}

function extractVideoId(parsed) {
  if (!parsed) return null
  const h = parsed.hostname.toLowerCase()
  if (h.includes('youtu.be')) {
    return parsed.pathname.split('/').filter(Boolean)[0] || null
  }
  return parsed.searchParams.get('v') || null
}

function inferThumbnail(videoId) {
  if (!videoId) return null
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

/**
 * extractYouTubeShare({ url, text, title, source })
 * Returns YouTube-specific metadata. Deterministic, no API calls.
 * Thumbnail URL is a predictable YouTube CDN pattern (no auth required).
 */
export function extractYouTubeShare(input = {}) {
  const { url, text, title } = input
  const parsed = safeParseUrl(url)
  const videoId = extractVideoId(parsed)

  return {
    source: 'youtube',
    type: 'video',
    url: url || null,
    title: title?.trim() || (text ? text.slice(0, 80).trim() : null) || 'YouTube Video',
    thumbnail: inferThumbnail(videoId),
    channel: null,
  }
}
