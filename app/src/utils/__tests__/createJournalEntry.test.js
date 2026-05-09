import { describe, it, expect } from 'vitest'
import { createJournalEntry } from '../createJournalEntry.js'

describe('createJournalEntry', () => {
  it('sets type to journal', () => {
    expect(createJournalEntry('Hello world').type).toBe('journal')
  })

  it('sets source to mora', () => {
    expect(createJournalEntry('Hello world').source).toBe('mora')
  })

  it('sets url to null', () => {
    expect(createJournalEntry('Hello world').url).toBeNull()
  })

  it('stores full text in body', () => {
    expect(createJournalEntry('Hello world').body).toBe('Hello world')
  })

  it('createdAt is a number', () => {
    expect(typeof createJournalEntry('Hello world').createdAt).toBe('number')
  })

  it('auto-titles from first 5 non-stopword words', () => {
    const entry = createJournalEntry('I was thinking about the meaning of creativity today')
    expect(entry.title).toBe('Thinking Meaning Creativity Today')
  })

  it('title-cases each word in title', () => {
    const entry = createJournalEntry('building something new and great')
    expect(entry.title).toBe('Building Something New Great')
  })

  it('truncates title at 60 chars with ellipsis', () => {
    const entry = createJournalEntry('extraordinary magnificent spectacular phenomenal incredible outstanding remarkable')
    expect(entry.title.length).toBeLessThanOrEqual(63)
    expect(entry.title.endsWith('…')).toBe(true)
  })

  it('returns Untitled when all words are stopwords', () => {
    expect(createJournalEntry('the and for with this').title).toBe('Untitled')
  })

  it('returns Untitled for empty string', () => {
    expect(createJournalEntry('').title).toBe('Untitled')
  })

  it('returns Untitled for whitespace-only input', () => {
    expect(createJournalEntry('   ').title).toBe('Untitled')
  })

  it('empty input sets body to empty string', () => {
    expect(createJournalEntry('').body).toBe('')
  })

  it('auto-extracts tags from body text', () => {
    const entry = createJournalEntry('creativity design philosophy focus')
    expect(Array.isArray(entry.tags)).toBe(true)
    expect(entry.tags.length).toBeGreaterThan(0)
  })

  it('sets schemaVersion to 2', () => {
    expect(createJournalEntry('hello').schemaVersion).toBe(2)
  })

  it('id is a string', () => {
    expect(typeof createJournalEntry('hello').id).toBe('string')
  })
})
