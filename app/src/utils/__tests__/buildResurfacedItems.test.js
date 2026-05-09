import { describe, it, expect } from 'vitest'
import { buildResurfacedItems } from '../buildResurfacedItems'

const DAY = 86400000

function makeItem(overrides = {}) {
  return {
    id: Math.random().toString(36).slice(2),
    title: 'Test Item',
    source: 'web',
    type: 'note',
    tags: [],
    body: '',
    thumbnail: null,
    createdAt: Date.now() - 15 * DAY,
    ...overrides,
  }
}

const signals = {
  topTags: [
    { tag: 'design', count: 10 },
    { tag: 'focus', count: 8 },
    { tag: 'music', count: 5 },
  ],
  topSources: [],
}

describe('buildResurfacedItems', () => {
  it('returns empty array for empty input', () => {
    expect(buildResurfacedItems([], signals)).toEqual([])
  })

  it('returns max 8 items', () => {
    const items = Array.from({ length: 20 }, (_, i) =>
      makeItem({ id: String(i), source: `src${i}`, tags: ['design'] })
    )
    expect(buildResurfacedItems(items, signals).length).toBeLessThanOrEqual(8)
  })

  it('boosts items whose tags appear in topTags', () => {
    const relevant = makeItem({ id: 'r', tags: ['design', 'focus'] })
    const irrelevant = makeItem({ id: 'i', tags: ['cooking'] })
    const result = buildResurfacedItems([irrelevant, relevant], signals)
    expect(result[0].id).toBe('r')
  })

  it('prefers medium-recency (7–30 days) over very fresh items', () => {
    const fresh = makeItem({ id: 'fresh', createdAt: Date.now() - 1000, tags: [] })
    const sweet = makeItem({ id: 'sweet', createdAt: Date.now() - 15 * DAY, tags: [] })
    const result = buildResurfacedItems([fresh, sweet], { topTags: [], topSources: [] })
    expect(result[0].id).toBe('sweet')
  })

  it('caps at 2 items per source', () => {
    const items = Array.from({ length: 5 }, (_, i) =>
      makeItem({ id: String(i), source: 'spotify', tags: ['design'] })
    )
    const result = buildResurfacedItems(items, signals)
    expect(result.filter(i => i.source === 'spotify').length).toBeLessThanOrEqual(2)
  })

  it('caps at 2 items per top tag cluster', () => {
    const items = Array.from({ length: 5 }, (_, i) =>
      makeItem({ id: String(i), source: `s${i}`, tags: ['design'] })
    )
    const result = buildResurfacedItems(items, signals)
    expect(result.filter(i => i.tags.includes('design')).length).toBeLessThanOrEqual(2)
  })

  it('boosts richness: body increases score', () => {
    const withBody = makeItem({ id: 'b', body: 'some description', tags: [] })
    const noBody = makeItem({ id: 'n', body: '', tags: [] })
    const result = buildResurfacedItems([noBody, withBody], { topTags: [], topSources: [] })
    expect(result[0].id).toBe('b')
  })

  it('boosts richness: thumbnail increases score', () => {
    const withThumb = makeItem({ id: 't', thumbnail: 'http://x.com/img.jpg', tags: [] })
    const noThumb = makeItem({ id: 'n', thumbnail: null, tags: [] })
    const result = buildResurfacedItems([noThumb, withThumb], { topTags: [], topSources: [] })
    expect(result[0].id).toBe('t')
  })

  it('handles null/undefined behaviorSignals gracefully', () => {
    const items = [makeItem()]
    expect(() => buildResurfacedItems(items, null)).not.toThrow()
    expect(() => buildResurfacedItems(items, undefined)).not.toThrow()
  })
})
