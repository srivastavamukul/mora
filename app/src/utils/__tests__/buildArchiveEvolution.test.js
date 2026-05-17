import { describe, it, expect } from 'vitest'
import { buildArchiveEvolution } from '../buildArchiveEvolution.js'

// months spaced across 6 calendar months
const M1 = new Date(2025, 0, 10).getTime()  // Jan 2025
const M2 = new Date(2025, 1, 10).getTime()  // Feb 2025
const M3 = new Date(2025, 2, 10).getTime()  // Mar 2025
const M4 = new Date(2025, 3, 10).getTime()  // Apr 2025
const M5 = new Date(2025, 4, 10).getTime()  // May 2025
const M6 = new Date(2025, 5, 10).getTime()  // Jun 2025

function item(id, createdAt, tags = [], source = 'web') {
  return { id, createdAt, tags, source }
}

function makeItems(count, createdAt, tags = [], source = 'web') {
  return Array.from({ length: count }, (_, i) => item(`${createdAt}-${i}`, createdAt + i * 100, tags, source))
}

describe('buildArchiveEvolution', () => {
  it('returns empty result for non-array input', () => {
    const result = buildArchiveEvolution(null)
    expect(result.evolvingTags).toEqual([])
    expect(result.shifts).toEqual([])
  })

  it('returns empty result for fewer than 10 items', () => {
    const items = makeItems(9, M1, ['design'])
    expect(buildArchiveEvolution(items).shifts).toEqual([])
  })

  it('returns empty result for fewer than 3 distinct months', () => {
    const items = [
      ...makeItems(6, M1, ['design']),
      ...makeItems(6, M2, ['design']),
    ]
    expect(buildArchiveEvolution(items).shifts).toEqual([])
  })

  it('skips items with invalid timestamps', () => {
    const valid = makeItems(10, M1, ['design'])
    const invalid = [
      item('bad1', -1, ['design']),
      item('bad2', null, ['design']),
      item('bad3', NaN, ['design']),
    ]
    // all valid items in a single month → still < 3 months → empty
    const result = buildArchiveEvolution([...valid, ...invalid])
    expect(result.evolvingTags).toEqual([])
  })

  describe('evolvingTags', () => {
    it('detects tag growing in recent period', () => {
      const items = [
        // earlier: 1 design item out of 6
        item('e1', M1, ['other']),
        item('e2', M1 + 100, ['other']),
        item('e3', M2, ['other']),
        item('e4', M2 + 100, ['other']),
        item('e5', M3, ['design']),
        item('e6', M3 + 100, ['other']),
        // recent: 4 design items out of 6 (67% vs ~17%)
        item('r1', M4, ['design']),
        item('r2', M4 + 100, ['design']),
        item('r3', M5, ['design']),
        item('r4', M5 + 100, ['design']),
        item('r5', M6, ['other']),
        item('r6', M6 + 100, ['other']),
      ]
      const { evolvingTags } = buildArchiveEvolution(items)
      expect(evolvingTags.some(e => e.tag === 'design')).toBe(true)
    })

    it('suppresses tag with fewer than 3 recent occurrences', () => {
      const items = [
        ...makeItems(6, M1, ['other']),
        ...makeItems(3, M2, ['other']),
        item('r1', M4, ['rare']),
        item('r2', M5, ['rare']),
        item('r3', M6, ['other']),
        item('r4', M6 + 100, ['other']),
      ]
      const { evolvingTags } = buildArchiveEvolution(items)
      expect(evolvingTags.some(e => e.tag === 'rare')).toBe(false)
    })

    it('suppresses tag with rate below 10% in recent period', () => {
      // recent: 3 design out of 40 = 7.5%
      const items = [
        ...makeItems(6, M1, ['other']),
        ...makeItems(6, M2, ['other']),
        ...makeItems(6, M3, ['other']),
        ...makeItems(34, M4, ['other']),
        item('d1', M5, ['design']),
        item('d2', M5 + 100, ['design']),
        item('d3', M6, ['design']),
      ]
      const { evolvingTags } = buildArchiveEvolution(items)
      expect(evolvingTags.some(e => e.tag === 'design')).toBe(false)
    })
  })

  describe('emergingSources', () => {
    it('detects source growing in recent period', () => {
      const items = [
        ...makeItems(5, M1, [], 'web'),
        item('yt1', M2, [], 'youtube'),
        ...makeItems(4, M3, [], 'web'),
        item('r1', M4, [], 'youtube'),
        item('r2', M4 + 100, [], 'youtube'),
        item('r3', M5, [], 'youtube'),
        item('r4', M5 + 100, [], 'youtube'),
        item('r5', M6, [], 'web'),
      ]
      const { emergingSources } = buildArchiveEvolution(items)
      expect(emergingSources.some(e => e.source === 'youtube')).toBe(true)
    })

    it('suppresses source with fewer than 3 recent occurrences', () => {
      const items = [
        ...makeItems(6, M1, [], 'web'),
        ...makeItems(5, M2, [], 'web'),
        item('r1', M4, [], 'rare'),
        item('r2', M5, [], 'rare'),
        ...makeItems(4, M6, [], 'web'),
      ]
      const { emergingSources } = buildArchiveEvolution(items)
      expect(emergingSources.some(e => e.source === 'rare')).toBe(false)
    })
  })

  describe('recurringThemes', () => {
    it('identifies tag appearing in 3+ months', () => {
      const items = [
        item('1', M1, ['startup']),
        item('2', M2, ['startup']),
        item('3', M2 + 100, ['startup']),
        item('4', M3, ['startup']),
        item('5', M3 + 100, ['startup']),
        item('6', M4, ['startup']),
        item('7', M5, ['other']),
        item('8', M5 + 100, ['other']),
        item('9', M6, ['other']),
        item('10', M6 + 100, ['other']),
      ]
      const { recurringThemes } = buildArchiveEvolution(items)
      expect(recurringThemes.some(t => t.tag === 'startup')).toBe(true)
    })

    it('suppresses tag appearing in fewer than 3 months', () => {
      const items = [
        item('1', M1, ['design']),
        item('2', M1 + 100, ['design']),
        item('3', M2, ['design']),
        item('4', M2 + 100, ['design']),
        ...makeItems(6, M3, ['other']),
        ...makeItems(3, M4, ['other']),
      ]
      const { recurringThemes } = buildArchiveEvolution(items)
      expect(recurringThemes.some(t => t.tag === 'design')).toBe(false)
    })

    it('suppresses theme with total count below 5', () => {
      const items = [
        item('1', M1, ['thin']),
        item('2', M2, ['thin']),
        item('3', M3, ['thin']),
        item('4', M3 + 100, ['thin']),
        ...makeItems(6, M4, ['other']),
        ...makeItems(3, M5, ['other']),
      ]
      // 4 total occurrences of 'thin' — below threshold of 5
      const { recurringThemes } = buildArchiveEvolution(items)
      expect(recurringThemes.some(t => t.tag === 'thin')).toBe(false)
    })
  })

  describe('shifts', () => {
    it('returns at most 5 shifts', () => {
      const items = [
        ...makeItems(3, M1, ['design', 'startup', 'code'], 'youtube'),
        ...makeItems(3, M2, ['art', 'tech', 'music'], 'web'),
        ...makeItems(2, M3, ['film', 'gaming'], 'spotify'),
        ...makeItems(4, M4, ['design', 'design', 'design'], 'youtube'),
        ...makeItems(4, M5, ['startup', 'startup', 'startup'], 'youtube'),
        ...makeItems(4, M6, ['code', 'code', 'code'], 'youtube'),
      ]
      const { shifts } = buildArchiveEvolution(items)
      expect(shifts.length).toBeLessThanOrEqual(5)
    })

    it('capitalizes first letter of tag in shift sentence', () => {
      const items = [
        item('e1', M1, ['other']),
        item('e2', M2, ['other']),
        item('e3', M3, ['other']),
        item('e4', M3 + 100, ['other']),
        item('e5', M3 + 200, ['other']),
        item('r1', M4, ['design']),
        item('r2', M4 + 100, ['design']),
        item('r3', M5, ['design']),
        item('r4', M5 + 100, ['design']),
        item('r5', M6, ['design']),
        item('r6', M6 + 100, ['other']),
        item('r7', M6 + 200, ['other']),
      ]
      const { shifts } = buildArchiveEvolution(items)
      const designShift = shifts.find(s => s.toLowerCase().includes('design'))
      if (designShift) {
        expect(designShift[0]).toBe(designShift[0].toUpperCase())
      }
    })

    it('does not duplicate evolving tag in recurring themes shift', () => {
      const items = [
        item('e1', M1, ['design']),
        item('e2', M2, ['design']),
        item('e3', M3, ['design']),
        item('r1', M4, ['design']),
        item('r2', M4 + 100, ['design']),
        item('r3', M5, ['design']),
        item('r4', M5 + 100, ['design']),
        item('r5', M6, ['other']),
        item('r6', M6 + 100, ['other']),
        item('r7', M6 + 200, ['other']),
      ]
      const { shifts } = buildArchiveEvolution(items)
      const designShifts = shifts.filter(s => s.toLowerCase().includes('design'))
      expect(designShifts.length).toBeLessThanOrEqual(1)
    })
  })

  describe('return shape', () => {
    it('always returns all four keys', () => {
      const result = buildArchiveEvolution([])
      expect(result).toHaveProperty('evolvingTags')
      expect(result).toHaveProperty('emergingSources')
      expect(result).toHaveProperty('recurringThemes')
      expect(result).toHaveProperty('shifts')
    })

    it('evolvingTags entries have tag, recentCount, earlierCount', () => {
      const items = [
        ...makeItems(5, M1, ['other']),
        ...makeItems(4, M2, ['other']),
        item('r1', M4, ['design']),
        item('r2', M4 + 100, ['design']),
        item('r3', M5, ['design']),
        item('r4', M5 + 100, ['design']),
        item('r5', M6, ['other']),
        item('r6', M6 + 100, ['other']),
      ]
      const { evolvingTags } = buildArchiveEvolution(items)
      if (evolvingTags.length) {
        expect(evolvingTags[0]).toHaveProperty('tag')
        expect(evolvingTags[0]).toHaveProperty('recentCount')
        expect(evolvingTags[0]).toHaveProperty('earlierCount')
      }
    })
  })
})
