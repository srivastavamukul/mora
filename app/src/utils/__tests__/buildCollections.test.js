import { describe, it, expect } from 'vitest'
import { buildCollections } from '../buildCollections'

describe('buildCollections', () => {
  it('returns empty array for empty items', () => {
    expect(buildCollections([])).toEqual([])
  })

  it('returns empty array when no items have collections', () => {
    const items = [
      { id: '1', title: 'A', collection: null, createdAt: 1000 },
      { id: '2', title: 'B', collection: '', createdAt: 2000 },
      { id: '3', title: 'C', createdAt: 3000 },
    ]
    expect(buildCollections(items)).toEqual([])
  })

  it('groups items by collection name', () => {
    const items = [
      { id: '1', title: 'A', collection: 'Ideas', createdAt: 1000 },
      { id: '2', title: 'B', collection: 'Ideas', createdAt: 2000 },
      { id: '3', title: 'C', collection: 'Design', createdAt: 3000 },
    ]
    const result = buildCollections(items)
    expect(result).toHaveLength(2)
    const ideas = result.find(c => c.name === 'Ideas')
    expect(ideas.count).toBe(2)
    expect(ideas.items).toHaveLength(2)
    const design = result.find(c => c.name === 'Design')
    expect(design.count).toBe(1)
  })

  it('ignores items with null collection', () => {
    const items = [
      { id: '1', title: 'A', collection: 'Travel', createdAt: 1000 },
      { id: '2', title: 'B', collection: null, createdAt: 2000 },
    ]
    const result = buildCollections(items)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Travel')
    expect(result[0].count).toBe(1)
  })

  it('ignores items with empty string collection', () => {
    const items = [
      { id: '1', title: 'A', collection: 'Personal', createdAt: 1000 },
      { id: '2', title: 'B', collection: '', createdAt: 2000 },
      { id: '3', title: 'C', collection: '   ', createdAt: 3000 },
    ]
    const result = buildCollections(items)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Personal')
  })

  it('sets latestTimestamp to max createdAt in group', () => {
    const items = [
      { id: '1', title: 'A', collection: 'Research', createdAt: 1000 },
      { id: '2', title: 'B', collection: 'Research', createdAt: 5000 },
      { id: '3', title: 'C', collection: 'Research', createdAt: 3000 },
    ]
    const result = buildCollections(items)
    expect(result[0].latestTimestamp).toBe(5000)
  })

  it('sorts collections by latestTimestamp DESC', () => {
    const items = [
      { id: '1', title: 'A', collection: 'Ideas', createdAt: 1000 },
      { id: '2', title: 'B', collection: 'Design', createdAt: 9000 },
      { id: '3', title: 'C', collection: 'Travel', createdAt: 5000 },
    ]
    const result = buildCollections(items)
    expect(result[0].name).toBe('Design')
    expect(result[1].name).toBe('Travel')
    expect(result[2].name).toBe('Ideas')
  })

  it('returns correct shape for each collection', () => {
    const items = [{ id: '1', title: 'X', collection: 'Personal', createdAt: 42 }]
    const result = buildCollections(items)
    expect(result[0]).toMatchObject({ name: 'Personal', count: 1, latestTimestamp: 42 })
    expect(Array.isArray(result[0].items)).toBe(true)
  })
})
