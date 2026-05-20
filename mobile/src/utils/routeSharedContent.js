// Classify and extract incoming share-sheet content by platform, no UI, no side effects

import { extractInstagramShare } from './extractInstagramShare.js'
import { extractPinterestShare } from './extractPinterestShare.js'
import { extractYouTubeShare }   from './extractYouTubeShare.js'
import { extractSpotifyShare }   from './extractSpotifyShare.js'
import { safeParseUrl } from './urlUtils.js'

const PLATFORM_PATTERNS = [
  { platform: 'instagram', test: h => h.includes('instagram.com') },
  { platform: 'pinterest', test: h => h.includes('pinterest.com') || h.includes('pin.it') },
  { platform: 'youtube',   test: h => h.includes('youtube.com') || h.includes('youtu.be') },
  { platform: 'spotify',   test: h => h.includes('spotify.com') },
]

function detectPlatform(url) {
  const parsed = safeParseUrl(url)
  if (!parsed) return 'generic'
  const h = parsed.hostname.toLowerCase()
  for (const { platform, test } of PLATFORM_PATTERNS) {
    if (test(h)) return platform
  }
  return 'generic'
}

function inferContentType(platform, url) {
  switch (platform) {
    case 'youtube':   return 'video'
    case 'instagram': return 'post'
    case 'pinterest': return 'pin'
    case 'spotify': {
      const parsed = safeParseUrl(url)
      if (!parsed) return 'song'
      if (parsed.pathname.includes('/playlist/')) return 'playlist'
      if (parsed.pathname.includes('/album/'))    return 'album'
      if (parsed.pathname.includes('/episode/'))  return 'episode'
      return 'song'
    }
    default: return 'link'
  }
}

const EXTRACTORS = {
  instagram: extractInstagramShare,
  pinterest: extractPinterestShare,
  youtube:   extractYouTubeShare,
  spotify:   extractSpotifyShare,
}

/**
 * routeSharedContent({ url, text, title, source })
 * Returns routing metadata + platform-specific extracted fields.
 *
 * Shape:
 * {
 *   platform: 'instagram' | 'pinterest' | 'youtube' | 'spotify' | 'generic',
 *   contentType: string,
 *   normalizeReady: boolean,
 *   extracted: object | null,
 *   input: { url, text, title, source },
 * }
 */
export function routeSharedContent(input = {}) {
  const { url, text } = input
  const platform = detectPlatform(url)
  const extractor = EXTRACTORS[platform] || null

  return {
    platform,
    contentType: inferContentType(platform, url),
    normalizeReady: !!(url || text),
    extracted: extractor ? extractor(input) : null,
    input,
  }
}

export { detectPlatform }
