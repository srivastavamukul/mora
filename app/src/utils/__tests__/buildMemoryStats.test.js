// src/utils/__tests__/buildMemoryStats.test.js
import { describe, it, expect } from 'vitest'
import { buildMemoryStats } from '../buildMemoryStats'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

function makeItem(overrides = {}) {
  return {
    id: Math.random().toString(36).slice(2),
    type: 'link',
    title: 'Test',
    tags: [],
    source: null,
    collection: null,
    createdAt: Date.now(),
    ...overrides,
  }
}

describe('buildMemoryStats', () => {
  it('returns zero-shape for non-array input', () => {
    expect(buildMemoryStats(null)).toEqual({
      total: 0, journals: 0, collections: 0,
      topSource: null, topTag: null, weeklyGrowth: [],
    })
    expect(buildMemoryStats(undefined)).toEqual({
      total: 0, journals: 0, collections: 0,
      topSource: null, topTag: null, weeklyGrowth: [],
    })
  })

  it('returns zero-shape for empty array', () => {
    const result = buildMemoryStats([])
    expect(result.total).toBe(0)
    expect(result.journals).toBe(0)
    expect(result.collections).toBe(0)
    expect(result.topSource).toBeNull()
    expect(result.topTag).toBeNull()
    expect(result.weeklyGrowth).toHaveLength(12)
  })

  it('counts total correctly', () => {
    const items = Array.from({ length: 7 }, () => makeItem())
    expect(buildMemoryStats(items).total).toBe(7)
  })

  it('counts journals (type === journal)', () => {
    const items = [
      makeItem({ type: 'journal' }),
      makeItem({ type: 'journal' }),
      makeItem({ type: 'link' }),
    ]
    expect(buildMemoryStats(items).journals).toBe(2)
  })

  it('counts distinct non-null collections', () => {
    const items = [
      makeItem({ collection: 'alpha' }),
      makeItem({ collection: 'alpha' }),
      makeItem({ collection: 'beta' }),
      makeItem({ collection: null }),
    ]
    expect(buildMemoryStats(items).collections).toBe(2)
  })

  it('collections is 0 when all collection values are null', () => {
    const items = [makeItem(), makeItem()]
    expect(buildMemoryStats(items).collections).toBe(0)
  })

  it('topSource returns source with highest count', () => {
    const items = [
      makeItem({ source: 'youtube' }),
      makeItem({ source: 'youtube' }),
      makeItem({ source: 'twitter' }),
    ]
    const result = buildMemoryStats(items)
    expect(result.topSource).toEqual({ source: 'youtube', count: 2 })
  })

  it('topSource is null when no items have a source', () => {
    const items = [makeItem({ source: null }), makeItem({ source: null })]
    expect(buildMemoryStats(items).topSource).toBeNull()
  })

  it('topTag returns tag with highest count', () => {
    const items = [
      makeItem({ tags: ['design', 'art'] }),
      makeItem({ tags: ['design'] }),
      makeItem({ tags: ['art'] }),
    ]
    const result = buildMemoryStats(items)
    expect(result.topTag).toEqual({ tag: 'design', count: 2 })
  })

  it('topTag is null when no items have tags', () => {
    const items = [makeItem({ tags: [] }), makeItem({ tags: [] })]
    expect(buildMemoryStats(items).topTag).toBeNull()
  })

  it('weeklyGrowth returns exactly 12 entries', () => {
    expect(buildMemoryStats([]).weeklyGrowth).toHaveLength(12)
    expect(buildMemoryStats([makeItem()]).weeklyGrowth).toHaveLength(12)
  })

  it('weeklyGrowth labels match format "Mon W1"', () => {
    const labels = buildMemoryStats([]).weeklyGrowth.map(w => w.label)
    const pattern = /^[A-Z][a-z]{2} W[1-5]$/
    for (const label of labels) {
      expect(label).toMatch(pattern)
    }
  })

  it('weeklyGrowth counts item created this week', () => {
    const items = [makeItem({ createdAt: Date.now() - 1000 })]
    const result = buildMemoryStats(items)
    const lastBucket = result.weeklyGrowth[11]
    expect(lastBucket.count).toBe(1)
  })

  it('weeklyGrowth ignores item older than 12 weeks', () => {
    const old = makeItem({ createdAt: Date.now() - 13 * WEEK_MS })
    const result = buildMemoryStats([old])
    const total = result.weeklyGrowth.reduce((s, w) => s + w.count, 0)
    expect(total).toBe(0)
  })

  it('weeklyGrowth counts are all non-negative integers', () => {
    const items = Array.from({ length: 5 }, () => makeItem())
    for (const { count } of buildMemoryStats(items).weeklyGrowth) {
      expect(count).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(count)).toBe(true)
    }
  })
})
