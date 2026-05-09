import { describe, it, expect } from 'vitest'
import { getItemMemoryText } from '../getItemMemoryText'

describe('getItemMemoryText', () => {
  it('returns empty string for null', () => {
    expect(getItemMemoryText(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(getItemMemoryText(undefined)).toBe('')
  })

  it('combines title, description, tags, source, type lowercased', () => {
    const item = {
      title: 'Neo-Tokyo Palette',
      description: 'A visual mood',
      tags: ['aesthetic', 'neo-tokyo'],
      source: 'pinterest',
      type: 'image',
    }
    const result = getItemMemoryText(item)
    expect(result).toContain('neo-tokyo palette')
    expect(result).toContain('a visual mood')
    expect(result).toContain('aesthetic neo-tokyo')
    expect(result).toContain('pinterest')
    expect(result).toContain('image')
  })

  it('falls back to body when description is absent', () => {
    const item = { title: 'Test', body: 'body text', tags: [], source: 'mora', type: 'note' }
    expect(getItemMemoryText(item)).toContain('body text')
  })

  it('handles missing fields without throwing', () => {
    expect(() => getItemMemoryText({})).not.toThrow()
    expect(getItemMemoryText({})).toBe('')
  })

  it('output is lowercase', () => {
    const item = { title: 'UPPER CASE', tags: ['TAG'], source: 'MORA', type: 'NOTE' }
    const result = getItemMemoryText(item)
    expect(result).toBe(result.toLowerCase())
  })

  it('includes privateNote in memory text', () => {
    const item = { title: 'Test', tags: [], source: 'web', type: 'link', privateNote: 'Met her at the Tokyo meetup' }
    expect(getItemMemoryText(item)).toContain('met her at the tokyo meetup')
  })

  it('omits privateNote when null', () => {
    const item = { title: 'Test', tags: [], source: 'web', type: 'link', privateNote: null }
    const result = getItemMemoryText(item)
    expect(result).not.toContain('null')
  })

  it('omits privateNote when empty string', () => {
    const item = { title: 'Only Title', tags: [], source: 'web', type: 'link', privateNote: '' }
    const result = getItemMemoryText(item)
    expect(result.trim()).toBe('only title web link')
  })
})
