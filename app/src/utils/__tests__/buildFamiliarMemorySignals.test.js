import { describe, it, expect } from 'vitest'
import { buildFamiliarMemorySignals } from '../buildFamiliarMemorySignals'

const DAY_MS = 24 * 60 * 60 * 1000

function makeItem(overrides = {}) {
  return {
    id: Math.random().toString(36).slice(2),
    type: 'link',
    title: 'Test',
    tags: [],
    source: 'example.com',
    createdAt: Date.now(),
    collection: null,
    ...overrides,
  }
}

const emptySignals = { topSources: [], topTags: [], dominantType: null, saveFrequency: 'low' }

describe('buildFamiliarMemorySignals', () => {
  it('returns all empty on empty input', () => {
    const result = buildFamiliarMemorySignals([], emptySignals, [])
    expect(result).toEqual({
      recurringInterests: [],
      recurringCollections: [],
      longRunningTopics: [],
      familiarSources: [],
      reflectionThemes: [],
    })
  })

  it('returns all empty when fewer than 5 items', () => {
    const items = [makeItem(), makeItem(), makeItem(), makeItem()]
    const result = buildFamiliarMemorySignals(items, emptySignals, [])
    expect(result).toEqual({
      recurringInterests: [],
      recurringCollections: [],
      longRunningTopics: [],
      familiarSources: [],
      reflectionThemes: [],
    })
  })

  it('includes tag in recurringInterests when count >= 3 and span >= 30 days', () => {
    const now = Date.now()
    const items = [
      makeItem({ tags: ['design'], createdAt: now - 40 * DAY_MS }),
      makeItem({ tags: ['design'], createdAt: now - 20 * DAY_MS }),
      makeItem({ tags: ['design'], createdAt: now }),
      makeItem(),
      makeItem(),
    ]
    const { recurringInterests } = buildFamiliarMemorySignals(items, emptySignals, [])
    expect(recurringInterests.some(r => r.tag === 'design')).toBe(true)
  })

  it('excludes tag from recurringInterests when count < 3', () => {
    const now = Date.now()
    const items = [
      makeItem({ tags: ['design'], createdAt: now - 40 * DAY_MS }),
      makeItem({ tags: ['design'], createdAt: now }),
      makeItem(),
      makeItem(),
      makeItem(),
    ]
    const { recurringInterests } = buildFamiliarMemorySignals(items, emptySignals, [])
    expect(recurringInterests.some(r => r.tag === 'design')).toBe(false)
  })

  it('excludes tag from recurringInterests when span < 30 days', () => {
    const now = Date.now()
    const items = [
      makeItem({ tags: ['design'], createdAt: now - 5 * DAY_MS }),
      makeItem({ tags: ['design'], createdAt: now - 3 * DAY_MS }),
      makeItem({ tags: ['design'], createdAt: now }),
      makeItem(),
      makeItem(),
    ]
    const { recurringInterests } = buildFamiliarMemorySignals(items, emptySignals, [])
    expect(recurringInterests.some(r => r.tag === 'design')).toBe(false)
  })

  it('includes tag in longRunningTopics when span > 60 days', () => {
    const now = Date.now()
    const items = [
      makeItem({ tags: ['productivity'], createdAt: now - 65 * DAY_MS }),
      makeItem({ tags: ['productivity'], createdAt: now }),
      makeItem(),
      makeItem(),
      makeItem(),
    ]
    const { longRunningTopics } = buildFamiliarMemorySignals(items, emptySignals, [])
    expect(longRunningTopics.some(t => t.tag === 'productivity')).toBe(true)
  })

  it('excludes tag from longRunningTopics when span <= 60 days', () => {
    const now = Date.now()
    const items = [
      makeItem({ tags: ['productivity'], createdAt: now - 59 * DAY_MS }),
      makeItem({ tags: ['productivity'], createdAt: now }),
      makeItem(),
      makeItem(),
      makeItem(),
    ]
    const { longRunningTopics } = buildFamiliarMemorySignals(items, emptySignals, [])
    expect(longRunningTopics.some(t => t.tag === 'productivity')).toBe(false)
  })

  it('includes collection in recurringCollections when count >= 2 and span >= 14 days', () => {
    const now = Date.now()
    const items = [
      makeItem({ collection: 'Reading', createdAt: now - 20 * DAY_MS }),
      makeItem({ collection: 'Reading', createdAt: now }),
      makeItem(),
      makeItem(),
      makeItem(),
    ]
    const { recurringCollections } = buildFamiliarMemorySignals(items, emptySignals, [])
    expect(recurringCollections.some(c => c.name === 'Reading')).toBe(true)
  })

  it('excludes collection when span < 14 days', () => {
    const now = Date.now()
    const items = [
      makeItem({ collection: 'Reading', createdAt: now - 5 * DAY_MS }),
      makeItem({ collection: 'Reading', createdAt: now }),
      makeItem(),
      makeItem(),
      makeItem(),
    ]
    const { recurringCollections } = buildFamiliarMemorySignals(items, emptySignals, [])
    expect(recurringCollections.some(c => c.name === 'Reading')).toBe(false)
  })

  it('includes source in familiarSources when count >= 3', () => {
    const signals = {
      topSources: [{ source: 'medium.com', count: 4 }, { source: 'reddit.com', count: 2 }],
      topTags: [],
      dominantType: null,
      saveFrequency: 'low',
    }
    const items = [makeItem(), makeItem(), makeItem(), makeItem(), makeItem()]
    const { familiarSources } = buildFamiliarMemorySignals(items, signals, [])
    expect(familiarSources.some(s => s.source === 'medium.com')).toBe(true)
    expect(familiarSources.some(s => s.source === 'reddit.com')).toBe(false)
  })

  it('includes reflection themes from journal body words, excludes stop words', () => {
    const now = Date.now()
    const items = [
      makeItem({ type: 'journal', body: 'thinking about focus and focus again', createdAt: now }),
      makeItem({ type: 'journal', body: 'deep focus needed today', createdAt: now - DAY_MS }),
      makeItem(),
      makeItem(),
      makeItem(),
    ]
    const { reflectionThemes } = buildFamiliarMemorySignals(items, emptySignals, [])
    expect(reflectionThemes.some(t => t.word === 'focus')).toBe(true)
    expect(reflectionThemes.some(t => t.word === 'that')).toBe(false)
    expect(reflectionThemes.some(t => t.word === 'with')).toBe(false)
  })

  it('excludes reflection theme words with count < 2', () => {
    const now = Date.now()
    const items = [
      makeItem({ type: 'journal', body: 'unique word here', createdAt: now }),
      makeItem(),
      makeItem(),
      makeItem(),
      makeItem(),
    ]
    const { reflectionThemes } = buildFamiliarMemorySignals(items, emptySignals, [])
    expect(reflectionThemes.some(t => t.word === 'unique')).toBe(false)
  })
})
