import { describe, it, expect } from 'vitest'
import { inferTitle, inferSource, normalizeItem, isValidThumbnailUrl } from '../normalizeCapture'
import { captureItem } from '../captureItem'

// --- inferTitle ---

describe('inferTitle — YouTube', () => {
  it('returns YouTube Video when title is bare site name', () => {
    expect(inferTitle('https://youtube.com/watch?v=abc', 'youtube', 'YouTube')).toBe('YouTube Video')
  })

  it('keeps a real video title', () => {
    const title = 'How to Build a React App - Tutorial'
    expect(inferTitle('https://youtube.com/watch?v=abc', 'youtube', title)).toBe(title)
  })

  it('returns YouTube Video when no title provided', () => {
    expect(inferTitle('https://youtube.com/watch?v=abc', 'youtube', '')).toBe('YouTube Video')
  })
})

describe('inferTitle — Pinterest', () => {
  it('suppresses search page title (query term)', () => {
    expect(
      inferTitle('https://pinterest.com/search/pins/?q=coding', 'pinterest', 'coding')
    ).toBe('Pinterest Pin')
  })

  it('suppresses search page even with "- Pinterest" suffix in title', () => {
    expect(
      inferTitle('https://pinterest.com/search/pins/?q=design', 'pinterest', 'design - Pinterest')
    ).toBe('Pinterest Pin')
  })

  it('keeps a real pin title from a pin page', () => {
    const title = 'Minimalist workspace setup ideas'
    expect(
      inferTitle('https://pinterest.com/pin/123456/', 'pinterest', title)
    ).toBe(title)
  })

  it('returns Pinterest Pin when title is bare site name', () => {
    expect(
      inferTitle('https://pinterest.com/pin/123/', 'pinterest', 'Pinterest')
    ).toBe('Pinterest Pin')
  })

  it('returns Pinterest Pin when title is "Pinterest Pin"', () => {
    expect(
      inferTitle('https://pinterest.com/pin/123/', 'pinterest', 'Pinterest Pin')
    ).toBe('Pinterest Pin')
  })
})

describe('inferTitle — generic site-name suppression', () => {
  it('suppresses bare "Instagram" title', () => {
    expect(inferTitle('https://instagram.com/p/abc/', 'instagram', 'Instagram')).toBe('Instagram Post')
  })

  it('suppresses bare "Spotify" title', () => {
    expect(inferTitle('https://open.spotify.com/track/abc', 'spotify', 'Spotify')).toBe('Spotify Track')
  })

  it('keeps a real title for any source', () => {
    expect(inferTitle('https://medium.com/article', 'medium', 'Why async matters')).toBe('Why async matters')
  })
})

// --- source detection ---

describe('inferSource — Spotify URL', () => {
  it('infers spotify from URL', () => {
    expect(inferSource('https://open.spotify.com/track/abc123')).toBe('spotify')
  })
})

describe('normalizeItem — source from URL overrides generic web', () => {
  it('uses spotify when source is "web" but URL is spotify', () => {
    const item = normalizeItem({ url: 'https://open.spotify.com/track/abc123', source: 'web', title: 'Track Name' })
    expect(item.source).toBe('spotify')
  })

  it('uses youtube when source is "web" but URL is youtube', () => {
    const item = normalizeItem({ url: 'https://youtube.com/watch?v=xyz', source: 'web', title: 'My Video' })
    expect(item.source).toBe('youtube')
  })

  it('keeps explicit non-web source', () => {
    const item = normalizeItem({ url: 'https://example.com', source: 'instagram', title: 'Post' })
    expect(item.source).toBe('instagram')
  })
})

// --- Pinterest normalizeItem title extraction ---

describe('normalizeItem — Pinterest title extraction', () => {
  const pinUrl = 'https://pinterest.com/pin/123456/'
  const boardUrl = 'https://pinterest.com/username/minimal-setup/'
  const searchUrl = 'https://pinterest.com/search/pins/?q=coding'

  it('prefers metadata.pinTitle over everything', () => {
    const item = normalizeItem({
      url: pinUrl,
      title: 'Pinterest Pin',
      description: 'Some description text here',
      metadata: { pinTitle: 'Dark UI inspiration boards' },
    })
    expect(item.title).toBe('Dark UI inspiration boards')
  })

  it('falls back to metadata.ogTitle when pinTitle absent', () => {
    const item = normalizeItem({
      url: pinUrl,
      title: 'Pinterest Pin',
      metadata: { ogTitle: 'Minimal coding setup ideas' },
    })
    expect(item.title).toBe('Minimal coding setup ideas')
  })

  it('falls back to description phrase when all title fields generic', () => {
    const item = normalizeItem({
      url: pinUrl,
      title: 'Pinterest Pin',
      description: 'Startup workspace design with clean desk and monitors',
    })
    expect(item.title).not.toBe('Pinterest Pin')
    expect(item.title.length).toBeGreaterThan(5)
  })

  it('falls back to metadata.imageAlt', () => {
    const item = normalizeItem({
      url: pinUrl,
      title: 'Pin',
      metadata: { imageAlt: 'Minimalist home office setup' },
    })
    expect(item.title).toBe('Minimalist home office setup')
  })

  it('derives board name from board URL when all else fails', () => {
    const item = normalizeItem({
      url: boardUrl,
      title: 'Pinterest',
    })
    expect(item.title).toBe('Minimal Setup')
  })

  it('suppresses search-page title and tries description', () => {
    const item = normalizeItem({
      url: searchUrl,
      title: 'coding',
      description: 'Creative coding workspace ideas for developers',
    })
    expect(item.title).not.toBe('coding')
    expect(item.title).not.toBe('Pinterest Pin')
  })

  it('avoids duplicate titles via seenTitles', () => {
    const seen = new Set(['dark ui inspiration boards'])
    const item = normalizeItem(
      {
        url: pinUrl,
        title: 'Pinterest Pin',
        metadata: {
          pinTitle: 'Dark UI inspiration boards',
          ogTitle: 'Minimal workspace setup',
        },
      },
      null,
      seen
    )
    expect(item.title.toLowerCase()).not.toBe('dark ui inspiration boards')
    expect(item.title).toBe('Minimal workspace setup')
  })

  it('rejects generic Pinterest Pin title and uses next candidate', () => {
    const item = normalizeItem({
      url: pinUrl,
      title: 'Pinterest Pin',
      metadata: { ogTitle: 'Photo' },
      description: 'Aesthetic desk setup inspiration for remote workers',
    })
    // 'Photo' is generic, description phrase should win
    expect(item.title).not.toBe('Pinterest Pin')
    expect(item.title).not.toBe('Photo')
  })
})

