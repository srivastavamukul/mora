import { describe, it, expect } from 'vitest'
import { buildPersonalRecallMoments } from '../buildPersonalRecallMoments'

const DAY_MS = 24 * 60 * 60 * 1000

function makeItem(overrides = {}) {
  return {
    id: Math.random().toString(36).slice(2),
    type: 'link',
    title: 'Item',
    tags: [],
    source: 'example.com',
    createdAt: Date.now(),
    collection: null,
    body: '',
    ...overrides,
  }
}

describe('buildPersonalRecallMoments', () => {
  it('returns [] on empty input', () => {
    expect(buildPersonalRecallMoments([])).toEqual([])
  })

  it('returns [] when fewer than 5 items', () => {
    expect(buildPersonalRecallMoments([makeItem(), makeItem(), makeItem()])).toEqual([])
  })

  it('moment 1: returns recurring tag moment when tag has >= 3 items with span >= 30 days', () => {
    const now = Date.now()
    const items = [
      makeItem({ tags: ['design'], createdAt: now - 40 * DAY_MS }),
      makeItem({ tags: ['design'], createdAt: now - 20 * DAY_MS }),
      makeItem({ tags: ['design'], createdAt: now }),
      makeItem(),
      makeItem(),
    ]
    const moments = buildPersonalRecallMoments(items)
    expect(moments.some(m => m.includes('design') && m.includes('return'))).toBe(true)
  })

  it('moment 1: not emitted when tag span < 30 days', () => {
    const now = Date.now()
    const items = [
      makeItem({ tags: ['design'], createdAt: now - 5 * DAY_MS }),
      makeItem({ tags: ['design'], createdAt: now - 2 * DAY_MS }),
      makeItem({ tags: ['design'], createdAt: now }),
      makeItem(),
      makeItem(),
    ]
    const moments = buildPersonalRecallMoments(items)
    expect(moments.some(m => m.includes('design') && m.includes('return'))).toBe(false)
  })

  it('moment 2: returns recent journal theme when >= 3 journals in last 14 days with repeated word', () => {
    const now = Date.now()
    const items = [
      makeItem({ type: 'journal', body: 'focus on work focus', createdAt: now - 2 * DAY_MS }),
      makeItem({ type: 'journal', body: 'need more focus today', createdAt: now - 5 * DAY_MS }),
      makeItem({ type: 'journal', body: 'maintaining focus daily', createdAt: now - 8 * DAY_MS }),
      makeItem(),
      makeItem(),
    ]
    const moments = buildPersonalRecallMoments(items)
    expect(moments.some(m => m.includes('focus') && m.includes('lately'))).toBe(true)
  })

  it('moment 2: not emitted when fewer than 3 recent journals', () => {
    const now = Date.now()
    const items = [
      makeItem({ type: 'journal', body: 'focus focus focus', createdAt: now - 2 * DAY_MS }),
      makeItem({ type: 'journal', body: 'focus again here', createdAt: now - 5 * DAY_MS }),
      makeItem(),
      makeItem(),
      makeItem(),
    ]
    const moments = buildPersonalRecallMoments(items)
    expect(moments.some(m => m.includes('lately'))).toBe(false)
  })

  it('moment 3: returns personal vs visual moment when recent journals exist and no recent visuals but historical visuals >= 3', () => {
    const now = Date.now()
    const items = [
      makeItem({ type: 'journal', createdAt: now - 2 * DAY_MS }),
      makeItem({ type: 'image', createdAt: now - 30 * DAY_MS }),
      makeItem({ type: 'image', createdAt: now - 45 * DAY_MS }),
      makeItem({ type: 'image', createdAt: now - 60 * DAY_MS }),
      makeItem(),
    ]
    const moments = buildPersonalRecallMoments(items)
    expect(moments.some(m => m.includes('personal') && m.includes('visual'))).toBe(true)
  })

  it('moment 3: not emitted when recent visuals exist', () => {
    const now = Date.now()
    const items = [
      makeItem({ type: 'journal', createdAt: now - 2 * DAY_MS }),
      makeItem({ type: 'image', createdAt: now - 2 * DAY_MS }),
      makeItem({ type: 'image', createdAt: now - 30 * DAY_MS }),
      makeItem({ type: 'image', createdAt: now - 45 * DAY_MS }),
      makeItem({ type: 'image', createdAt: now - 60 * DAY_MS }),
    ]
    const moments = buildPersonalRecallMoments(items)
    expect(moments.some(m => m.includes('personal') && m.includes('visual'))).toBe(false)
  })

  it('moment 4: returns long-running topic moment when tag span > 60 days', () => {
    const now = Date.now()
    const items = [
      makeItem({ tags: ['creativity'], createdAt: now - 65 * DAY_MS }),
      makeItem({ tags: ['creativity'], createdAt: now }),
      makeItem(),
      makeItem(),
      makeItem(),
    ]
    const moments = buildPersonalRecallMoments(items)
    expect(moments.some(m => m.toLowerCase().includes('creativity') && m.includes('thinking'))).toBe(true)
  })

  it('moment 4: not emitted when tag span <= 60 days', () => {
    const now = Date.now()
    const items = [
      makeItem({ tags: ['creativity'], createdAt: now - 59 * DAY_MS }),
      makeItem({ tags: ['creativity'], createdAt: now }),
      makeItem(),
      makeItem(),
      makeItem(),
    ]
    const moments = buildPersonalRecallMoments(items)
    expect(moments.some(m => m.includes('thinking'))).toBe(false)
  })

  it('moment 5: returns familiar source moment when source has >= 5 items', () => {
    const now = Date.now()
    const items = [
      makeItem({ source: 'github.com', createdAt: now }),
      makeItem({ source: 'github.com', createdAt: now - DAY_MS }),
      makeItem({ source: 'github.com', createdAt: now - 2 * DAY_MS }),
      makeItem({ source: 'github.com', createdAt: now - 3 * DAY_MS }),
      makeItem({ source: 'github.com', createdAt: now - 4 * DAY_MS }),
    ]
    const moments = buildPersonalRecallMoments(items)
    expect(moments.some(m => m.includes('github.com') && m.includes('revisit'))).toBe(true)
  })

  it('moment 5: not emitted when source has fewer than 5 items', () => {
    const now = Date.now()
    const items = [
      makeItem({ source: 'github.com', createdAt: now }),
      makeItem({ source: 'github.com', createdAt: now - DAY_MS }),
      makeItem({ source: 'github.com', createdAt: now - 2 * DAY_MS }),
      makeItem({ source: 'github.com', createdAt: now - 3 * DAY_MS }),
      makeItem({ source: 'other.com' }),
    ]
    const moments = buildPersonalRecallMoments(items)
    expect(moments.some(m => m.includes('github.com') && m.includes('revisit'))).toBe(false)
  })

  it('returns at most 5 moments even when all conditions are met', () => {
    const now = Date.now()
    const items = [
      // tag recurring + span > 60d (covers moment 1 and 4)
      makeItem({ tags: ['design'], source: 'a.com', createdAt: now - 65 * DAY_MS }),
      makeItem({ tags: ['design'], source: 'a.com', createdAt: now - 40 * DAY_MS }),
      makeItem({ tags: ['design'], source: 'a.com', createdAt: now }),
      // 3 recent journals with repeated word (moment 2)
      makeItem({ type: 'journal', body: 'focus focus', source: 'a.com', createdAt: now - 2 * DAY_MS }),
      makeItem({ type: 'journal', body: 'focus daily', source: 'a.com', createdAt: now - 3 * DAY_MS }),
      makeItem({ type: 'journal', body: 'focus work', source: 'a.com', createdAt: now - 4 * DAY_MS }),
      // historical visuals (moment 3)
      makeItem({ type: 'image', source: 'a.com', createdAt: now - 30 * DAY_MS }),
      makeItem({ type: 'image', source: 'a.com', createdAt: now - 45 * DAY_MS }),
      makeItem({ type: 'image', source: 'a.com', createdAt: now - 50 * DAY_MS }),
      // familiar source: 'a.com' appears >= 5 times (moment 5)
    ]
    const moments = buildPersonalRecallMoments(items)
    expect(moments.length).toBeLessThanOrEqual(5)
  })
})
