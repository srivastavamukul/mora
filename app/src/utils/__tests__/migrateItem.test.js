import { describe, it, expect } from 'vitest'
import { migrateItem } from '../migrateItem.js'

describe('migrateItem', () => {
  it('returns null for null input', () => {
    expect(migrateItem(null)).toBeNull()
  })

  it('returns null for non-journal item with null url', () => {
    expect(migrateItem({ type: 'note', title: 'Test' })).toBeNull()
  })

  it('returns null for non-journal item with numeric url', () => {
    expect(migrateItem({ type: 'note', url: 123 })).toBeNull()
  })

  it('allows journal item with null url through migration', () => {
    const result = migrateItem({ type: 'journal', title: 'My thought', body: 'Some text' })
    expect(result).not.toBeNull()
    expect(result.type).toBe('journal')
    expect(result.url).toBeNull()
  })

  it('preserves journal url as null after migration', () => {
    const result = migrateItem({ type: 'journal', title: 'Entry', url: null })
    expect(result.url).toBeNull()
  })

  it('migrates a normal item with a valid url', () => {
    const result = migrateItem({ type: 'note', url: 'https://example.com', title: 'Test' })
    expect(result).not.toBeNull()
    expect(result.url).toBe('https://example.com')
  })

  it('defaults collection to null when absent', () => {
    const result = migrateItem({ type: 'link', url: 'https://example.com', title: 'Test' })
    expect(result.collection).toBeNull()
  })

  it('preserves existing collection string', () => {
    const result = migrateItem({ type: 'link', url: 'https://example.com', title: 'Test', collection: 'Ideas' })
    expect(result.collection).toBe('Ideas')
  })

  // Malformed data guards
  it('replaces NaN createdAt with current timestamp', () => {
    const before = Date.now()
    const result = migrateItem({ type: 'journal', title: 'x', createdAt: NaN })
    expect(result.createdAt).toBeGreaterThanOrEqual(before)
    expect(isFinite(result.createdAt)).toBe(true)
  })

  it('replaces Infinity createdAt with current timestamp', () => {
    const result = migrateItem({ type: 'journal', title: 'x', createdAt: Infinity })
    expect(isFinite(result.createdAt)).toBe(true)
  })

  it('replaces NaN updatedAt with null', () => {
    const result = migrateItem({ type: 'journal', title: 'x', updatedAt: NaN })
    expect(result.updatedAt).toBeNull()
  })

  it('filters non-string values out of tags array', () => {
    const result = migrateItem({ type: 'journal', title: 'x', tags: ['valid', 42, null, undefined, 'also-valid'] })
    expect(result.tags).toEqual(['valid', 'also-valid'])
  })

  it('coerces non-array tags to empty array', () => {
    const result = migrateItem({ type: 'journal', title: 'x', tags: 'notanarray' })
    expect(result.tags).toEqual([])
  })

  it('filters empty string tags', () => {
    const result = migrateItem({ type: 'journal', title: 'x', tags: ['good', '', '  '] })
    expect(result.tags).not.toContain('')
  })

  it('defaults metadata to empty object when malformed', () => {
    const result = migrateItem({ type: 'journal', title: 'x', metadata: 'bad' })
    expect(result.metadata).toBeDefined()
    expect(typeof result.metadata).toBe('object')
  })

  it('returns null for non-object primitive input', () => {
    expect(migrateItem('string')).toBeNull()
    expect(migrateItem(42)).toBeNull()
  })
})
