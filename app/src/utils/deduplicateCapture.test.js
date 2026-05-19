import { describe, it, expect } from 'vitest'
import { normalizeUrl, getPlatformId, deduplicateCapture } from './deduplicateCapture'

describe('deduplicateCapture utils', () => {
  it('normalizes URLs by removing tracking and trailing slash', () => {
    const a = normalizeUrl('https://example.com/path/?utm_source=foo&b=2#frag')
    expect(a).toBe('https://example.com/path/?b=2')
  })

  it('extracts platform ids for instagram and pinterest', () => {
    expect(getPlatformId({ source: 'instagram', url: 'https://instagram.com/p/AbC123/' })).toBe('AbC123')
    expect(getPlatformId({ source: 'instagram', url: 'https://instagram.com/reel/XYZ987?utm=1' })).toBe('XYZ987')
    expect(getPlatformId({ source: 'pinterest', url: 'https://www.pinterest.com/pin/123456789012345/' })).toBe('123456789012345')
  })

  it('detects duplicates by platformId or normalized url', () => {
    const existing = [
      { id: '1', url: 'https://instagram.com/p/AbC123', source: 'instagram' }
    ]
    const candidate = { url: 'https://instagram.com/p/AbC123/?utm=1', source: 'instagram' }
    const res = deduplicateCapture(existing, candidate)
    expect(res.isDuplicate).toBe(true)
    expect(res.reason).toBeDefined()
  })
})
