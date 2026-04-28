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
  if (Array.isArray(tagsInput)) {
    return tagsInput
      .map(t => String(t).trim())
      .filter(Boolean)
      .filter((t, i, a) => a.indexOf(t) === i)
  }
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
    : (formData.type || formData.filterKey || inferType(source))
  const tags = normalizeTags(formData.tags)

  return {
    id: isEditing ? existingItem.id : String(now),
    title,
    url: formData.url || null,
    source: source || 'web',
    type,
    thumbnail: formData.thumbnail || existingItem?.thumbnail || "",
    description: formData.description || existingItem?.description || "",
    tags,
    mood: formData.mood?.trim() || null,
    body: formData.body || (isEditing ? existingItem.body : '') || '',
    createdAt: isEditing ? existingItem.createdAt : now,
    updatedAt: isEditing ? now : null,
    externalId: formData.externalId ?? null,
    schemaVersion: existingItem?.schemaVersion || 1,
    metadata: {
      ...(existingItem?.metadata || {}),
      thumbnail: formData.thumbnail || formData.imageUrl || formData.metadata?.thumbnail || existingItem?.metadata?.thumbnail || null,
      description: formData.description || existingItem?.metadata?.description || "",
      source: source || existingItem?.metadata?.source || "",
      type: type || existingItem?.metadata?.type || "",
      platform: inferPlatform(formData.url) || existingItem?.metadata?.platform || null,
      hostname: safeParseUrl(formData.url)?.hostname || existingItem?.metadata?.hostname || null,
      canonicalUrl: formData.url || existingItem?.metadata?.canonicalUrl || null,
      origin: formData.origin || existingItem?.metadata?.origin || 'manual',
      capturedAt: isEditing ? existingItem.metadata?.capturedAt : now,
    },
    raw: isEditing ? (existingItem?.raw || {}) : (formData.raw || {}),
  }
}