// --- Instagram thumbnail fallback ---

describe('normalizeItem — Instagram thumbnail fallback', () => {
  it('uses imageUrl when thumbnail is missing', () => {
    const item = normalizeItem({
      url: 'https://instagram.com/p/abc/',
      title: 'A post',
      thumbnail: '',
      imageUrl: 'https://cdn.instagram.com/img.jpg',
    })
    expect(item.thumbnail).toBe('https://cdn.instagram.com/img.jpg')
  })

  it('uses metadata.thumbnail when thumbnail and imageUrl are missing', () => {
    const item = normalizeItem({
      url: 'https://instagram.com/p/abc/',
      title: 'A post',
      thumbnail: '',
      imageUrl: '',
      metadata: { thumbnail: 'https://cdn.instagram.com/meta.jpg' },
    })
    expect(item.thumbnail).toBe('https://cdn.instagram.com/meta.jpg')
  })

  it('prefers direct thumbnail over imageUrl', () => {
    const item = normalizeItem({
      url: 'https://instagram.com/p/abc/',
      title: 'A post',
      thumbnail: 'https://cdn.instagram.com/direct.jpg',
      imageUrl: 'https://cdn.instagram.com/fallback.jpg',
    })
    expect(item.thumbnail).toBe('https://cdn.instagram.com/direct.jpg')
  })
})

// --- isValidThumbnailUrl ---

describe('isValidThumbnailUrl', () => {
  it('accepts https URL', () => {
    expect(isValidThumbnailUrl('https://example.com/img.jpg')).toBe(true)
  })

  it('accepts http URL', () => {
    expect(isValidThumbnailUrl('http://example.com/img.jpg')).toBe(true)
  })

  it('rejects relative URL', () => {
    expect(isValidThumbnailUrl('/images/thumb.jpg')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidThumbnailUrl('')).toBe(false)
  })

  it('rejects null', () => {
    expect(isValidThumbnailUrl(null)).toBe(false)
  })

  it('rejects data URI', () => {
    expect(isValidThumbnailUrl('data:image/png;base64,abc')).toBe(false)
  })
})

// --- normalizeItem thumbnail validation ---

describe('normalizeItem — thumbnail URL validation', () => {
  it('rejects relative thumbnail, falls through to imageUrl', () => {
    const item = normalizeItem({
      url: 'https://example.com/page',
      title: 'Test',
      thumbnail: '/images/local.jpg',
      imageUrl: 'https://cdn.example.com/img.jpg',
    })
    expect(item.thumbnail).toBe('https://cdn.example.com/img.jpg')
  })

  it('rejects empty thumbnail, falls through to metadata.thumbnail', () => {
    const item = normalizeItem({
      url: 'https://example.com/page',
      title: 'Test',
      thumbnail: '',
      imageUrl: '',
      metadata: { thumbnail: 'https://cdn.example.com/meta.jpg' },
    })
    expect(item.thumbnail).toBe('https://cdn.example.com/meta.jpg')
  })

  it('returns empty string when all thumbnail sources invalid', () => {
    const item = normalizeItem({
      url: 'https://example.com/page',
      title: 'Test',
      thumbnail: '/bad.jpg',
      imageUrl: '',
    })
    expect(item.thumbnail).toBe('')
  })

  it('metadata.thumbnail also validated — rejects relative', () => {
    const item = normalizeItem({
      url: 'https://example.com/page',
      title: 'Test',
      thumbnail: '',
      metadata: { thumbnail: '/relative.jpg' },
    })
    expect(item.thumbnail).toBe('')
    expect(item.metadata.thumbnail).toBe(null)
  })
})

// --- captureItem — url-less items ---

describe('captureItem — url-less items', () => {
  it('allows item with title and no URL', () => {
    const item = captureItem({ title: 'A memory note', type: 'note', url: '' })
    expect(item).not.toBe(null)
    expect(item.title).toBe('A memory note')
    expect(item.url).toBe(null)
  })

  it('rejects item with no URL and no title', () => {
    const item = captureItem({ title: '', url: '', type: 'note' })
    expect(item).toBe(null)
  })

  it('allows item with URL and no title (derives title)', () => {
    const item = captureItem({ url: 'https://example.com/', title: '' })
    expect(item).not.toBe(null)
    expect(item.url).toBe('https://example.com/')
  })
})
