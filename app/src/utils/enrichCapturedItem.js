const TIMEOUT_MS = 6000
const MAX_BYTES = 60 * 1024  // 60KB covers <head> for most sites

const PLACEHOLDER_TITLES = new Set([
  'Instagram Post', 'Pinterest Pin', 'YouTube Video', 'Spotify Track',
  'X Post', 'LinkedIn Post', 'Medium Article', 'Saved Link', 'Untitled',
])

function isValidUrl(url) {
  return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

function extractMetaContent(html, property) {
  const esc = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${esc}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${esc}["']`, 'i'),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) return decodeEntities(m[1].trim())
  }
  return null
}

function parseOg(html) {
  return {
    title:
      extractMetaContent(html, 'og:title') ??
      extractMetaContent(html, 'twitter:title'),
    description:
      extractMetaContent(html, 'og:description') ??
      extractMetaContent(html, 'twitter:description'),
    thumbnail:
      extractMetaContent(html, 'og:image') ??
      extractMetaContent(html, 'twitter:image'),
  }
}

/**
 * Fetch OG metadata for a URL, return a partial item update or null.
 * Never throws. Returns null on any failure or when nothing useful found.
 * Only overwrites fields that are currently blank/placeholder.
 *
 * @param {string} url
 * @param {{ title?: string, description?: string, thumbnail?: string }} existingItem
 * @returns {Promise<object|null>}
 */
export async function enrichCapturedItem(url, existingItem = {}) {
  if (!isValidUrl(url)) return null

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)

    if (!response.ok) return null

    let html = ''
    const reader = response.body?.getReader()
    if (reader) {
      const decoder = new TextDecoder()
      let bytes = 0
      while (bytes < MAX_BYTES) {
        const { done, value } = await reader.read()
        if (done) break
        html += decoder.decode(value, { stream: true })
        bytes += value.byteLength
        if (html.includes('</head>')) break
      }
      reader.cancel().catch(() => {})
    } else {
      html = await response.text()
    }

    const og = parseOg(html)

    const update = {}

    const curTitle = existingItem.title?.trim() ?? ''
    if (og.title && (!curTitle || PLACEHOLDER_TITLES.has(curTitle))) {
      update.title = og.title
    }

    if (og.description && !existingItem.description?.trim()) {
      update.description = og.description
    }

    if (og.thumbnail && isValidUrl(og.thumbnail) && !existingItem.thumbnail?.trim()) {
      update.thumbnail = og.thumbnail
      update.metadata = { thumbnail: og.thumbnail }
    }

    return Object.keys(update).length > 0 ? update : null
  } catch {
    return null
  }
}
