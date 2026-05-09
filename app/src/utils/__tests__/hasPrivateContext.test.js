import { describe, it, expect } from 'vitest'
import { hasPrivateContext } from '../hasPrivateContext'

describe('hasPrivateContext', () => {
  it('returns false for null', () => {
    expect(hasPrivateContext(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(hasPrivateContext(undefined)).toBe(false)
  })

  it('returns false when no private context fields present', () => {
    expect(hasPrivateContext({ id: '1', title: 'Test', tags: [] })).toBe(false)
  })

  it('returns true when privateNote is a non-empty string', () => {
    expect(hasPrivateContext({ privateNote: 'my note' })).toBe(true)
  })

  it('returns false when privateNote is empty string', () => {
    expect(hasPrivateContext({ privateNote: '' })).toBe(false)
  })

  it('returns false when privateNote is null', () => {
    expect(hasPrivateContext({ privateNote: null })).toBe(false)
  })

  it('returns true when memoryType is set', () => {
    expect(hasPrivateContext({ memoryType: 'birthday' })).toBe(true)
  })

  it('returns false when memoryType is null', () => {
    expect(hasPrivateContext({ memoryType: null })).toBe(false)
  })

  it('returns true when memoryDate is set', () => {
    expect(hasPrivateContext({ memoryDate: '2026-06-15' })).toBe(true)
  })

  it('returns false when memoryDate is null', () => {
    expect(hasPrivateContext({ memoryDate: null })).toBe(false)
  })

  it('returns true when only memoryDate present', () => {
    expect(hasPrivateContext({ privateNote: null, memoryType: null, memoryDate: '2026-01-01' })).toBe(true)
  })

  it('returns true when multiple fields present', () => {
    expect(hasPrivateContext({ privateNote: 'note', memoryType: 'anniversary', memoryDate: '2025-03-10' })).toBe(true)
  })
})
