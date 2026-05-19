// Extract structured metadata from a Spotify share input (no API calls)

function safeParseUrl(url) {
  if (!url || typeof url !== 'string') return null
  try { return new URL(url) } catch { return null }
}

function inferSpotifyType(parsed) {
  if (!parsed) return 'audio'
  const p = parsed.pathname
  if (p.includes('/playlist/')) return 'playlist'
  if (p.includes('/album/'))    return 'album'
  if (p.includes('/episode/'))  return 'episode'
  if (p.includes('/show/'))     return 'podcast'
  return 'audio'
}

/**
 * extractSpotifyShare({ url, text, title, source })
 * Returns Spotify-specific metadata. Deterministic, no API calls.
 */
export function extractSpotifyShare(input = {}) {
  const { url, text, title } = input
  const parsed = safeParseUrl(url)

  return {
    source: 'spotify',
    type: inferSpotifyType(parsed),
    url: url || null,
    title: title?.trim() || (text ? text.slice(0, 80).trim() : null) || 'Spotify Track',
    artist: null,
    thumbnail: null,
  }
}
