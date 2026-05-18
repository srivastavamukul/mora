import { describe, it, expect } from 'vitest'
import { buildMemoryCompanionResponse } from '../buildMemoryCompanionResponse.js'

function ctx(overrides = {}) {
  return {
    relevantMemories: [],
    relatedJournals: [],
    themes: [],
    sources: [],
    ...overrides,
  }
}

function mems(n) {
  return Array.from({ length: n }, (_, i) => ({ id: `m${i}` }))
}

describe('buildMemoryCompanionResponse', () => {
  describe('guard cases', () => {
    it('returns empty reflections for null', () => {
      expect(buildMemoryCompanionResponse(null)).toEqual({ reflections: [] })
    })

    it('returns empty reflections for undefined', () => {
      expect(buildMemoryCompanionResponse(undefined)).toEqual({ reflections: [] })
    })

    it('returns empty reflections for non-object', () => {
      expect(buildMemoryCompanionResponse('string')).toEqual({ reflections: [] })
      expect(buildMemoryCompanionResponse(42)).toEqual({ reflections: [] })
    })

    it('returns empty reflections for empty context', () => {
      expect(buildMemoryCompanionResponse(ctx())).toEqual({ reflections: [] })
    })

    it('always returns reflections array', () => {
      const result = buildMemoryCompanionResponse(ctx())
      expect(Array.isArray(result.reflections)).toBe(true)
    })

    it('handles missing fields gracefully', () => {
      expect(() => buildMemoryCompanionResponse({})).not.toThrow()
      const result = buildMemoryCompanionResponse({})
      expect(Array.isArray(result.reflections)).toBe(true)
    })
  })

  describe('theme repetition reflection', () => {
    it('fires when theme present and 2+ memories', () => {
      const result = buildMemoryCompanionResponse(ctx({
        themes: ['design'],
        relevantMemories: mems(2),
      }))
      expect(result.reflections.some(r => r.toLowerCase().includes('design'))).toBe(true)
    })

    it('suppressed with only 1 memory', () => {
      const result = buildMemoryCompanionResponse(ctx({
        themes: ['design'],
        relevantMemories: mems(1),
      }))
      expect(result.reflections.some(r => r.toLowerCase().includes('design'))).toBe(false)
    })

    it('suppressed when themes empty', () => {
      const result = buildMemoryCompanionResponse(ctx({
        themes: [],
        relevantMemories: mems(3),
      }))
      expect(result.reflections).toEqual([])
    })

    it('capitalizes theme label', () => {
      const result = buildMemoryCompanionResponse(ctx({
        themes: ['startup'],
        relevantMemories: mems(2),
      }))
      expect(result.reflections[0]).toMatch(/^Startup/)
    })
  })

  describe('journal depth reflection', () => {
    it('fires when 2+ journals present', () => {
      const result = buildMemoryCompanionResponse(ctx({
        relatedJournals: mems(2),
      }))
      expect(result.reflections.some(r => r.toLowerCase().includes('journal'))).toBe(true)
    })

    it('fires when 3 journals present', () => {
      const result = buildMemoryCompanionResponse(ctx({
        relatedJournals: mems(3),
      }))
      expect(result.reflections.some(r => r.toLowerCase().includes('journal'))).toBe(true)
    })

    it('suppressed with only 1 journal', () => {
      const result = buildMemoryCompanionResponse(ctx({
        relatedJournals: mems(1),
      }))
      expect(result.reflections.some(r => r.toLowerCase().includes('journal'))).toBe(false)
    })

    it('suppressed with 0 journals', () => {
      const result = buildMemoryCompanionResponse(ctx({
        relatedJournals: [],
      }))
      expect(result.reflections.some(r => r.toLowerCase().includes('journal'))).toBe(false)
    })
  })

  describe('source concentration reflection', () => {
    it('fires when source present and 3+ memories', () => {
      const result = buildMemoryCompanionResponse(ctx({
        sources: ['twitter'],
        relevantMemories: mems(3),
      }))
      expect(result.reflections.some(r => r.toLowerCase().includes('twitter'))).toBe(true)
    })

    it('suppressed with fewer than 3 memories', () => {
      const result = buildMemoryCompanionResponse(ctx({
        sources: ['twitter'],
        relevantMemories: mems(2),
      }))
      expect(result.reflections.some(r => r.toLowerCase().includes('twitter'))).toBe(false)
    })

    it('suppressed when sources empty', () => {
      const result = buildMemoryCompanionResponse(ctx({
        sources: [],
        relevantMemories: mems(5),
      }))
      expect(result.reflections).toEqual([])
    })

    it('uses first source in reflection', () => {
      const result = buildMemoryCompanionResponse(ctx({
        sources: ['medium', 'twitter'],
        relevantMemories: mems(4),
      }))
      expect(result.reflections.some(r => r.includes('medium'))).toBe(true)
    })
  })

  describe('reflection cap', () => {
    it('never exceeds 3 reflections', () => {
      const result = buildMemoryCompanionResponse(ctx({
        themes: ['design'],
        relatedJournals: mems(3),
        sources: ['twitter'],
        relevantMemories: mems(5),
      }))
      expect(result.reflections.length).toBeLessThanOrEqual(3)
    })

    it('returns exactly 3 when all signals strong', () => {
      const result = buildMemoryCompanionResponse(ctx({
        themes: ['design'],
        relatedJournals: mems(2),
        sources: ['twitter'],
        relevantMemories: mems(5),
      }))
      expect(result.reflections.length).toBe(3)
    })
  })

  describe('weak signal suppression', () => {
    it('returns empty when all signals below threshold', () => {
      const result = buildMemoryCompanionResponse(ctx({
        themes: ['design'],
        relevantMemories: mems(1),
        relatedJournals: mems(1),
        sources: ['twitter'],
      }))
      expect(result.reflections.length).toBe(0)
    })

    it('returns only strong signals when mixed', () => {
      const result = buildMemoryCompanionResponse(ctx({
        themes: [],
        relatedJournals: mems(2),
        sources: [],
        relevantMemories: mems(1),
      }))
      expect(result.reflections.length).toBe(1)
      expect(result.reflections[0]).toMatch(/journal/i)
    })
  })

  describe('mixed signal combinations', () => {
    it('theme + journal, no source', () => {
      const result = buildMemoryCompanionResponse(ctx({
        themes: ['creativity'],
        relatedJournals: mems(2),
        sources: [],
        relevantMemories: mems(2),
      }))
      expect(result.reflections.length).toBe(2)
      expect(result.reflections.some(r => r.includes('Creativity'))).toBe(true)
      expect(result.reflections.some(r => r.match(/journal/i))).toBe(true)
    })

    it('theme + source, no journal', () => {
      const result = buildMemoryCompanionResponse(ctx({
        themes: ['startup'],
        relatedJournals: [],
        sources: ['medium'],
        relevantMemories: mems(4),
      }))
      expect(result.reflections.length).toBe(2)
    })

    it('journal + source, no theme', () => {
      const result = buildMemoryCompanionResponse(ctx({
        themes: [],
        relatedJournals: mems(3),
        sources: ['twitter'],
        relevantMemories: mems(4),
      }))
      expect(result.reflections.length).toBe(2)
    })
  })

  describe('deterministic behavior', () => {
    it('same input produces same output', () => {
      const input = ctx({
        themes: ['design'],
        relatedJournals: mems(2),
        sources: ['twitter'],
        relevantMemories: mems(4),
      })
      const a = buildMemoryCompanionResponse(input)
      const b = buildMemoryCompanionResponse(input)
      expect(a).toEqual(b)
    })

    it('same reflections across multiple calls', () => {
      const input = ctx({ themes: ['startup'], relevantMemories: mems(3) })
      const results = Array.from({ length: 5 }, () => buildMemoryCompanionResponse(input))
      results.forEach(r => expect(r.reflections).toEqual(results[0].reflections))
    })
  })
})
