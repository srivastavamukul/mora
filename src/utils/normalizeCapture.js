/**
 * URL Capture and Normalization System
 * Reusable utilities for normalizing captured items from any source
 */

export function safeParseUrl(url) {
  if (!url || typeof url !== 'string') return null
  try {
    return new URL(url)
  } catch {
    return null
  }
}

export function inferPlatform(url) {
  const parsed = safeParseUrl(url)
  if (!parsed) return null

  const hostname = parsed.hostname.toLowerCase()

  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'youtube'
  if (hostname.includes('spotify.com')) return 'spotify'
  if (hostname.includes('instagram.com')) return 'instagram'
  if (hostname.includes('pinterest.com')) return 'pinterest'
  if (hostname.includes('x.com') || hostname.includes('twitter.com')) return 'x'
  if (hostname.includes('linkedin.com')) return 'linkedin'
  if (hostname.includes('medium.com')) return 'medium'

  return null
}

export function inferSource(url) {
  const platform = inferPlatform(url)
  if (platform) return platform

  const parsed = safeParseUrl(url)
  if (!parsed) return 'manual'

  const hostname = parsed.hostname.toLowerCase()
  const domain = hostname.replace(/^www\./, '').split('.')[0]

  return domain || 'manual'
}

export function inferType(source) {
  const typeMap = {
    youtube: 'video',
    spotify: 'song',
    instagram: 'post',
    pinterest: 'image',
    x: 'post',
    linkedin: 'post',
    medium: 'article',
  }

  return typeMap[source] || 'link'
}

export function inferTitle(url, source, userTitle) {
  if (userTitle && userTitle.trim()) {
    return userTitle.trim()
  }

  // Platform-specific fallbacks
  const titleMap = {
    youtube: 'YouTube Video',
    spotify: 'Spotify Track',
    instagram: 'Instagram Post',
    pinterest: 'Pinterest Pin',
    x: 'X Post',
    linkedin: 'LinkedIn Post',
    medium: 'Medium Article',
  }

  if (titleMap[source]) {
    return titleMap[source]
  }

  // Try to derive from URL slug
  const parsed = safeParseUrl(url)
  if (parsed) {
    const pathname = parsed.pathname
    if (pathname && pathname !== '/') {
      const lastSegment = pathname
        .split('/')
        .filter(Boolean)
        .pop()
        if (lastSegment) {
            // detect garbage/IDs
            if (/^[a-zA-Z0-9_-]{6,}$/.test(lastSegment)) {
              const titleMap = {
                youtube: 'YouTube Video',
                spotify: 'Spotify Track',
                instagram: 'Instagram Post',
                pinterest: 'Pinterest Pin',
                x: 'X Post',
                linkedin: 'LinkedIn Post',
                medium: 'Medium Article',
              }
              return titleMap[source] || 'Saved Link'
            }
          
            const derived = decodeURIComponent(lastSegment)
              .replace(/[-_]/g, ' ')
              .trim()
          
            if (derived.length > 0) return derived
          }
    }
  }

  // Final fallback
  return 'Saved Link'
}

export function normalizeTags(tagsInput) {
  if (!tagsInput || typeof tagsInput !== 'string') return []

  return tagsInput
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
    .filter((tag, index, arr) => arr.indexOf(tag) === index)
}

export function normalizeItem(formData, existingItem = null) {
  const isEditing = !!existingItem
  const now = Date.now()

  const source = formData.source?.trim() || inferSource(formData.url)
  const title = inferTitle(formData.url, source, formData.title)
  const type = existingItem
  ? existingItem.type
  : (formData.filterKey || inferType(source))
  const tags = normalizeTags(formData.tags)

  return {
    id: isEditing ? existingItem.id : String(now),
    title,
    url: formData.url || null,
    source: source || 'manual',
    type,
    tags,
    mood: formData.mood?.trim() || null,
    body: '',
    createdAt: isEditing ? existingItem.createdAt : now,
    updatedAt: isEditing ? now : null,
    externalId: null,
    metadata: {
        thumbnail: formData.imageUrl || null,
        platform: inferPlatform(formData.url) || 'unknown',
        hostname: safeParseUrl(formData.url)?.hostname || null,
        canonicalUrl: formData.url || null,
        captureMode: 'manual',
    },
    raw: {
      title: formData.title,
      source: formData.source,
      url: formData.url,
      tags: formData.tags,
      mood: formData.mood,
      imageUrl: formData.imageUrl,
    },
  }
}
