import { describe, it, expect } from 'vitest'
import { buildMemoryInsights } from '../buildMemoryInsights'

function makeItem(overrides = {}) {
  return {
    id: Math.random().toString(36).slice(2),
    title: 'Test Item',
    source: 'web',
    type: 'link',
    tags: [],
    thumbnail: null,
    createdAt: Date.now(),
    ...overrides,
  }
}

function makeSignals(overrides = {}) {
  return {
    topSources: [],
    topTags: [],
    dominantType: null,
    saveFrequency: 'low',
    ...overrides,
  }
}

describe('buildMemoryInsights', () => {
  it('returns empty array for null/undefined inputs', () => {
    expect(buildMemoryInsights(null, null, null)).toEqual([])
    expect(buildMemoryInsights(undefined, undefined, undefined)).toEqual([])
  })

  it('returns empty array for fewer than 5 items', () => {
    const items = Array.from({ length: 4 }, () => makeItem({ tags: ['design'] }))
    const signals = makeSignals({ topTags: [{ tag: 'design', count: 4 }] })
    expect(buildMemoryInsights(items, signals, [])).toEqual([])
  })

  it('returns at most 5 insights', () => {
    const items = Array.from({ length: 20 }, () =>
      makeItem({ tags: ['design', 'productivity'], source: 'youtube', thumbnail: 'x.jpg' })
    )
    const signals = makeSignals({
      topTags: [{ tag: 'design', count: 15 }, { tag: 'productivity', count: 10 }],
      topSources: [{ source: 'youtube', count: 15 }],
      dominantType: 'video',
      saveFrequency: 'high',
    })
    const clusters = [{ tag: 'design', count: 15 }]
    const result = buildMemoryInsights(items, signals, clusters)
    expect(result.length).toBeLessThanOrEqual(5)
  })

  it('each insight is a non-empty string', () => {
    const items = Array.from({ length: 10 }, () => makeItem({ tags: ['design'] }))
    const signals = makeSignals({ topTags: [{ tag: 'design', count: 8 }] })
    const result = buildMemoryInsights(items, signals, [])
    expect(result.length).toBeGreaterThan(0)
    for (const insight of result) {
      expect(typeof insight).toBe('string')
      expect(insight.length).toBeGreaterThan(0)
    }
  })

  // --- Dominant tag insight ---

  it('generates tag insight when top tag meets count and ratio threshold', () => {
    const items = Array.from({ length: 10 }, () => makeItem({ tags: ['design'] }))
    const signals = makeSignals({ topTags: [{ tag: 'design', count: 8 }] })
    const result = buildMemoryInsights(items, signals, [])
    expect(result.some(s => s.toLowerCase().includes('design'))).toBe(true)
  })

  it('skips tag insight when count below minimum (< 3)', () => {
    const items = Array.from({ length: 10 }, () => makeItem())
    const signals = makeSignals({ topTags: [{ tag: 'design', count: 2 }] })
    const result = buildMemoryInsights(items, signals, [])
    expect(result.some(s => s.toLowerCase().includes('design'))).toBe(false)
  })

  it('skips tag insight when tag ratio below 20%', () => {
    const items = Array.from({ length: 20 }, () => makeItem())
    const signals = makeSignals({ topTags: [{ tag: 'design', count: 3 }] })
    const result = buildMemoryInsights(items, signals, [])
    expect(result.some(s => s.toLowerCase().includes('design'))).toBe(false)
  })

  // --- Dominant source insight ---

  it('generates source insight when one source dominates', () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      makeItem({ source: i < 7 ? 'YouTube' : 'web' })
    )
    const signals = makeSignals({ topSources: [{ source: 'YouTube', count: 7 }] })
    const result = buildMemoryInsights(items, signals, [])
    expect(result.some(s => s.toLowerCase().includes('youtube'))).toBe(true)
  })

  it('skips source insight when count below minimum (< 3)', () => {
    const items = Array.from({ length: 10 }, () => makeItem())
    const signals = makeSignals({ topSources: [{ source: 'YouTube', count: 2 }] })
    const result = buildMemoryInsights(items, signals, [])
    expect(result.some(s => s.toLowerCase().includes('youtube'))).toBe(false)
  })

  it('skips source insight when source ratio below 30%', () => {
    const items = Array.from({ length: 20 }, () => makeItem())
    const signals = makeSignals({ topSources: [{ source: 'YouTube', count: 4 }] })
    const result = buildMemoryInsights(items, signals, [])
    expect(result.some(s => s.toLowerCase().includes('youtube'))).toBe(false)
  })

  // --- Visual insight ---

  it('generates visual insight when 50%+ items have thumbnails', () => {
    const items = Array.from({ length: 10 }, () => makeItem({ thumbnail: 'img.jpg' }))
    const result = buildMemoryInsights(items, makeSignals(), [])
    expect(result.some(s => s.toLowerCase().includes('visual'))).toBe(true)
  })

  it('skips visual insight when fewer than 5 thumbnails exist', () => {
    const items = [
      ...Array.from({ length: 4 }, () => makeItem({ thumbnail: 'img.jpg' })),
      makeItem(),
    ]
    const result = buildMemoryInsights(items, makeSignals(), [])
    expect(result.some(s => s.toLowerCase().includes('visual'))).toBe(false)
  })

  it('skips visual insight when thumbnail ratio below 50%', () => {
    const items = [
      ...Array.from({ length: 4 }, () => makeItem({ thumbnail: 'img.jpg' })),
      ...Array.from({ length: 6 }, () => makeItem()),
    ]
    const result = buildMemoryInsights(items, makeSignals(), [])
    expect(result.some(s => s.toLowerCase().includes('visual'))).toBe(false)
  })

  // --- Category insight ---

  it('generates creativity category insight for design/art tags', () => {
    const items = Array.from({ length: 10 }, () => makeItem({ tags: ['design', 'art'] }))
    const signals = makeSignals({
      topTags: [{ tag: 'design', count: 8 }, { tag: 'art', count: 6 }],
    })
    const result = buildMemoryInsights(items, signals, [])
    expect(result.some(s => s.toLowerCase().includes('creativ'))).toBe(true)
  })

  it('generates productivity category insight for focus/productivity tags', () => {
    const items = Array.from({ length: 10 }, () => makeItem({ tags: ['focus', 'productivity'] }))
    const signals = makeSignals({
      topTags: [{ tag: 'focus', count: 7 }, { tag: 'productivity', count: 5 }],
    })
    const result = buildMemoryInsights(items, signals, [])
    expect(result.some(s => s.toLowerCase().includes('productiv'))).toBe(true)
  })

  it('skips category insight when combined tag count below threshold (< 5)', () => {
    const items = Array.from({ length: 10 }, () => makeItem())
    const signals = makeSignals({
      topTags: [{ tag: 'design', count: 2 }, { tag: 'art', count: 2 }],
    })
    const result = buildMemoryInsights(items, signals, [])
    expect(result.some(s => s.toLowerCase().includes('creativ'))).toBe(false)
  })

  // --- Save frequency insight ---

  it('generates frequency insight when saveFrequency is high', () => {
    const items = Array.from({ length: 10 }, () => makeItem())
    const signals = makeSignals({ saveFrequency: 'high' })
    const result = buildMemoryInsights(items, signals, [])
    expect(result.some(s => s.toLowerCase().includes('lately') || s.toLowerCase().includes('active'))).toBe(true)
  })

  it('skips frequency insight when saveFrequency is low', () => {
    const items = Array.from({ length: 10 }, () => makeItem())
    const signals = makeSignals({ saveFrequency: 'low' })
    const result = buildMemoryInsights(items, signals, [])
    expect(result.some(s => s.toLowerCase().includes('lately') || s.toLowerCase().includes('active'))).toBe(false)
  })
})
