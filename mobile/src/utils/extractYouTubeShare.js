import { safeParseUrl } from './urlUtils.js'

function extractVideoId(parsed) {
  if (!parsed) return null
  const h = parsed.hostname.toLowerCase()
  if (h.includes('youtu.be')) {
    return parsed.pathname.split('/').filter(Boolean)[0] || null
  }
  return parsed.searchParams.get('v') || null
}

export function extractYouTubeShare(input = {}) {
  const { url, text, title } = input
  const parsed = safeParseUrl(url)
  const videoId = extractVideoId(parsed)
  return {
    source: 'youtube',
    type: 'video',
    url: url || null,
    title: title?.trim() || (text ? text.slice(0, 80).trim() : null) || null,
    thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null,
    channel: null,
  }
}
