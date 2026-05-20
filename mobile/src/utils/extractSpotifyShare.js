import { safeParseUrl } from './urlUtils.js'

function inferSpotifyType(parsed) {
  if (!parsed) return 'song'
  const p = parsed.pathname
  if (p.includes('/playlist/')) return 'playlist'
  if (p.includes('/album/'))    return 'album'
  if (p.includes('/episode/'))  return 'episode'
  if (p.includes('/show/'))     return 'podcast'
  return 'song'
}

export function extractSpotifyShare(input = {}) {
  const { url, text, title } = input
  const parsed = safeParseUrl(url)
  return {
    source: 'spotify',
    type: inferSpotifyType(parsed),
    url: url || null,
    title: title?.trim() || (text ? text.slice(0, 80).trim() : null) || null,
    artist: null,
    thumbnail: null,
  }
}
