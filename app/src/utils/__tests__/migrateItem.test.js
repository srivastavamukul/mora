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
})
