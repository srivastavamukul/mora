import { describe, it, expect } from 'vitest'
import { normalizeItem } from '../normalizeCapture'
import { migrateItem } from '../migrateItem'

describe('normalizeItem - privateNote', () => {
  it('defaults privateNote to null when not in formData', () => {
    const result = normalizeItem({ url: 'https://example.com', title: 'Test' })
    expect(result.privateNote).toBeNull()
  })

  it('preserves privateNote from formData', () => {
    const result = normalizeItem({ url: 'https://example.com', title: 'Test', privateNote: 'my annotation' })
    expect(result.privateNote).toBe('my annotation')
  })

  it('preserves privateNote from existingItem when formData has none', () => {
    const existing = { id: '1', url: 'https://example.com', title: 'Old', privateNote: 'old note', createdAt: 1000, schemaVersion: 2, metadata: {}, raw: {} }
    const result = normalizeItem({ url: 'https://example.com', title: 'Updated' }, existing)
    expect(result.privateNote).toBe('old note')
  })

  it('formData privateNote overwrites existingItem privateNote', () => {
    const existing = { id: '1', url: 'https://example.com', title: 'Old', privateNote: 'old note', createdAt: 1000, schemaVersion: 2, metadata: {}, raw: {} }
    const result = normalizeItem({ url: 'https://example.com', title: 'Updated', privateNote: 'new note' }, existing)
    expect(result.privateNote).toBe('new note')
  })
})

describe('migrateItem - privateNote', () => {
  it('defaults privateNote to null for old items without the field', () => {
    const old = { url: 'https://example.com', title: 'Old Item', createdAt: 1000 }
    const result = migrateItem(old)
    expect(result.privateNote).toBeNull()
  })

  it('preserves existing privateNote during migration', () => {
    const item = { url: 'https://example.com', title: 'Item', privateNote: 'keep me', createdAt: 1000 }
    const result = migrateItem(item)
    expect(result.privateNote).toBe('keep me')
  })
})
