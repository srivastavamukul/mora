// Extract structured metadata from a Pinterest share input (no API calls)

function safeParseUrl(url) {
  if (!url || typeof url !== 'string') return null
  try { return new URL(url) } catch { return null }
}

function inferBoardFromUrl(parsed) {
  if (!parsed) return null
  const parts = parsed.pathname.split('/').filter(Boolean)
  // pinterest.com/username/board-name/pin/...
  // parts[0]=username, parts[1]=board
  if (parts.length >= 2 && parts[1] !== 'pin') return parts[1]
  return null
}

/**
 * extractPinterestShare({ url, text, title, source })
 * Returns Pinterest-specific metadata. Deterministic, no API calls.
 */
export function extractPinterestShare(input = {}) {
  const { url, text, title } = input
  const parsed = safeParseUrl(url)

  return {
    source: 'pinterest',
    type: 'image',
    url: url || null,
    title: title?.trim() || (text ? text.slice(0, 80).trim() : null) || 'Pinterest Pin',
    thumbnail: null,
    board: inferBoardFromUrl(parsed),
  }
}
