import { describe, it, expect } from 'vitest'
import { getRecentlyRelevantItems } from '../getRecentlyRelevantItems'

const NOW = Date.now()
const DAY = 86400000

const makeItem = (id, tags = [], createdAt = NOW) => ({
  id, title: `Item ${id}`, tags, source: 'mora', type: 'note', createdAt,
})

describe('getRecentlyRelevantItems', () => {
  it('returns empty array for empty input', () => {
    expect(getRecentlyRelevantItems([])).toEqual([])
  })

  it('returns empty array for null', () => {
    expect(getRecentlyRelevantItems(null)).toEqual([])
  })

  it('returns items sorted by score descending', () => {
    const fresh = makeItem('1', ['focus', 'design'], NOW)
    const old = makeItem('2', [], NOW - 100 * DAY)
    const result = getRecentlyRelevantItems([fresh, old])
    expect(result[0].id).toBe('1')
  })

  it('gives interest boost to items with top-3 tags', () => {
    const items = [
      ...Array.from({ length: 5 }, (_, i) => makeItem(String(i), ['focus'], NOW - i * DAY)),
      makeItem('no-boost', ['rare'], NOW - 50 * DAY),
    ]
    const result = getRecentlyRelevantItems(items)
    const noBoostIdx = result.findIndex(i => i.id === 'no-boost')
    const focusItems = result.filter(i => i.id !== 'no-boost')
    focusItems.forEach(fi => {
      expect(result.indexOf(fi)).toBeLessThan(noBoostIdx === -1 ? result.length : noBoostIdx)
    })
  })

  it('returns max 10 items', () => {
    const items = Array.from({ length: 20 }, (_, i) => makeItem(String(i), ['focus'], NOW - i * DAY))
    expect(getRecentlyRelevantItems(items)).toHaveLength(10)
  })

  it('handles items with no tags without throwing', () => {
    const items = [makeItem('1', []), makeItem('2', [])]
    expect(() => getRecentlyRelevantItems(items)).not.toThrow()
  })
})
