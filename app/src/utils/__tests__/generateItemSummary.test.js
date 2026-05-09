import { describe, it, expect } from 'vitest'
import { generateItemSummary } from '../generateItemSummary'

describe('generateItemSummary', () => {
  it('returns empty string for null item', () => {
    expect(generateItemSummary(null)).toBe('')
  })

  it('returns title when no description or body', () => {
    expect(generateItemSummary({ title: 'My Cool Note' })).toBe('My Cool Note')
  })

  it('extracts first sentence from description', () => {
    const item = {
      title: 'Some Title',
      description: 'This is the first sentence. This is the second.',
    }
    expect(generateItemSummary(item)).toBe('This is the first sentence.')
  })

  it('uses body when no description', () => {
    const item = {
      title: 'Some Title',
      body: 'Body first sentence. More text here.',
    }
    expect(generateItemSummary(item)).toBe('Body first sentence.')
  })

  it('prefers description over body', () => {
    const item = {
      title: 'T',
      description: 'Description sentence.',
      body: 'Body sentence.',
    }
    expect(generateItemSummary(item)).toBe('Description sentence.')
  })

  it('falls through to body when description is low-value', () => {
    const item = {
      title: 'T',
      description: 'youtube',
      body: 'Body sentence.',
    }
    expect(generateItemSummary(item)).toBe('Body sentence.')
  })

  it('falls back to title when description is a URL', () => {
    const item = {
      title: 'My Link',
      description: 'https://example.com/some/path',
    }
    expect(generateItemSummary(item)).toBe('My Link')
  })

  it('falls back to title when description is a platform name', () => {
    const item = {
      title: 'Cool Reel',
      description: 'instagram',
    }
    expect(generateItemSummary(item)).toBe('Cool Reel')
  })

  it('falls back to title when description is hashtags only', () => {
    const item = {
      title: 'Post',
      description: '#design #ux #cool',
    }
    expect(generateItemSummary(item)).toBe('Post')
  })

  it('uses full text when no sentence-ending punctuation', () => {
    const item = { title: 'T', description: 'A description without period' }
    expect(generateItemSummary(item)).toBe('A description without period')
  })

  it('collapses multiple spaces', () => {
    const item = { title: 'X', description: 'Too   many    spaces here.' }
    expect(generateItemSummary(item)).toBe('Too many spaces here.')
  })

  it('truncates to 140 chars with ellipsis', () => {
    const long = 'word '.repeat(40).trim()
    const item = { title: 'X', description: long }
    const result = generateItemSummary(item)
    expect(result.length).toBeLessThanOrEqual(140)
    expect(result.endsWith('...')).toBe(true)
  })

  it('appends tag context when tags present', () => {
    const item = {
      title: 'Design Inspiration',
      description: 'Beautiful interface.',
      tags: ['memory', 'systems'],
    }
    expect(generateItemSummary(item)).toBe('Beautiful interface. about memory systems')
  })

  it('uses only first two tags in context', () => {
    const item = {
      title: 'T',
      description: 'Short sentence.',
      tags: ['a', 'b', 'c', 'd'],
    }
    expect(generateItemSummary(item)).toBe('Short sentence. about a b')
  })

  it('skips tag context when tags is empty array', () => {
    const item = {
      title: 'T',
      description: 'Clean sentence.',
      tags: [],
    }
    expect(generateItemSummary(item)).toBe('Clean sentence.')
  })

  it('total with tag context still truncates to 140', () => {
    const long = 'word '.repeat(35).trim()
    const item = { title: 'X', description: long, tags: ['alpha', 'beta'] }
    const result = generateItemSummary(item)
    expect(result.length).toBeLessThanOrEqual(140)
  })
})
