import { describe, it, expect } from 'vitest'
import { exportMoraData } from '../exportMoraData'

const ITEM = {
  id: 'abc',
  title: 'Test',
  url: 'https://example.com',
  type: 'link',
  source: 'web',
  tags: ['a'],
  schemaVersion: 2,
  createdAt: 1000000,
  updatedAt: null,
}

const SOURCE = { id: 'web', name: 'Web', status: 'connected' }
const FLAGS = { abc: { favorite: true } }

describe('exportMoraData', () => {
  it('returns valid JSON string', () => {
    const result = exportMoraData({ items: [ITEM], sources: [SOURCE], flags: FLAGS })
    expect(() => JSON.parse(result)).not.toThrow()
  })

  it('sets schemaVersion to 2', () => {
    const parsed = JSON.parse(exportMoraData({ items: [], sources: [], flags: {} }))
    expect(parsed.schemaVersion).toBe(2)
  })

  it('includes exportedAt as ISO string', () => {
    const parsed = JSON.parse(exportMoraData({ items: [], sources: [], flags: {} }))
    expect(typeof parsed.exportedAt).toBe('string')
    expect(() => new Date(parsed.exportedAt)).not.toThrow()
    expect(new Date(parsed.exportedAt).toISOString()).toBe(parsed.exportedAt)
  })

  it('preserves items array', () => {
    const parsed = JSON.parse(exportMoraData({ items: [ITEM], sources: [], flags: {} }))
    expect(parsed.items).toHaveLength(1)
    expect(parsed.items[0].id).toBe('abc')
  })

  it('preserves sources array', () => {
    const parsed = JSON.parse(exportMoraData({ items: [], sources: [SOURCE], flags: {} }))
    expect(parsed.sources[0].id).toBe('web')
  })

  it('preserves flags object', () => {
    const parsed = JSON.parse(exportMoraData({ items: [], sources: [], flags: FLAGS }))
    expect(parsed.flags.abc.favorite).toBe(true)
  })

  it('falls back gracefully on missing inputs', () => {
    const parsed = JSON.parse(exportMoraData({}))
    expect(Array.isArray(parsed.items)).toBe(true)
    expect(Array.isArray(parsed.sources)).toBe(true)
    expect(typeof parsed.flags).toBe('object')
  })

  it('data fields are stable for same input', () => {
    const input = { items: [ITEM], sources: [SOURCE], flags: FLAGS }
    const a = exportMoraData(input)
    const b = exportMoraData(input)
    // exportedAt differs per call by design; only data fields must be stable
    const pa = JSON.parse(a)
    const pb = JSON.parse(b)
    expect(pa.items).toEqual(pb.items)
    expect(pa.sources).toEqual(pb.sources)
    expect(pa.flags).toEqual(pb.flags)
  })
})
