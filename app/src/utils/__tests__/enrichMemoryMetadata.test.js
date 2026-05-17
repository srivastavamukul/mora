import { describe, it, expect } from 'vitest'
import { enrichMemoryMetadata } from '../enrichMemoryMetadata.js'

const base = (overrides = {}) => ({
  id: '1',
  url: 'https://example.com',
  title: 'Test Title',
  description: 'A short description.',
  source: 'web',
  type: 'link',
  tags: [],
  body: '',
  createdAt: Date.now(),
  ...overrides,
})

describe('enrichMemoryMetadata', () => {
  describe('null / missing input', () => {
    it('returns safe defaults for null', () => {
      const r = enrichMemoryMetadata(null)
      expect(r.displayTitle).toBe('Saved Memory')
      expect(r.displayDescription).toBe('')
      expect(r.sourceLabel).toBe('Web')
      expect(r.captureType).toBe('link')
      expect(r.estimatedReadTime).toBeNull()
      expect(r.contentLength).toBe(0)
    })
  })

  describe('sourceLabel normalization', () => {
    it.each([
      ['youtube', 'YouTube'],
      ['spotify', 'Spotify'],
      ['instagram', 'Instagram'],
      ['pinterest', 'Pinterest'],
      ['x', 'X'],
      ['twitter', 'X'],
      ['linkedin', 'LinkedIn'],
      ['medium', 'Medium'],
      ['reddit', 'Reddit'],
      ['substack', 'Substack'],
      ['tiktok', 'TikTok'],
      ['github', 'GitHub'],
      ['soundcloud', 'SoundCloud'],
      ['vimeo', 'Vimeo'],
      ['web', 'Web'],
      ['manual', 'Web'],
    ])('source %s → %s', (source, label) => {
      expect(enrichMemoryMetadata(base({ source })).sourceLabel).toBe(label)
    })

    it('capitalizes unknown source', () => {
      expect(enrichMemoryMetadata(base({ source: 'arxiv' })).sourceLabel).toBe('Arxiv')
    })

    it('falls back to Web for empty source', () => {
      expect(enrichMemoryMetadata(base({ source: '' })).sourceLabel).toBe('Web')
    })

    it('reads from metadata.source when top-level source absent', () => {
      const item = base({ source: undefined })
      item.metadata = { source: 'github' }
      expect(enrichMemoryMetadata(item).sourceLabel).toBe('GitHub')
    })
  })

  describe('captureType inference', () => {
    it('note type → note', () => {
      expect(enrichMemoryMetadata(base({ type: 'note' })).captureType).toBe('note')
    })

    it('journal type → note', () => {
      expect(enrichMemoryMetadata(base({ type: 'journal', url: null })).captureType).toBe('note')
    })

    it('video type → video', () => {
      expect(enrichMemoryMetadata(base({ type: 'video' })).captureType).toBe('video')
    })

    it('song type → audio', () => {
      expect(enrichMemoryMetadata(base({ type: 'song' })).captureType).toBe('audio')
    })

    it('image type → image', () => {
      expect(enrichMemoryMetadata(base({ type: 'image' })).captureType).toBe('image')
    })

    it('article type → article', () => {
      expect(enrichMemoryMetadata(base({ type: 'article' })).captureType).toBe('article')
    })

    it('link + youtube source → video', () => {
      expect(enrichMemoryMetadata(base({ type: 'link', source: 'youtube' })).captureType).toBe('video')
    })

    it('link + spotify source → audio', () => {
      expect(enrichMemoryMetadata(base({ type: 'link', source: 'spotify' })).captureType).toBe('audio')
    })

    it('link + github source → repo', () => {
      expect(enrichMemoryMetadata(base({ type: 'link', source: 'github' })).captureType).toBe('repo')
    })

    it('link + unknown source → link', () => {
      expect(enrichMemoryMetadata(base({ type: 'link', source: 'web' })).captureType).toBe('link')
    })
  })

  describe('title cleaning', () => {
    it('strips site suffix', () => {
      const r = enrichMemoryMetadata(base({ title: 'Great Video - YouTube' }))
      expect(r.displayTitle).not.toContain('YouTube')
    })

    it('strips (Official Video) noise', () => {
      const r = enrichMemoryMetadata(base({ title: 'My Song (Official Video)' }))
      expect(r.displayTitle).toBe('My Song')
    })

    it('strips [HD] noise', () => {
      const r = enrichMemoryMetadata(base({ title: 'Epic Scene [HD]' }))
      expect(r.displayTitle).toBe('Epic Scene')
    })

    it('falls back to Saved Memory for empty title', () => {
      const r = enrichMemoryMetadata(base({ title: '' }))
      expect(r.displayTitle).toBe('Saved Memory')
    })
  })

  describe('description cleaning', () => {
    it('strips inline URLs', () => {
      const r = enrichMemoryMetadata(base({ description: 'Read more at https://example.com/article and enjoy.' }))
      expect(r.displayDescription).not.toContain('https://')
    })

    it('collapses excess whitespace', () => {
      const r = enrichMemoryMetadata(base({ description: 'Hello   world  test' }))
      expect(r.displayDescription).not.toMatch(/\s{2,}/)
    })

    it('empty description stays empty', () => {
      const r = enrichMemoryMetadata(base({ description: '' }))
      expect(r.displayDescription).toBe('')
    })
  })

  describe('estimatedReadTime', () => {
    it('null for short content', () => {
      const r = enrichMemoryMetadata(base({ body: 'Short text', description: 'Brief.' }))
      expect(r.estimatedReadTime).toBeNull()
    })

    it('returns minutes for long body', () => {
      const words = Array(300).fill('word').join(' ')
      const r = enrichMemoryMetadata(base({ body: words }))
      expect(r.estimatedReadTime).toBeGreaterThanOrEqual(1)
      expect(typeof r.estimatedReadTime).toBe('number')
    })
  })

  describe('contentLength', () => {
    it('zero for item with no text', () => {
      const r = enrichMemoryMetadata(base({ title: '', description: '', body: '' }))
      expect(r.contentLength).toBe(0)
    })

    it('counts title + description + body chars', () => {
      const r = enrichMemoryMetadata(base({ title: 'AB', description: 'CD', body: 'EF' }))
      expect(r.contentLength).toBe(8) // 'AB CD EF'.length — join uses spaces
    })
  })

  describe('return shape', () => {
    it('always returns all six keys', () => {
      const r = enrichMemoryMetadata(base())
      expect(r).toHaveProperty('displayTitle')
      expect(r).toHaveProperty('displayDescription')
      expect(r).toHaveProperty('sourceLabel')
      expect(r).toHaveProperty('captureType')
      expect(r).toHaveProperty('estimatedReadTime')
      expect(r).toHaveProperty('contentLength')
    })
  })
})
