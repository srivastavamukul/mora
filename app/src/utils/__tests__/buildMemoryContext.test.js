import { describe, it, expect } from 'vitest'
import { buildMemoryContext } from '../buildMemoryContext.js'

const NOW = Date.now()
const DAY = 86400000

function item(id, daysAgo, { tags = [], source = 'web', type = 'article', title = '' } = {}) {
  return { id, createdAt: NOW - daysAgo * DAY, tags, source, type, title }
}

describe('buildMemoryContext', () => {
  describe('guard cases', () => {
    it('returns empty for null items', () => {
      const result = buildMemoryContext('design', null)
      expect(result).toEqual({
        relevantMemories: [],
        relatedJournals: [],
        themes: [],
        sources: [],
        observations: [],
      })
    })

    it('returns empty for empty items', () => {
      const result = buildMemoryContext('design', [])
      expect(result).toEqual({
        relevantMemories: [],
        relatedJournals: [],
        themes: [],
        sources: [],
        observations: [],
      })
    })

    it('returns all five keys always', () => {
      const items = [item('a', 1)]
      const result = buildMemoryContext('', items)
      expect(result).toHaveProperty('relevantMemories')
      expect(result).toHaveProperty('relatedJournals')
      expect(result).toHaveProperty('themes')
      expect(result).toHaveProperty('sources')
      expect(result).toHaveProperty('observations')
    })
  })

  describe('relevantMemories', () => {
    it('caps at 5', () => {
      const items = Array.from({ length: 10 }, (_, i) => item(`i${i}`, i + 1, { title: 'design art' }))
      const result = buildMemoryContext('design', items)
      expect(result.relevantMemories.length).toBeLessThanOrEqual(5)
    })

    it('returns by recency when query empty', () => {
      const items = [
        item('old', 10),
        item('mid', 5),
        item('new', 1),
      ]
      const result = buildMemoryContext('', items)
      expect(result.relevantMemories[0].id).toBe('new')
    })

    it('returns by recency when query null', () => {
      const items = [item('old', 10), item('new', 1)]
      const result = buildMemoryContext(null, items)
      expect(result.relevantMemories[0].id).toBe('new')
    })

    it('returns semantic matches when query present', () => {
      const items = [
        item('a', 1, { title: 'design patterns' }),
        item('b', 2, { title: 'cooking recipes' }),
      ]
      const result = buildMemoryContext('design', items)
      expect(result.relevantMemories.some(m => m.id === 'a')).toBe(true)
    })

    it('returns empty array when no matches for query', () => {
      const items = [item('a', 1, { title: 'cooking recipes' })]
      const result = buildMemoryContext('quantum physics', items)
      expect(Array.isArray(result.relevantMemories)).toBe(true)
    })
  })

  describe('relatedJournals', () => {
    it('caps at 3', () => {
      const items = Array.from({ length: 6 }, (_, i) =>
        item(`j${i}`, i + 1, { type: 'journal', title: 'design' })
      )
      const result = buildMemoryContext('design', items)
      expect(result.relatedJournals.length).toBeLessThanOrEqual(3)
    })

    it('only includes journal type', () => {
      const items = [
        item('j1', 1, { type: 'journal', title: 'design' }),
        item('a1', 2, { type: 'article', title: 'design art' }),
      ]
      const result = buildMemoryContext('design', items)
      expect(result.relatedJournals.every(m => m.type === 'journal')).toBe(true)
    })

    it('returns recent journals when query empty', () => {
      const items = [
        item('j1', 10, { type: 'journal' }),
        item('j2', 1, { type: 'journal' }),
        item('a1', 5, { type: 'article' }),
      ]
      const result = buildMemoryContext('', items)
      expect(result.relatedJournals[0].id).toBe('j2')
    })

    it('returns empty when no journals exist', () => {
      const items = [item('a1', 1, { type: 'article' })]
      const result = buildMemoryContext('', items)
      expect(result.relatedJournals).toEqual([])
    })
  })

  describe('themes', () => {
    it('returns top tags from relevant memories', () => {
      const items = [
        item('a', 1, { tags: ['design', 'ux'], title: 'design ux' }),
        item('b', 2, { tags: ['design', 'art'], title: 'design art' }),
        item('c', 3, { tags: ['design'], title: 'design tools' }),
      ]
      const result = buildMemoryContext('design', items)
      expect(result.themes).toContain('design')
    })

    it('caps themes at 5', () => {
      const tags = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
      const items = Array.from({ length: 5 }, (_, i) =>
        item(`i${i}`, i + 1, { tags, title: tags.join(' ') })
      )
      const result = buildMemoryContext('a b c d e f g', items)
      expect(result.themes.length).toBeLessThanOrEqual(5)
    })

    it('returns array even when no tags', () => {
      const items = [item('a', 1, { tags: [] })]
      const result = buildMemoryContext('', items)
      expect(Array.isArray(result.themes)).toBe(true)
    })
  })

  describe('sources', () => {
    it('returns dominant sources from relevant memories', () => {
      const items = [
        item('a', 1, { source: 'twitter', title: 'design' }),
        item('b', 2, { source: 'twitter', title: 'design tips' }),
        item('c', 3, { source: 'medium', title: 'design article' }),
      ]
      const result = buildMemoryContext('design', items)
      expect(result.sources[0]).toBe('twitter')
    })

    it('caps sources at 3', () => {
      const srcs = ['a', 'b', 'c', 'd']
      const items = srcs.map((src, i) =>
        item(`i${i}`, i + 1, { source: src, title: 'test query' })
      )
      const result = buildMemoryContext('test', items)
      expect(result.sources.length).toBeLessThanOrEqual(3)
    })
  })

  describe('observations', () => {
    it('uses signals.observations when present', () => {
      const items = [item('a', 1)]
      const signals = { observations: ['You journaled more than usual.', 'Design themes appeared.'] }
      const result = buildMemoryContext('', items, signals)
      expect(result.observations).toEqual(signals.observations)
    })

    it('caps signals.observations at 5', () => {
      const items = [item('a', 1)]
      const signals = { observations: ['o1', 'o2', 'o3', 'o4', 'o5', 'o6'] }
      const result = buildMemoryContext('', items, signals)
      expect(result.observations.length).toBeLessThanOrEqual(5)
    })

    it('derives from topTags when no observations', () => {
      const items = [item('a', 1)]
      const signals = { topTags: [{ tag: 'design', count: 5 }], topSources: [] }
      const result = buildMemoryContext('', items, signals)
      expect(result.observations.some(o => o.includes('design'))).toBe(true)
    })

    it('derives from topSources when no observations', () => {
      const items = [item('a', 1)]
      const signals = { topTags: [], topSources: [{ source: 'twitter', count: 3 }] }
      const result = buildMemoryContext('', items, signals)
      expect(result.observations.some(o => o.includes('twitter'))).toBe(true)
    })

    it('includes high saveFrequency signal', () => {
      const items = [item('a', 1)]
      const signals = { topTags: [], topSources: [], saveFrequency: 'high' }
      const result = buildMemoryContext('', items, signals)
      expect(result.observations.some(o => o.toLowerCase().includes('high'))).toBe(true)
    })

    it('returns empty observations with no signals', () => {
      const items = [item('a', 1)]
      const result = buildMemoryContext('', items, {})
      expect(result.observations).toEqual([])
    })

    it('returns empty observations when signals omitted', () => {
      const items = [item('a', 1)]
      const result = buildMemoryContext('', items)
      expect(result.observations).toEqual([])
    })
  })
})
