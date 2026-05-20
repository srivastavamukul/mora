// Tests for mobile extraction pipeline — run with any Node-compatible test runner
// Covers: placeholder prevention, thumbnail flow, extracted metadata passthrough

import { describe, it, expect } from 'vitest'
import { normalizeMobileCapture } from '../normalizeMobileCapture.js'
import { extractYouTubeShare } from '../extractYouTubeShare.js'
import { extractInstagramShare } from '../extractInstagramShare.js'
import { extractPinterestShare } from '../extractPinterestShare.js'
import { extractSpotifyShare } from '../extractSpotifyShare.js'
import { routeSharedContent } from '../routeSharedContent.js'

// --- extractYouTubeShare ---

describe('extractYouTubeShare', () => {
  it('derives thumbnail from video ID', () => {
    const result = extractYouTubeShare({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
    expect(result.thumbnail).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
  })

  it('derives thumbnail from youtu.be short URL', () => {
    const result = extractYouTubeShare({ url: 'https://youtu.be/dQw4w9WgXcQ' })
    expect(result.thumbnail).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
  })

  it('returns null thumbnail when no video ID', () => {
    const result = extractYouTubeShare({ url: 'https://youtube.com/' })
    expect(result.thumbnail).toBe(null)
  })

  it('returns null title when no title or text provided', () => {
    const result = extractYouTubeShare({ url: 'https://youtu.be/abc123' })
    expect(result.title).toBe(null)
  })

  it('uses title when provided', () => {
    const result = extractYouTubeShare({ url: 'https://youtu.be/abc', title: 'My Video' })
    expect(result.title).toBe('My Video')
  })

  it('falls back to text when no title', () => {
    const result = extractYouTubeShare({ url: 'https://youtu.be/abc', text: 'Video description here' })
    expect(result.title).toBe('Video description here')
  })
})

// --- extractInstagramShare ---

describe('extractInstagramShare', () => {
  it('returns null title when no title or text', () => {
    const result = extractInstagramShare({ url: 'https://instagram.com/p/abc123/' })
    expect(result.title).toBe(null)
  })

  it('infers reel type from URL', () => {
    const result = extractInstagramShare({ url: 'https://instagram.com/reel/abc123/' })
    expect(result.type).toBe('reel')
  })

  it('infers story type from URL', () => {
    const result = extractInstagramShare({ url: 'https://instagram.com/stories/user/123/' })
    expect(result.type).toBe('story')
  })

  it('extracts creator from profile URL', () => {
    const result = extractInstagramShare({ url: 'https://instagram.com/johndoe/p/abc/' })
    expect(result.creator).toBe('johndoe')
  })

  it('uses text as title when no title provided', () => {
    const result = extractInstagramShare({ url: 'https://instagram.com/p/abc/', text: 'Beautiful sunset photo' })
    expect(result.title).toBe('Beautiful sunset photo')
  })
})

// --- extractPinterestShare ---

describe('extractPinterestShare', () => {
  it('returns null title when no title or text', () => {
    const result = extractPinterestShare({ url: 'https://pinterest.com/pin/123/' })
    expect(result.title).toBe(null)
  })

  it('extracts board from URL', () => {
    const result = extractPinterestShare({ url: 'https://pinterest.com/user/my-board/pin/123/' })
    expect(result.board).toBe('my-board')
  })
})

// --- extractSpotifyShare ---

describe('extractSpotifyShare', () => {
  it('returns null title when no title or text', () => {
    const result = extractSpotifyShare({ url: 'https://open.spotify.com/track/abc' })
    expect(result.title).toBe(null)
  })

  it('infers playlist type', () => {
    const result = extractSpotifyShare({ url: 'https://open.spotify.com/playlist/abc' })
    expect(result.type).toBe('playlist')
  })

  it('infers album type', () => {
    const result = extractSpotifyShare({ url: 'https://open.spotify.com/album/abc' })
    expect(result.type).toBe('album')
  })

  it('infers episode type', () => {
    const result = extractSpotifyShare({ url: 'https://open.spotify.com/episode/abc' })
    expect(result.type).toBe('episode')
  })
})

// --- normalizeMobileCapture — thumbnail flow ---

describe('normalizeMobileCapture — thumbnail', () => {
  it('uses valid https thumbnail from input', () => {
    const item = normalizeMobileCapture({
      url: 'https://youtube.com/watch?v=abc',
      thumbnail: 'https://img.youtube.com/vi/abc/hqdefault.jpg',
    })
    expect(item.thumbnail).toBe('https://img.youtube.com/vi/abc/hqdefault.jpg')
  })

  it('rejects relative thumbnail, falls back to empty', () => {
    const item = normalizeMobileCapture({
      url: 'https://example.com/',
      title: 'Test',
      thumbnail: '/images/thumb.jpg',
    })
    expect(item.thumbnail).toBe('')
    expect(item.metadata.thumbnail).toBe(null)
  })

  it('stores null in metadata.thumbnail when no valid thumbnail', () => {
    const item = normalizeMobileCapture({ url: 'https://instagram.com/p/abc/', title: 'Post' })
    expect(item.metadata.thumbnail).toBe(null)
  })
})

// --- normalizeMobileCapture — title fallback priority ---

describe('normalizeMobileCapture — title fallback', () => {
  it('uses provided title first', () => {
    const item = normalizeMobileCapture({
      url: 'https://instagram.com/p/abc/',
      title: 'Real caption here',
      text: 'Some other text',
    })
    expect(item.title).toBe('Real caption here')
  })

  it('falls back to text when title is null', () => {
    const item = normalizeMobileCapture({
      url: 'https://instagram.com/p/abc/',
      title: null,
      text: 'Beautiful sunset photo from the coast',
      source: 'instagram',
    })
    expect(item.title).toBe('Beautiful sunset photo from the coast')
  })

  it('falls back to platform-specific placeholder as last resort', () => {
    const item = normalizeMobileCapture({
      url: 'https://instagram.com/p/abc/',
      title: null,
      text: null,
      source: 'instagram',
    })
    expect(item.title).toBe('Instagram Post')
  })

  it('falls back to Saved Link for unknown sources', () => {
    const item = normalizeMobileCapture({
      url: 'https://example.com/',
      title: null,
      text: null,
    })
    expect(item.title).toBe('Saved Link')
  })
})

// --- normalizeMobileCapture — type from extractor ---

describe('normalizeMobileCapture — type passthrough', () => {
  it('uses inputType over inferred type', () => {
    const item = normalizeMobileCapture({
      url: 'https://open.spotify.com/playlist/abc',
      title: 'My Playlist',
      source: 'spotify',
      type: 'playlist',
    })
    expect(item.type).toBe('playlist')
  })

  it('falls back to inferred type when inputType absent', () => {
    const item = normalizeMobileCapture({
      url: 'https://instagram.com/p/abc/',
      title: 'Post',
      source: 'instagram',
    })
    expect(item.type).toBe('post')
  })
})

// --- normalizeMobileCapture — extracted metadata passthrough ---

describe('normalizeMobileCapture — extracted metadata passthrough', () => {
  it('stores creator in metadata', () => {
    const item = normalizeMobileCapture({
      url: 'https://instagram.com/johndoe/p/abc/',
      title: 'Post',
      source: 'instagram',
      creator: 'johndoe',
    })
    expect(item.metadata.creator).toBe('johndoe')
  })

  it('stores board in metadata', () => {
    const item = normalizeMobileCapture({
      url: 'https://pinterest.com/user/my-board/pin/123/',
      title: 'Pin',
      source: 'pinterest',
      board: 'my-board',
    })
    expect(item.metadata.board).toBe('my-board')
  })
})

// --- full pipeline: routeSharedContent → normalizeMobileCapture ---

describe('full pipeline — YouTube share', () => {
  it('produces valid thumbnail from share URL', () => {
    const payload = { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', text: 'Never Gonna Give You Up' }
    const routed = routeSharedContent(payload)
    const item = normalizeMobileCapture({
      ...payload,
      source: routed.platform !== 'generic' ? routed.platform : undefined,
      ...routed.extracted,
    })
    expect(item.thumbnail).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
    expect(item.title).toBe('Never Gonna Give You Up')
    expect(item.type).toBe('video')
  })
})

describe('full pipeline — Instagram share with no title', () => {
  it('uses caption text, never placeholder', () => {
    const payload = { url: 'https://instagram.com/p/abc/', text: 'Sunset vibes from the beach' }
    const routed = routeSharedContent(payload)
    const item = normalizeMobileCapture({
      ...payload,
      source: routed.platform !== 'generic' ? routed.platform : undefined,
      ...routed.extracted,
    })
    expect(item.title).toBe('Sunset vibes from the beach')
    expect(item.title).not.toBe('Instagram Post')
  })
})

describe('full pipeline — Spotify playlist share', () => {
  it('uses playlist type from extractor', () => {
    const payload = { url: 'https://open.spotify.com/playlist/abc123', title: 'Chill Vibes' }
    const routed = routeSharedContent(payload)
    const item = normalizeMobileCapture({
      ...payload,
      source: routed.platform !== 'generic' ? routed.platform : undefined,
      ...routed.extracted,
    })
    expect(item.type).toBe('playlist')
    expect(item.title).toBe('Chill Vibes')
  })
})
