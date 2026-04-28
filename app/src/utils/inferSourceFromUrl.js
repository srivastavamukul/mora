/**
 * Optional utility to infer source from URL
 * Safely extracts hostname and returns simple source name
 */

export function inferSourceFromUrl(url) {
  if (!url || typeof url !== 'string') return null

  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.toLowerCase()

    // Known platform detection
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'youtube'
    if (hostname.includes('spotify.com')) return 'spotify'
    if (hostname.includes('instagram.com')) return 'instagram'
    if (hostname.includes('pinterest.com')) return 'pinterest'
    if (hostname.includes('x.com') || hostname.includes('twitter.com')) return 'x'
    if (hostname.includes('linkedin.com')) return 'linkedin'
    if (hostname.includes('medium.com')) return 'medium'

    // Generic domain extraction
    const domain = hostname.replace(/^www\./, '').split('.')[0]
    return domain || null
  } catch {
    return null
  }
}
