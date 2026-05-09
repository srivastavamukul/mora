import { describe, it, expect } from 'vitest'
import { getRecentReflections } from '../getRecentReflections.js'

function makeItem(overrides = {}) {
  return {
    id: Math.random().toString(36).slice(2),
    title: 'Test',
    type: 'note',
    tags: [],
    body: '',
    createdAt: Date.now(),
    ...overrides,
  }
}

describe('getRecentReflections', () => {
  it('returns empty array for empty input', () => {
    expect(getRecentReflections([])).toEqual([])
  })

  it('returns empty array for null input', () => {
    expect(getRecentReflections(null)).toEqual([])
  })

  it('returns empty array for undefined input', () => {
    expect(getRecentReflections(undefined)).toEqual([])
  })

  it('excludes non-journal items', () => {
    const items = [
      makeItem({ type: 'note' }),
      makeItem({ type: 'song' }),
      makeItem({ type: 'insight' }),
    ]
    expect(getRecentReflections(items)).toEqual([])
  })

  it('returns only journal items', () => {
    const items = [
      makeItem({ type: 'note' }),
      makeItem({ type: 'journal', id: 'j1' }),
      makeItem({ type: 'song' }),
    ]
    const result = getRecentReflections(items)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('j1')
  })

  it('sorts journal items newest first', () => {
    const items = [
      makeItem({ type: 'journal', id: 'old', createdAt: 1000 }),
      makeItem({ type: 'journal', id: 'mid', createdAt: 3000 }),
      makeItem({ type: 'journal', id: 'new', createdAt: 5000 }),
    ]
    const result = getRecentReflections(items)
    expect(result.map(i => i.id)).toEqual(['new', 'mid', 'old'])
  })

  it('caps at 10 even with more entries', () => {
    const items = Array.from({ length: 15 }, (_, i) =>
      makeItem({ type: 'journal', createdAt: i * 1000 })
    )
    expect(getRecentReflections(items)).toHaveLength(10)
  })

  it('returns the 10 most recent when capping', () => {
    const items = Array.from({ length: 12 }, (_, i) =>
      makeItem({ type: 'journal', id: `j${i}`, createdAt: i * 1000 })
    )
    const result = getRecentReflections(items)
    expect(result[0].id).toBe('j11')
    expect(result[9].id).toBe('j2')
  })
})
