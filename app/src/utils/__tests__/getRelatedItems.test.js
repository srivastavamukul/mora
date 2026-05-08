import { describe, it, expect } from 'vitest'
import { getRelatedItems } from '../getRelatedItems'

const makeItem = (id, tags = [], source = 'mora', type = 'note') => ({
  id, title: `Item ${id}`, tags, source, type, createdAt: Date.now(),
})

describe('getRelatedItems', () => {
  it('returns empty array for null item', () => {
    expect(getRelatedItems(null, [])).toEqual([])
  })

  it('returns empty array when no items match', () => {
    const item = makeItem('1', ['a'], 'spotify', 'song')
    const items = [makeItem('2', ['b'], 'pinterest', 'image'), makeItem('3', ['c'], 'youtube', 'video')]
    expect(getRelatedItems(item, items)).toEqual([])
  })

  it('excludes self', () => {
    const item = makeItem('1', ['focus'])
    const items = [item, makeItem('2', ['focus'])]
    const result = getRelatedItems(item, items)
    expect(result.every(i => i.id !== '1')).toBe(true)
  })

  it('scores +2 per shared tag', () => {
    const item = makeItem('1', ['focus', 'design'])
    const twoTags = makeItem('2', ['focus', 'design'])
    const oneTag = makeItem('3', ['focus'])
    const result = getRelatedItems(item, [item, twoTags, oneTag])
    expect(result[0].id).toBe('2')
    expect(result[1].id).toBe('3')
  })

  it('scores +1 for same source', () => {
    const item = makeItem('1', [], 'spotify', 'song')
    const sameSource = makeItem('2', [], 'spotify', 'image')
    const diffSource = makeItem('3', [], 'pinterest', 'note')
    const result = getRelatedItems(item, [item, sameSource, diffSource])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('scores +1 for same type', () => {
    const item = makeItem('1', [], 'mora', 'song')
    const sameType = makeItem('2', [], 'x', 'song')
    const diffType = makeItem('3', [], 'y', 'note')
    const result = getRelatedItems(item, [item, sameType, diffType])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('returns max 5 items', () => {
    const item = makeItem('1', ['focus'])
    const others = Array.from({ length: 10 }, (_, i) => makeItem(String(i + 2), ['focus']))
    const result = getRelatedItems(item, [item, ...others])
    expect(result).toHaveLength(5)
  })
})
