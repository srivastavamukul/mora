import { safeParseUrl, inferPlatform, inferSource, inferType, isValidThumbnailUrl } from './urlUtils.js'

const STOPWORDS = new Set([
  'the','and','for','with','this','that','from','you','your','are','was',
  'its','has','had','not','but','they','will','can','all','more','have',
  'been','what','how','when','who','which','into','about','than','also',
])

const PLATFORM_TITLE_FALLBACKS = {
  youtube: 'YouTube Video',
  spotify: 'Spotify Track',
  instagram: 'Instagram Post',
  pinterest: 'Pinterest Pin',
  x: 'X Post',
  linkedin: 'LinkedIn Post',
  medium: 'Medium Article',
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
 * normalizeMobileCapture(input)
 *
 * input shape (from processEntry spread):
 *   { url, text, title, source, thumbnail, type, creator, board, channel, artist, ...raw }
 *
 * title and thumbnail come from platform extractor if available (never placeholders).
 * Falls back through: title → text snippet → platform fallback → 'Saved Link'.
 * Thumbnail validated as absolute HTTP/HTTPS URL or discarded.
 */
export function normalizeMobileCapture(input = {}) {
  const {
    url,
    text,
    title,
    source: explicitSource,
    thumbnail: inputThumbnail,
    type: inputType,
    creator,
    board,
    channel,
    artist,
  } = input
  const now = Date.now()

  const source = inferSource(url, explicitSource)
  const type = inputType || inferType(source)
  const parsed = safeParseUrl(url)

  const resolvedTitle =
    title?.trim() ||
    (text ? text.slice(0, 80).trim() : null) ||
    PLATFORM_TITLE_FALLBACKS[source] ||
    'Saved Link'

  const thumbnail = isValidThumbnailUrl(inputThumbnail) ? inputThumbnail : ''

  const tags = extractTags([title, text].filter(Boolean).join(' '))

  const extraMeta = {}
  if (creator) extraMeta.creator = creator
  if (board)   extraMeta.board   = board
  if (channel) extraMeta.channel = channel
  if (artist)  extraMeta.artist  = artist

  return {
    id: String(now),
    title: resolvedTitle,
    url: url || null,
    source,
    type,
    thumbnail,
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
      thumbnail: isValidThumbnailUrl(inputThumbnail) ? inputThumbnail : null,
      description: text || '',
      source,
      type,
      platform: inferPlatform(url),
      hostname: parsed?.hostname || null,
      canonicalUrl: url || null,
      origin: 'mobile-share',
      capturedAt: now,
      ...extraMeta,
    },
    raw: { ...input },
  }
}
