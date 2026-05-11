import { describe, it, expect } from 'vitest'
import { normalizeTags } from '../normalizeCapture'

describe('normalizeTags — lowercase normalization', () => {
  it('lowercases array tags', () => {
    expect(normalizeTags(['Focus', 'NIGHT'])).toEqual(['focus', 'night'])
  })
  it('lowercases comma-string tags', () => {
    expect(normalizeTags('Focus, NIGHT')).toEqual(['focus', 'night'])
  })
  it('deduplicates after lowercasing', () => {
    expect(normalizeTags(['Focus', 'focus'])).toEqual(['focus'])
  })
  it('trims whitespace', () => {
    expect(normalizeTags(['  focus  '])).toEqual(['focus'])
  })
  it('returns empty for null', () => {
    expect(normalizeTags(null)).toEqual([])
  })
})
