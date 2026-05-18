import { describe, it, expect } from 'vitest'
import { parseMemoryQuery } from '../parseMemoryQuery.js'

const DEFAULTS = { intent: 'recall', entities: [], themes: [], sourceFilters: [], timeFilters: null }

describe('parseMemoryQuery', () => {
  describe('guard cases', () => {
    it('returns recall defaults for null', () => {
      expect(parseMemoryQuery(null)).toEqual(DEFAULTS)
    })

    it('returns recall defaults for empty string', () => {
      expect(parseMemoryQuery('')).toEqual(DEFAULTS)
    })

    it('returns recall defaults for whitespace', () => {
      expect(parseMemoryQuery('   ')).toEqual(DEFAULTS)
    })

    it('always returns all five keys', () => {
      const r = parseMemoryQuery('something')
      expect(r).toHaveProperty('intent')
      expect(r).toHaveProperty('entities')
      expect(r).toHaveProperty('themes')
      expect(r).toHaveProperty('sourceFilters')
      expect(r).toHaveProperty('timeFilters')
    })
  })

  describe('recall intent', () => {
    it('classifies ambiguous query as recall', () => {
      expect(parseMemoryQuery('what was that startup thing').intent).toBe('recall')
    })

    it('classifies content query as recall', () => {
      expect(parseMemoryQuery('show design memories').intent).toBe('recall')
    })
  })

  describe('trend intent', () => {
    it('detects "lately" trigger', () => {
      expect(parseMemoryQuery('what have I been thinking about lately').intent).toBe('trend')
    })

    it('detects "a lot" trigger', () => {
      expect(parseMemoryQuery('what am I saving a lot').intent).toBe('trend')
    })

    it('detects "been saving" trigger', () => {
      expect(parseMemoryQuery('what have I been saving recently').intent).toBe('trend')
    })
  })

  describe('related intent', () => {
    it('detects "related"', () => {
      expect(parseMemoryQuery('anything related').intent).toBe('related')
    })

    it('detects "similar"', () => {
      expect(parseMemoryQuery('show similar things').intent).toBe('related')
    })

    it('detects "more like"', () => {
      expect(parseMemoryQuery('more like this').intent).toBe('related')
    })
  })

  describe('source-specific intent', () => {
    it('detects source + entity', () => {
      expect(parseMemoryQuery('startup videos').intent).toBe('source-specific')
    })

    it('normalizes "videos" to youtube', () => {
      expect(parseMemoryQuery('startup videos').sourceFilters).toContain('youtube')
    })

    it('detects youtube + topic', () => {
      const r = parseMemoryQuery('youtube design ideas')
      expect(r.intent).toBe('source-specific')
      expect(r.sourceFilters).toContain('youtube')
    })

    it('detects instagram + theme', () => {
      const r = parseMemoryQuery('instagram art')
      expect(r.intent).toBe('source-specific')
      expect(r.sourceFilters).toContain('instagram')
    })
  })

  describe('time-based intent', () => {
    it('detects "recent"', () => {
      const r = parseMemoryQuery('recent')
      expect(r.intent).toBe('time-based')
      expect(r.timeFilters).toEqual({ period: 'recent' })
    })

    it('detects "last month"', () => {
      const r = parseMemoryQuery('last month')
      expect(r.intent).toBe('time-based')
      expect(r.timeFilters).toEqual({ period: 'month' })
    })

    it('detects "this week"', () => {
      const r = parseMemoryQuery('this week')
      expect(r.intent).toBe('time-based')
      expect(r.timeFilters).toEqual({ period: 'week' })
    })

    it('detects "last year"', () => {
      const r = parseMemoryQuery('last year')
      expect(r.intent).toBe('time-based')
      expect(r.timeFilters).toEqual({ period: 'year' })
    })
  })

  describe('entity extraction', () => {
    it('extracts proper names', () => {
      const r = parseMemoryQuery('Madhuri Dixit')
      expect(r.entities).toContain('madhuri')
      expect(r.entities).toContain('dixit')
    })

    it('extracts brand names', () => {
      expect(parseMemoryQuery('OpenAI').entities).toContain('openai')
    })

    it('caps entities at 3', () => {
      const r = parseMemoryQuery('alpha bravo charlie delta epsilon')
      expect(r.entities.length).toBeLessThanOrEqual(3)
    })

    it('excludes tokens shorter than 4 chars', () => {
      const r = parseMemoryQuery('big red car')
      expect(r.entities).not.toContain('big')
      expect(r.entities).not.toContain('red')
      expect(r.entities).not.toContain('car')
    })
  })

  describe('theme lifting', () => {
    it('lifts "startup" to Entrepreneurship', () => {
      expect(parseMemoryQuery('startup').themes).toContain('Entrepreneurship')
    })

    it('lifts "money" to multiple themes', () => {
      expect(parseMemoryQuery('money').themes.length).toBeGreaterThan(0)
    })

    it('lifts "design" to Design', () => {
      expect(parseMemoryQuery('design').themes).toContain('Design')
    })

    it('returns empty themes for unknown words', () => {
      expect(parseMemoryQuery('zxqwerty').themes).toEqual([])
    })
  })

  describe('filler word suppression', () => {
    it('query stop words do not become entities', () => {
      const r = parseMemoryQuery('show me what you find')
      expect(r.entities).not.toContain('show')
      expect(r.entities).not.toContain('what')
      expect(r.entities).not.toContain('find')
    })

    it('time stop words do not become entities', () => {
      const r = parseMemoryQuery('last week ago')
      expect(r.entities).not.toContain('last')
      expect(r.entities).not.toContain('week')
      expect(r.entities).not.toContain('ago')
    })

    it('source tokens do not become entities', () => {
      const r = parseMemoryQuery('youtube videos podcast')
      expect(r.entities).not.toContain('youtube')
      expect(r.entities).not.toContain('videos')
      expect(r.entities).not.toContain('podcast')
    })
  })

  describe('mixed queries', () => {
    it('extracts source, time, and entity together', () => {
      const r = parseMemoryQuery('show startup videos from youtube last month')
      expect(r.sourceFilters).toContain('youtube')
      expect(r.timeFilters).toEqual({ period: 'month' })
      expect(r.entities).toContain('startup')
    })

    it('intent is source-specific when source + content present', () => {
      expect(parseMemoryQuery('startup videos from last month').intent).toBe('source-specific')
    })

    it('multiple themes coexist', () => {
      const r = parseMemoryQuery('startup design')
      expect(r.themes).toContain('Entrepreneurship')
      expect(r.themes).toContain('Design')
    })
  })

  describe('deterministic behavior', () => {
    it('same input yields same output', () => {
      const q = 'startup design youtube last month'
      expect(parseMemoryQuery(q)).toEqual(parseMemoryQuery(q))
    })

    it('case insensitive', () => {
      const lower = parseMemoryQuery('startup')
      const upper = parseMemoryQuery('STARTUP')
      expect(lower.themes).toEqual(upper.themes)
      expect(lower.intent).toBe(upper.intent)
    })

    it('leading and trailing whitespace handled', () => {
      const r1 = parseMemoryQuery('  design  ')
      const r2 = parseMemoryQuery('design')
      expect(r1.intent).toBe(r2.intent)
      expect(r1.themes).toEqual(r2.themes)
    })
  })
})
