import { safeParseUrl } from './urlUtils.js'

function inferBoardFromUrl(parsed) {
  if (!parsed) return null
  const parts = parsed.pathname.split('/').filter(Boolean)
  if (parts.length >= 2 && parts[1] !== 'pin') return parts[1]
  return null
}

export function extractPinterestShare(input = {}) {
  const { url, text, title } = input
  const parsed = safeParseUrl(url)
  return {
    source: 'pinterest',
    type: 'image',
    url: url || null,
    title: title?.trim() || (text ? text.slice(0, 80).trim() : null) || null,
    thumbnail: null,
    board: inferBoardFromUrl(parsed),
  }
}
