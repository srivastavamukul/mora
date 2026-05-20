// Shared URL parsing and platform inference for mobile utils

export function safeParseUrl(url) {
  if (!url || typeof url !== 'string') return null
  try { return new URL(url) } catch { return null }
}

export function inferPlatform(url) {
  const parsed = safeParseUrl(url)
  if (!parsed) return null
  const h = parsed.hostname.toLowerCase()
  if (h.includes('youtube.com') || h.includes('youtu.be')) return 'youtube'
  if (h.includes('spotify.com')) return 'spotify'
  if (h.includes('instagram.com')) return 'instagram'
  if (h.includes('pinterest.com') || h.includes('pin.it')) return 'pinterest'
  if (h.includes('x.com') || h.includes('twitter.com')) return 'x'
  if (h.includes('linkedin.com')) return 'linkedin'
  if (h.includes('medium.com')) return 'medium'
  return null
}

export function inferSource(url, explicitSource) {
  if (explicitSource && explicitSource !== 'web') return explicitSource
  const platform = inferPlatform(url)
  if (platform) return platform
  const parsed = safeParseUrl(url)
  if (!parsed) return 'manual'
  const domain = parsed.hostname.toLowerCase().replace(/^www\./, '').split('.')[0]
  return domain || 'manual'
}

export function inferType(source) {
  const map = {
    youtube: 'video',
    spotify: 'song',
    instagram: 'post',
    pinterest: 'image',
    x: 'post',
    linkedin: 'post',
    medium: 'article',
  }
  return map[source] || 'link'
}

export function isValidThumbnailUrl(url) {
  if (!url || typeof url !== 'string') return false
  return url.startsWith('http://') || url.startsWith('https://')
}
