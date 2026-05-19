// Mobile share input → Mora item shape (mirrors normalizeCapture.js schema)

const STOPWORDS = new Set([
  'the','and','for','with','this','that','from','you','your','are','was',
  'its','has','had','not','but','they','will','can','all','more','have',
  'been','what','how','when','who','which','into','about','than','also',
])

function safeParseUrl(url) {
  if (!url || typeof url !== 'string') return null
  try { return new URL(url) } catch { return null }
}

function inferPlatform(url) {
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

function inferSource(url, explicitSource) {
  if (explicitSource && explicitSource !== 'web') return explicitSource
  const platform = inferPlatform(url)
  if (platform) return platform
  const parsed = safeParseUrl(url)
  if (!parsed) return 'manual'
  const domain = parsed.hostname.toLowerCase().replace(/^www\./, '').split('.')[0]
  return domain || 'manual'
}

function inferType(source) {
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

function extractTags(text) {
  if (!text || typeof text !== 'string') return []
  return [...new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !STOPWORDS.has(w))
  )].slice(0, 5)
}

/**
 * normalizeMobileCapture({ url, text, title, source })
 * Returns a Mora item shape ready for storage.
 */
export function normalizeMobileCapture(input = {}) {
  const { url, text, title, source: explicitSource } = input
  const now = Date.now()

  const source = inferSource(url, explicitSource)
  const type = inferType(source)
  const parsed = safeParseUrl(url)

  const resolvedTitle =
    title?.trim() ||
    (text ? text.slice(0, 80).trim() : null) ||
    'Saved Link'

  const tags = extractTags([title, text].filter(Boolean).join(' '))

  return {
    id: String(now),
    title: resolvedTitle,
    url: url || null,
    source,
    type,
    thumbnail: '',
    description: text || '',
    tags,
    mood: null,
    body: '',
    createdAt: now,
    updatedAt: null,
    externalId: null,
    memoryDate: null,
    memoryType: null,
    privateNote: null,
    schemaVersion: 1,
    metadata: {
      thumbnail: null,
      description: text || '',
      source,
      type,
      platform: inferPlatform(url),
      hostname: parsed?.hostname || null,
      canonicalUrl: url || null,
      origin: 'mobile-share',
      capturedAt: now,
    },
    raw: { ...input },
  }
}
