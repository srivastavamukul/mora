import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { enrichCapturedItem } from '../enrichCapturedItem.js'

// Minimal fetch mock helper
function mockFetch(html, status = 200) {
  const body = html
    ? {
        getReader: () => {
          let done = false
          return {
            read: async () => {
              if (done) return { done: true }
              done = true
              return { done: false, value: new TextEncoder().encode(html) }
            },
            cancel: async () => {},
          }
        },
      }
    : null
  return vi.fn().mockResolvedValue({ ok: status === 200, status, body })
}

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch(''))
})
afterEach(() => {
  vi.restoreAllMocks()
})

// --- URL validation ---

describe('enrichCapturedItem — invalid input', () => {
  it('returns null for null url', async () => {
    expect(await enrichCapturedItem(null)).toBe(null)
  })

  it('returns null for empty string', async () => {
    expect(await enrichCapturedItem('')).toBe(null)
  })

  it('returns null for relative url', async () => {
    expect(await enrichCapturedItem('/path/to/page')).toBe(null)
  })
})

// --- Network failure ---

describe('enrichCapturedItem — network failure', () => {
  it('returns null when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    expect(await enrichCapturedItem('https://example.com/')).toBe(null)
  })

  it('returns null when response is not ok', async () => {
    vi.stubGlobal('fetch', mockFetch(null, 404))
    expect(await enrichCapturedItem('https://example.com/')).toBe(null)
  })
})

// --- OG parsing ---

describe('enrichCapturedItem — OG title extraction', () => {
  it('extracts og:title', async () => {
    vi.stubGlobal('fetch', mockFetch(`
      <html><head>
        <meta property="og:title" content="Reel by @natgeo" />
      </head></html>
    `))
    const result = await enrichCapturedItem('https://instagram.com/reel/abc/', {})
    expect(result.title).toBe('Reel by @natgeo')
  })

  it('falls back to twitter:title when og:title absent', async () => {
    vi.stubGlobal('fetch', mockFetch(`
      <html><head>
        <meta name="twitter:title" content="Tweet title" />
      </head></html>
    `))
    const result = await enrichCapturedItem('https://x.com/user/status/1', {})
    expect(result.title).toBe('Tweet title')
  })

  it('extracts og:description', async () => {
    vi.stubGlobal('fetch', mockFetch(`
      <html><head>
        <meta property="og:title" content="Post" />
        <meta property="og:description" content="Beautiful sunset photo" />
      </head></html>
    `))
    const result = await enrichCapturedItem('https://instagram.com/p/abc/', {})
    expect(result.description).toBe('Beautiful sunset photo')
  })

  it('extracts og:image as thumbnail', async () => {
    vi.stubGlobal('fetch', mockFetch(`
      <html><head>
        <meta property="og:title" content="Post" />
        <meta property="og:image" content="https://cdn.instagram.com/thumb.jpg" />
      </head></html>
    `))
    const result = await enrichCapturedItem('https://instagram.com/p/abc/', {})
    expect(result.thumbnail).toBe('https://cdn.instagram.com/thumb.jpg')
    expect(result.metadata.thumbnail).toBe('https://cdn.instagram.com/thumb.jpg')
  })

  it('decodes HTML entities in og:title', async () => {
    vi.stubGlobal('fetch', mockFetch(`
      <html><head>
        <meta property="og:title" content="5 &amp; 10 &lt;tips&gt;" />
      </head></html>
    `))
    const result = await enrichCapturedItem('https://example.com/', {})
    expect(result.title).toBe('5 & 10 <tips>')
  })
})

// --- Merge decisions ---

describe('enrichCapturedItem — merge decisions', () => {
  it('does NOT overwrite a real existing title', async () => {
    vi.stubGlobal('fetch', mockFetch(`
      <html><head>
        <meta property="og:title" content="OG Title from web" />
      </head></html>
    `))
    const result = await enrichCapturedItem('https://instagram.com/p/abc/', {
      title: 'Caption I wrote myself',
    })
    // title already meaningful → should not be in update
    expect(result).toBe(null)
  })

  it('DOES overwrite placeholder title', async () => {
    vi.stubGlobal('fetch', mockFetch(`
      <html><head>
        <meta property="og:title" content="Real Post Title" />
      </head></html>
    `))
    const result = await enrichCapturedItem('https://instagram.com/p/abc/', {
      title: 'Instagram Post',
    })
    expect(result.title).toBe('Real Post Title')
  })

  it('DOES overwrite empty title', async () => {
    vi.stubGlobal('fetch', mockFetch(`
      <html><head>
        <meta property="og:title" content="Real Post Title" />
      </head></html>
    `))
    const result = await enrichCapturedItem('https://instagram.com/p/abc/', { title: '' })
    expect(result.title).toBe('Real Post Title')
  })

  it('does NOT overwrite existing description', async () => {
    vi.stubGlobal('fetch', mockFetch(`
      <html><head>
        <meta property="og:title" content="T" />
        <meta property="og:description" content="OG desc" />
      </head></html>
    `))
    const result = await enrichCapturedItem('https://instagram.com/p/abc/', {
      title: 'Instagram Post',
      description: 'Already have a caption',
    })
    expect(result?.description).toBeUndefined()
  })

  it('does NOT overwrite existing thumbnail', async () => {
    vi.stubGlobal('fetch', mockFetch(`
      <html><head>
        <meta property="og:title" content="T" />
        <meta property="og:image" content="https://cdn.new.com/new.jpg" />
      </head></html>
    `))
    const result = await enrichCapturedItem('https://instagram.com/p/abc/', {
      title: 'Instagram Post',
      thumbnail: 'https://cdn.existing.com/existing.jpg',
    })
    expect(result?.thumbnail).toBeUndefined()
  })

  it('returns null when all OG fields absent', async () => {
    vi.stubGlobal('fetch', mockFetch('<html><head><title>Page</title></head></html>'))
    const result = await enrichCapturedItem('https://example.com/', { title: 'Instagram Post' })
    expect(result).toBe(null)
  })

  it('returns null when existing item already has all fields enriched', async () => {
    vi.stubGlobal('fetch', mockFetch(`
      <html><head>
        <meta property="og:title" content="OG Title" />
        <meta property="og:description" content="OG Desc" />
        <meta property="og:image" content="https://cdn.com/img.jpg" />
      </head></html>
    `))
    const result = await enrichCapturedItem('https://instagram.com/p/abc/', {
      title: 'My real title',
      description: 'My real description',
      thumbnail: 'https://cdn.com/existing.jpg',
    })
    expect(result).toBe(null)
  })

  it('ignores non-absolute thumbnail URL from OG', async () => {
    vi.stubGlobal('fetch', mockFetch(`
      <html><head>
        <meta property="og:title" content="T" />
        <meta property="og:image" content="/relative/path.jpg" />
      </head></html>
    `))
    const result = await enrichCapturedItem('https://example.com/', { title: 'Instagram Post' })
    // title updates but thumbnail is skipped
    expect(result?.thumbnail).toBeUndefined()
  })
})
