import { describe, it, expect } from 'vitest'
import { importMoraData } from '../importMoraData'

const VALID_ITEM = {
  id: 'abc',
  title: 'Test',
  url: 'https://example.com',
  type: 'link',
  source: 'web',
  tags: [],
  createdAt: Date.now(),
  updatedAt: null,
  thumbnail: '',
  description: '',
  metadata: {},
  raw: {},
}

const VALID_SOURCE = { id: 'web', name: 'Web', status: 'connected' }
const VALID_FLAGS = { abc: { favorite: true } }

function makeBackup(overrides = {}) {
  return JSON.stringify({
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    items: [VALID_ITEM],
    sources: [VALID_SOURCE],
    flags: VALID_FLAGS,
    ...overrides,
  })
}

describe('importMoraData', () => {
  it('returns ok:true for valid backup', () => {
    const result = importMoraData(makeBackup())
    expect(result.ok).toBe(true)
    expect(result.data).toBeDefined()
  })

  it('returns ok:false for invalid JSON', () => {
    const result = importMoraData('not json }{')
    expect(result.ok).toBe(false)
    expect(typeof result.error).toBe('string')
  })

  it('returns ok:false for null JSON value', () => {
    expect(importMoraData('null').ok).toBe(false)
  })

  it('returns ok:false for non-object JSON', () => {
    expect(importMoraData('"hello"').ok).toBe(false)
    expect(importMoraData('42').ok).toBe(false)
  })

  it('returns empty items when items field missing', () => {
    const result = importMoraData(makeBackup({ items: undefined }))
    expect(result.ok).toBe(true)
    expect(result.data.items).toEqual([])
  })

  it('returns empty sources when sources field missing', () => {
    const result = importMoraData(makeBackup({ sources: undefined }))
    expect(result.ok).toBe(true)
    expect(result.data.sources).toEqual([])
  })

  it('returns empty flags when flags field missing', () => {
    const result = importMoraData(makeBackup({ flags: undefined }))
    expect(result.ok).toBe(true)
    expect(result.data.flags).toEqual({})
  })

  it('runs migrateItem on each item', () => {
    const result = importMoraData(makeBackup())
    expect(result.ok).toBe(true)
    expect(result.data.items[0].schemaVersion).toBe(2)
  })

  it('filters out non-object items', () => {
    const json = makeBackup({ items: [null, 'bad', 42, VALID_ITEM] })
    const result = importMoraData(json)
    expect(result.ok).toBe(true)
    expect(result.data.items).toHaveLength(1)
  })

  it('filters items that fail migrateItem (no url, non-journal)', () => {
    const bad = { ...VALID_ITEM, url: null, type: 'link' }
    const json = makeBackup({ items: [bad] })
    const result = importMoraData(json)
    expect(result.ok).toBe(true)
    expect(result.data.items).toHaveLength(0)
  })

  it('allows journal items with null url', () => {
    const journal = { ...VALID_ITEM, url: null, type: 'journal' }
    const json = makeBackup({ items: [journal] })
    const result = importMoraData(json)
    expect(result.ok).toBe(true)
    expect(result.data.items).toHaveLength(1)
  })

  it('filters sources without string id', () => {
    const json = makeBackup({ sources: [{ name: 'No ID' }, VALID_SOURCE] })
    const result = importMoraData(json)
    expect(result.ok).toBe(true)
    expect(result.data.sources).toHaveLength(1)
    expect(result.data.sources[0].id).toBe('web')
  })

  it('filters non-object flag entries', () => {
    const json = makeBackup({ flags: { abc: { favorite: true }, bad: 'nope', also: null } })
    const result = importMoraData(json)
    expect(result.ok).toBe(true)
    expect(Object.keys(result.data.flags)).toEqual(['abc'])
  })

  it('returns empty flags when flags is array (not object)', () => {
    const json = makeBackup({ flags: [] })
    const result = importMoraData(json)
    expect(result.ok).toBe(true)
    expect(result.data.flags).toEqual({})
  })

  it('data.items, data.sources, data.flags always present on ok:true', () => {
    const result = importMoraData(makeBackup())
    expect(Array.isArray(result.data.items)).toBe(true)
    expect(Array.isArray(result.data.sources)).toBe(true)
    expect(typeof result.data.flags).toBe('object')
  })
})
