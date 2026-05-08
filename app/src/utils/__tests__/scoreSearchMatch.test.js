import { describe, it, expect } from 'vitest'
import { scoreSearchMatch, semanticSearch } from '../scoreSearchMatch'

const makeItem = (overrides = {}) => ({
  id: 'i1',
  title: 'Test Title',
  body: '',
  tags: [],
  source: 'web',
  type: 'link',
  createdAt: Date.now(),
  ...overrides,
})

describe('scoreSearchMatch', () => {
  it('returns 0 for empty query', () => {
    expect(scoreSearchMatch('', makeItem())).toBe(0)
    expect(scoreSearchMatch('   ', makeItem())).toBe(0)
  })

  it('returns 0 when no text matches', () => {
    const item = makeItem({ title: 'React hooks', body: '', tags: [], source: 'web', type: 'link' })
    const score = scoreSearchMatch('python django', item)
    expect(score).toBe(0)
  })

  it('gives +5 for exact phrase match', () => {
    const item = makeItem({ title: 'deep learning tutorial', body: '', tags: [], source: 'web', type: 'link' })
    const score = scoreSearchMatch('deep learning', item)
    // phrase match (+5) + word matches (+3 each for "deep" and "learning") + recency
    expect(score).toBeGreaterThanOrEqual(11)
    expect(score).toBeLessThan(25)
  })

  it('gives +3 per exact word match (no phrase)', () => {
    const item = makeItem({ title: 'react patterns guide', createdAt: new Date('2000-01-01').getTime() })
    // "react hooks": phrase not in text, "react" exact word (+3), "hooks" absent (0), recency ≈ 0
    const score = scoreSearchMatch('react hooks', item)
    expect(score).toBeGreaterThanOrEqual(3)
    expect(score).toBeLessThan(5)
  })

  it('gives +1 for partial word match (substring)', () => {
    const item = makeItem({ title: 'redesigning interfaces', createdAt: new Date('2000-01-01').getTime() })
    // "design tools": phrase not in text, "design" partial in "redesigning" (+1), "tools" absent (0), recency ≈ 0
    const score = scoreSearchMatch('design tools', item)
    expect(score).toBeGreaterThanOrEqual(1)
    expect(score).toBeLessThan(3)
  })

  it('scores across all memory text fields (tags, body, source)', () => {
    // match is ONLY in tags — title/body/source have no match
    const item = makeItem({ title: 'My Item', body: '', tags: ['machine learning'], source: 'web', type: 'link' })
    const score = scoreSearchMatch('machine learning', item)
    expect(score).toBeGreaterThan(0)
  })

  it('is case-insensitive', () => {
    const item = makeItem({ title: 'Deep Learning Basics', body: '', tags: [], source: 'web', type: 'link' })
    const lower = scoreSearchMatch('deep learning', item)
    const upper = scoreSearchMatch('DEEP LEARNING', item)
    expect(lower).toBe(upper)
  })

  it('strips punctuation from query and text', () => {
    const item = makeItem({ title: 'React, hooks & patterns' })
    // after stripping punctuation: phrase "react hooks" found, both words match → ≥11
    const score = scoreSearchMatch('react hooks', item)
    expect(score).toBeGreaterThanOrEqual(11)
  })

  it('adds recency boost (recent item scores higher than old)', () => {
    const recentItem = makeItem({ title: 'same title here', createdAt: Date.now() })
    const oldItem = makeItem({ title: 'same title here', createdAt: Date.now() - 100 * 86400000 })
    expect(scoreSearchMatch('same title', recentItem)).toBeGreaterThan(scoreSearchMatch('same title', oldItem))
  })
})

describe('semanticSearch', () => {
  it('returns items unchanged when query is empty', () => {
    const items = [makeItem({ id: '1' }), makeItem({ id: '2' })]
    expect(semanticSearch('', items)).toBe(items)
    expect(semanticSearch('   ', items)).toBe(items)
  })

  it('filters out items with score <= 0', () => {
    const match = makeItem({ id: '1', title: 'react hooks tutorial' })
    const noMatch = makeItem({ id: '2', title: 'cooking pasta recipe' })
    const result = semanticSearch('react', [match, noMatch])
    expect(result.map(i => i.id)).toContain('1')
    expect(result.map(i => i.id)).not.toContain('2')
  })

  it('excludes zero-score items (no text match)', () => {
    const noTextMatch = makeItem({ id: 'nomatch', title: 'cooking pasta recipe', body: '', tags: [], source: 'food', type: 'note' })
    const result = semanticSearch('react', [noTextMatch])
    expect(result).toHaveLength(0)
  })

  it('sorts results by score descending', () => {
    const strong = makeItem({ id: 'strong', title: 'react hooks deep dive react' })
    const weak = makeItem({ id: 'weak', title: 'some react mention' })
    const result = semanticSearch('react hooks', [weak, strong])
    expect(result[0].id).toBe('strong')
  })

  it('returns plain items (not score wrappers)', () => {
    const item = makeItem({ id: '1', title: 'react patterns' })
    const result = semanticSearch('react', [item])
    expect(result[0]).not.toHaveProperty('score')
    expect(result[0]).toHaveProperty('title')
  })
})
