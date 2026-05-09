import { describe, it, expect } from 'vitest'
import { getUpcomingMemoryEvents } from '../getUpcomingMemoryEvents.js'

function localDateStr(daysFromNow) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function makeItem(overrides = {}) {
  return {
    id: Math.random().toString(36).slice(2),
    title: 'Test Item',
    source: 'web',
    type: 'note',
    tags: [],
    body: '',
    thumbnail: null,
    createdAt: Date.now() - 15 * 86400000,
    memoryDate: null,
    memoryType: null,
    ...overrides,
  }
}

describe('getUpcomingMemoryEvents', () => {
  it('returns empty array when no items have memoryDate', () => {
    const items = [makeItem(), makeItem()]
    expect(getUpcomingMemoryEvents(items)).toEqual([])
  })

  it('filters out items with null memoryDate', () => {
    const items = [
      makeItem({ memoryDate: null }),
      makeItem({ memoryDate: localDateStr(1), title: 'Has Date' }),
    ]
    const result = getUpcomingMemoryEvents(items)
    expect(result).toHaveLength(1)
    expect(result[0].item.title).toBe('Has Date')
  })

  it('sorts by nearest upcoming date', () => {
    const items = [
      makeItem({ title: 'Far', memoryDate: localDateStr(10) }),
      makeItem({ title: 'Near', memoryDate: localDateStr(2) }),
      makeItem({ title: 'Medium', memoryDate: localDateStr(5) }),
    ]
    const result = getUpcomingMemoryEvents(items)
    expect(result[0].item.title).toBe('Near')
    expect(result[1].item.title).toBe('Medium')
    expect(result[2].item.title).toBe('Far')
  })

  it('returns max 10 items', () => {
    const items = Array.from({ length: 15 }, (_, i) =>
      makeItem({ memoryDate: localDateStr(i + 1) })
    )
    expect(getUpcomingMemoryEvents(items)).toHaveLength(10)
  })

  it('excludes past one-time dates', () => {
    const items = [
      makeItem({ memoryDate: localDateStr(-5), memoryType: 'deadline' }),
      makeItem({ memoryDate: localDateStr(3), memoryType: 'deadline', title: 'Future' }),
    ]
    const result = getUpcomingMemoryEvents(items)
    expect(result).toHaveLength(1)
    expect(result[0].item.title).toBe('Future')
  })

  it('excludes past one-time dates for reminder and milestone types', () => {
    const items = [
      makeItem({ memoryDate: localDateStr(-1), memoryType: 'reminder' }),
      makeItem({ memoryDate: localDateStr(-1), memoryType: 'milestone' }),
    ]
    expect(getUpcomingMemoryEvents(items)).toHaveLength(0)
  })

  it('includes today (daysUntil = 0)', () => {
    const items = [makeItem({ memoryDate: localDateStr(0) })]
    const result = getUpcomingMemoryEvents(items)
    expect(result).toHaveLength(1)
    expect(result[0].daysUntil).toBe(0)
  })

  it('wraps past annual birthday to next year', () => {
    const items = [makeItem({ memoryDate: localDateStr(-5), memoryType: 'birthday' })]
    const result = getUpcomingMemoryEvents(items)
    expect(result).toHaveLength(1)
    expect(result[0].daysUntil).toBeGreaterThan(300)
  })

  it('wraps past annual anniversary to next year', () => {
    const items = [makeItem({ memoryDate: localDateStr(-10), memoryType: 'anniversary' })]
    const result = getUpcomingMemoryEvents(items)
    expect(result).toHaveLength(1)
    expect(result[0].daysUntil).toBeGreaterThan(300)
  })

  it('keeps future annual date as-is', () => {
    const items = [makeItem({ memoryDate: localDateStr(15), memoryType: 'birthday' })]
    const result = getUpcomingMemoryEvents(items)
    expect(result[0].daysUntil).toBe(15)
  })

  it('labels 0 days as "Today"', () => {
    const items = [makeItem({ memoryDate: localDateStr(0) })]
    expect(getUpcomingMemoryEvents(items)[0].label).toBe('Today')
  })

  it('labels 1 day as "Tomorrow"', () => {
    const items = [makeItem({ memoryDate: localDateStr(1) })]
    expect(getUpcomingMemoryEvents(items)[0].label).toBe('Tomorrow')
  })

  it('labels 2-6 days as "In N days"', () => {
    const items = [makeItem({ memoryDate: localDateStr(3) })]
    expect(getUpcomingMemoryEvents(items)[0].label).toBe('In 3 days')
  })

  it('labels 7-13 days as "Next week"', () => {
    const items = [makeItem({ memoryDate: localDateStr(8) })]
    expect(getUpcomingMemoryEvents(items)[0].label).toBe('Next week')
  })

  it('labels 14+ days with month and day', () => {
    const items = [makeItem({ memoryDate: localDateStr(20) })]
    const label = getUpcomingMemoryEvents(items)[0].label
    expect(label).toMatch(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{1,2}$/)
  })

  it('each result has item, daysUntil, and label properties', () => {
    const items = [makeItem({ memoryDate: localDateStr(2), memoryType: 'reminder' })]
    const result = getUpcomingMemoryEvents(items)[0]
    expect(result).toHaveProperty('item')
    expect(result).toHaveProperty('daysUntil')
    expect(result).toHaveProperty('label')
  })

  it('handles empty items array', () => {
    expect(getUpcomingMemoryEvents([])).toEqual([])
  })

  it('handles null/missing memoryType gracefully for one-time logic', () => {
    const items = [
      makeItem({ memoryDate: localDateStr(-1), memoryType: null }),
      makeItem({ memoryDate: localDateStr(2), memoryType: null, title: 'Future' }),
    ]
    const result = getUpcomingMemoryEvents(items)
    expect(result).toHaveLength(1)
    expect(result[0].item.title).toBe('Future')
  })
})
