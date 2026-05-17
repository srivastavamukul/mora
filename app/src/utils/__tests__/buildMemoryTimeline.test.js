import { describe, it, expect } from 'vitest'
import { buildMemoryTimeline } from '../buildMemoryTimeline.js'

const JAN_2025 = new Date(2025, 0, 15).getTime()
const FEB_2025 = new Date(2025, 1, 10).getTime()
const MAR_2025 = new Date(2025, 2, 5).getTime()

describe('buildMemoryTimeline', () => {
  it('returns empty array for no items', () => {
    expect(buildMemoryTimeline([])).toEqual([])
  })

  it('skips items with invalid timestamps', () => {
    const result = buildMemoryTimeline([
      { id: '1', createdAt: -1, tags: [], source: 'web' },
      { id: '2', createdAt: null, tags: [], source: 'web' },
      { id: '3', createdAt: NaN, tags: [], source: 'web' },
      { id: '4', createdAt: 'bad', tags: [], source: 'web' },
      { id: '5', createdAt: 0, tags: [], source: 'web' },
    ])
    expect(result).toEqual([])
  })

  it('groups items by calendar month', () => {
    const items = [
      { id: '1', createdAt: JAN_2025, tags: [], source: 'web' },
      { id: '2', createdAt: JAN_2025 + 1000, tags: [], source: 'web' },
      { id: '3', createdAt: FEB_2025, tags: [], source: 'web' },
    ]
    const result = buildMemoryTimeline(items)
    expect(result).toHaveLength(2)
    expect(result[0].periodLabel).toBe('February 2025')
    expect(result[0].count).toBe(1)
    expect(result[1].periodLabel).toBe('January 2025')
    expect(result[1].count).toBe(2)
  })

  it('orders newest month first', () => {
    const items = [
      { id: '1', createdAt: JAN_2025, tags: [], source: 'web' },
      { id: '2', createdAt: MAR_2025, tags: [], source: 'web' },
      { id: '3', createdAt: FEB_2025, tags: [], source: 'web' },
    ]
    const result = buildMemoryTimeline(items)
    expect(result.map(r => r.periodLabel)).toEqual([
      'March 2025', 'February 2025', 'January 2025',
    ])
  })

  it('count matches items in group', () => {
    const items = [
      { id: '1', createdAt: JAN_2025, tags: [], source: 'web' },
      { id: '2', createdAt: JAN_2025 + 2000, tags: [], source: 'web' },
      { id: '3', createdAt: JAN_2025 + 4000, tags: [], source: 'web' },
    ]
    const [period] = buildMemoryTimeline(items)
    expect(period.count).toBe(3)
    expect(period.items).toHaveLength(3)
  })

  it('includes original items in group', () => {
    const item1 = { id: '1', createdAt: JAN_2025, tags: [], source: 'web' }
    const item2 = { id: '2', createdAt: JAN_2025 + 1000, tags: [], source: 'web' }
    const [period] = buildMemoryTimeline([item1, item2])
    expect(period.items).toContain(item1)
    expect(period.items).toContain(item2)
  })

  describe('dominantTag', () => {
    it('returns null when no tags present', () => {
      const items = Array.from({ length: 4 }, (_, i) => ({
        id: String(i), createdAt: JAN_2025 + i * 1000, tags: [], source: 'web',
      }))
      const [period] = buildMemoryTimeline(items)
      expect(period.dominantTag).toBeNull()
    })

    it('returns dominant tag at >= 25% frequency', () => {
      const items = [
        { id: '1', createdAt: JAN_2025, tags: ['design'], source: 'web' },
        { id: '2', createdAt: JAN_2025 + 1000, tags: ['design'], source: 'web' },
        { id: '3', createdAt: JAN_2025 + 2000, tags: ['code'], source: 'web' },
        { id: '4', createdAt: JAN_2025 + 3000, tags: ['art'], source: 'web' },
      ]
      const [period] = buildMemoryTimeline(items)
      expect(period.dominantTag).toBe('design')
    })

    it('returns null when signal is below 25%', () => {
      const items = Array.from({ length: 8 }, (_, i) => ({
        id: String(i), createdAt: JAN_2025 + i * 1000, tags: [`tag${i}`], source: 'web',
      }))
      const [period] = buildMemoryTimeline(items)
      expect(period.dominantTag).toBeNull()
    })
  })

  describe('dominantSource', () => {
    it('returns dominant source at >= 25% frequency', () => {
      const items = [
        { id: '1', createdAt: JAN_2025, tags: [], source: 'youtube' },
        { id: '2', createdAt: JAN_2025 + 1000, tags: [], source: 'youtube' },
        { id: '3', createdAt: JAN_2025 + 2000, tags: [], source: 'youtube' },
        { id: '4', createdAt: JAN_2025 + 3000, tags: [], source: 'web' },
      ]
      const [period] = buildMemoryTimeline(items)
      expect(period.dominantSource).toBe('youtube')
    })

    it('falls back to metadata.source when source absent', () => {
      const items = [
        { id: '1', createdAt: JAN_2025, tags: [], metadata: { source: 'spotify' } },
        { id: '2', createdAt: JAN_2025 + 1000, tags: [], metadata: { source: 'spotify' } },
        { id: '3', createdAt: JAN_2025 + 2000, tags: [], metadata: { source: 'spotify' } },
      ]
      const [period] = buildMemoryTimeline(items)
      expect(period.dominantSource).toBe('spotify')
    })
  })

  describe('insight', () => {
    it('returns null for fewer than 3 items', () => {
      const items = [
        { id: '1', createdAt: JAN_2025, tags: ['design'], source: 'web' },
        { id: '2', createdAt: JAN_2025 + 1000, tags: ['design'], source: 'web' },
      ]
      const [period] = buildMemoryTimeline(items)
      expect(period.insight).toBeNull()
    })

    it('generates tag-based insight when dominantTag is present', () => {
      const items = [
        { id: '1', createdAt: JAN_2025, tags: ['design'], source: 'web' },
        { id: '2', createdAt: JAN_2025 + 1000, tags: ['design'], source: 'web' },
        { id: '3', createdAt: JAN_2025 + 2000, tags: ['design'], source: 'web' },
      ]
      const [period] = buildMemoryTimeline(items)
      expect(period.insight).toBe('January was focused on design.')
    })

    it('falls back to source insight when no dominant tag', () => {
      const items = [
        { id: '1', createdAt: JAN_2025, tags: [], source: 'youtube' },
        { id: '2', createdAt: JAN_2025 + 1000, tags: [], source: 'youtube' },
        { id: '3', createdAt: JAN_2025 + 2000, tags: [], source: 'youtube' },
      ]
      const [period] = buildMemoryTimeline(items)
      expect(period.insight).toBe('Saved mostly from youtube in January.')
    })

    it('returns null when no strong signal exists', () => {
      const items = Array.from({ length: 5 }, (_, i) => ({
        id: String(i), createdAt: JAN_2025 + i * 1000, tags: [], source: `src${i}`,
      }))
      const [period] = buildMemoryTimeline(items)
      expect(period.insight).toBeNull()
    })
  })
})
