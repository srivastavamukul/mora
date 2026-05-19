import { normalizeTag } from './filterItems'

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

// Site-name-only titles that carry no useful information
const SITE_NAME_TITLES = new Set([
  'youtube', 'pinterest', 'instagram', 'spotify', 'twitter', 'x',
  'tiktok', 'linkedin', 'facebook', 'reddit', 'medium', 'home', 'untitled',
])

const PLATFORM_FALLBACKS = {
  youtube: 'YouTube Video',
  spotify: 'Spotify Track',
  instagram: 'Instagram Post',
  pinterest: 'Pinterest Pin',
  x: 'X Post',
  linkedin: 'LinkedIn Post',
  medium: 'Medium Article',
}

function isSuppressedTitle(title, source, url) {
  const lower = title.toLowerCase()
  if (SITE_NAME_TITLES.has(lower)) return true
  // Pinterest search page: title is just the search query — suppress it in inferTitle fallback
  if (source === 'pinterest') {
    const parsed = safeParseUrl(url)
    if (parsed?.pathname.includes('/search/')) return true
  }
  return false
}

// --- Pinterest-specific title extraction ---

const GENERIC_PINTEREST_TITLES = new Set([
  'pinterest', 'pin', 'pinterest pin', 'image', 'photo', 'picture',
  'video', 'save', 'saved', 'discover', 'home', 'untitled', 'ideas',
])

function isGenericPinterestTitle(title) {
  if (!title || title.length < 3) return true
  const lower = title.toLowerCase().trim()
  if (GENERIC_PINTEREST_TITLES.has(lower)) return true
  // "word - Pinterest" / "word | Pinterest" suffix
  if (/[-|·]\s*pinterest\s*$/i.test(lower)) return true
  return false
}

function pinterestBoardFromUrl(url) {
  const parsed = safeParseUrl(url)
  if (!parsed) return null
  const parts = parsed.pathname.split('/').filter(Boolean)
  // /username/board-name/ — skip system paths
  const SYSTEM_PATHS = new Set(['pin', 'search', 'topic', 'ideas', 'today', 'explore', 'settings'])
  if (parts.length >= 2 && !SYSTEM_PATHS.has(parts[0])) {
    const slug = parts[1]
    if (slug && slug.length > 2 && !/^\d+$/.test(slug)) {
      return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim()
    }
  }
  return null
}

function firstMeaningfulPhrase(text, maxWords = 8) {
  if (!text || typeof text !== 'string') return null
  const sentence = text.split(/[.!?\n]/)[0].trim()
  const words = sentence.split(/\s+/).filter(w => w.length > 1).slice(0, maxWords)
  const phrase = words.join(' ').trim()
  return phrase.length >= 8 ? phrase : null
}

function buildPinterestTitle(formData, seenTitles) {
  const url = formData.url || ''
  const isSearch = safeParseUrl(url)?.pathname.includes('/search/')

  const rawCandidates = [
    formData.metadata?.pinTitle,
    formData.metadata?.ogTitle,
    !isSearch ? formData.title : null,
    formData.metadata?.imageAlt,
    firstMeaningfulPhrase(formData.description),
    firstMeaningfulPhrase(formData.metadata?.ogDescription),
    firstMeaningfulPhrase(formData.selectedText),
    pinterestBoardFromUrl(url),
  ]

  for (const candidate of rawCandidates) {
    if (!candidate) continue
    const cleaned = candidate.trim().slice(0, 100)
    if (isGenericPinterestTitle(cleaned)) continue
    if (seenTitles.has(cleaned.toLowerCase())) continue
    return cleaned
  }

  return null
}

// --- end Pinterest ---

export function inferTitle(url, source, userTitle) {
  const cleaned = userTitle?.trim()

  if (cleaned && !isSuppressedTitle(cleaned, source, url)) {
    return cleaned
  }

  if (PLATFORM_FALLBACKS[source]) return PLATFORM_FALLBACKS[source]

  // Try to derive from URL slug
  const parsed = safeParseUrl(url)
  if (parsed) {
    const pathname = parsed.pathname
    if (pathname && pathname !== '/') {
      const lastSegment = pathname.split('/').filter(Boolean).pop()
      if (lastSegment) {
        if (/^[a-zA-Z0-9_-]{6,}$/.test(lastSegment)) {
          return PLATFORM_FALLBACKS[source] || 'Saved Link'
        }
        const derived = decodeURIComponent(lastSegment).replace(/[-_]/g, ' ').trim()
        if (derived.length > 0) return derived
      }
    }
  }

  return 'Saved Link'
}

const STOPWORDS = new Set([
  'the','and','for','with','this','that','from','you','your','are','was',
  'its','has','had','not','but','they','will','can','all','more','have',
  'been','what','how','when','who','which','into','about','than','also',
])

export function extractTags(text) {
  if (!text || typeof text !== 'string') return []
  return [...new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !STOPWORDS.has(w))
  )].slice(0, 5)
}

export function normalizeTags(tagsInput) {
  if (Array.isArray(tagsInput)) {
    return tagsInput
      .map(normalizeTag)
      .filter(Boolean)
      .filter((t, i, a) => a.indexOf(t) === i)
  }
  if (!tagsInput || typeof tagsInput !== 'string') return []

  return tagsInput
    .split(',')
    .map(normalizeTag)
    .filter(tag => tag.length > 0)
    .filter((tag, index, arr) => arr.indexOf(tag) === index)
}

export function normalizeItem(formData, existingItem = null, seenTitles = new Set()) {
  const isEditing = !!existingItem
  const now = Date.now()

  const explicitSource = formData.source?.trim()
  const urlSource = inferSource(formData.url)
  // Prefer URL-inferred platform over a generic 'web' from the extension
  const source = (explicitSource && explicitSource !== 'web') ? explicitSource : (urlSource || explicitSource || 'web')

  // Pinterest: extract best available title from all metadata fields; bypass inferTitle
  const pinterestTitle = source === 'pinterest' ? buildPinterestTitle(formData, seenTitles) : null
  const title = pinterestTitle ?? inferTitle(formData.url, source, formData.title)
  const type = existingItem
    ? existingItem.type
    : (formData.type || formData.filterKey || inferType(source))
  const manualTags = normalizeTags(formData.tags)
  const textBlob = [formData.title, formData.description, formData.source, formData.selectedText]
    .filter(Boolean).join(' ')
  const autoTags = extractTags(textBlob)
  const tags = [...new Set([...manualTags, ...autoTags.filter(t => !manualTags.includes(t))])].slice(0, 8)

  return {
    id: isEditing ? existingItem.id : String(now),
    title,
    url: formData.url || null,
    source: source || 'web',
    type,
    thumbnail: formData.thumbnail || formData.imageUrl || formData.metadata?.thumbnail || existingItem?.thumbnail || "",
    description: formData.description || existingItem?.description || "",
    tags,
    mood: formData.mood?.trim() || null,
    body: formData.body || (isEditing ? existingItem.body : '') || '',
    createdAt: isEditing ? existingItem.createdAt : now,
    updatedAt: isEditing ? now : null,
    externalId: formData.externalId ?? null,
    memoryDate: formData.memoryDate ?? existingItem?.memoryDate ?? null,
    memoryType: formData.memoryType ?? existingItem?.memoryType ?? null,
    privateNote: formData.privateNote ?? existingItem?.privateNote ?? null,
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
