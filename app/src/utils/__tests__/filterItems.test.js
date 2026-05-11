import { describe, it, expect } from 'vitest'
import { normalizeTag, getTopTags, filterItemsAdvanced } from '../filterItems'

describe('normalizeTag', () => {
  it('lowercases and trims', () => {
    expect(normalizeTag('  Focus  ')).toBe('focus')
  })
  it('handles already normalized input', () => {
    expect(normalizeTag('focus')).toBe('focus')
  })
  it('handles empty string', () => {
    expect(normalizeTag('')).toBe('')
  })
  it('coerces non-string to string', () => {
    expect(normalizeTag(42)).toBe('42')
  })
})

describe('getTopTags', () => {
  const items = [
    { tags: ['focus', 'night'] },
    { tags: ['focus', 'design'] },
    { tags: ['night'] },
    { tags: [] },
    { tags: null },
    {},
  ]

  it('returns tags sorted by frequency descending', () => {
    const result = getTopTags(items)
    expect(result[0].tag).toBe('focus')
    expect(result[0].count).toBe(2)
  })
  it('includes count for each tag', () => {
    const result = getTopTags(items)
    const night = result.find(r => r.tag === 'night')
    expect(night).toEqual({ tag: 'night', count: 2 })
  })
  it('respects n limit', () => {
    expect(getTopTags(items, 2)).toHaveLength(2)
  })
  it('ties broken alphabetically', () => {
    const tied = [{ tags: ['b', 'a'] }, { tags: ['b', 'a'] }]
    const result = getTopTags(tied)
    expect(result[0].tag).toBe('a')
  })
  it('returns empty array for empty items', () => {
    expect(getTopTags([])).toEqual([])
  })
  it('normalizes tags before counting', () => {
    const mixed = [{ tags: ['Focus'] }, { tags: ['focus'] }]
    const result = getTopTags(mixed)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ tag: 'focus', count: 2 })
  })
  it('skips items with null or missing tags without throwing', () => {
    expect(() => getTopTags(items)).not.toThrow()
  })
})

describe('filterItemsAdvanced', () => {
  const memories = [
    { type: 'song',    source: 'spotify', tags: ['focus', 'night'] },
    { type: 'note',    source: 'mora',    tags: ['focus', 'design'] },
    { type: 'reading', source: 'nyt',     tags: ['design'] },
    { type: 'note',    source: 'mora',    tags: [] },
  ]

  it('returns all when called with no opts', () => {
    expect(filterItemsAdvanced(memories, {})).toHaveLength(4)
  })
  it('returns all when type is all', () => {
    expect(filterItemsAdvanced(memories, { type: 'all' })).toHaveLength(4)
  })
  it('filters by type', () => {
    expect(filterItemsAdvanced(memories, { type: 'note' })).toHaveLength(2)
  })
  it('filters by single tag', () => {
    expect(filterItemsAdvanced(memories, { tags: ['focus'] })).toHaveLength(2)
  })
  it('AND logic: item must have all active tags', () => {
    expect(filterItemsAdvanced(memories, { tags: ['focus', 'night'] })).toHaveLength(1)
  })
  it('empty tags array matches everything', () => {
    expect(filterItemsAdvanced(memories, { tags: [] })).toHaveLength(4)
  })
  it('filters by source', () => {
    expect(filterItemsAdvanced(memories, { source: 'mora' })).toHaveLength(2)
  })
  it('null source matches everything', () => {
    expect(filterItemsAdvanced(memories, { source: null })).toHaveLength(4)
  })
  it('combines type and tag', () => {
    expect(filterItemsAdvanced(memories, { type: 'note', tags: ['focus'] })).toHaveLength(1)
  })
  it('combines source and tag', () => {
    expect(filterItemsAdvanced(memories, { source: 'mora', tags: ['focus'] })).toHaveLength(1)
  })
  it('tag matching is case-insensitive', () => {
    expect(filterItemsAdvanced(memories, { tags: ['FOCUS'] })).toHaveLength(2)
  })
  it('returns empty array when nothing matches', () => {
    expect(filterItemsAdvanced(memories, { tags: ['nonexistent'] })).toHaveLength(0)
  })
  it('does not mutate input array', () => {
    const copy = [...memories]
    filterItemsAdvanced(memories, { type: 'note' })
    expect(memories).toEqual(copy)
  })
})
