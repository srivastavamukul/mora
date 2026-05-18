import { semanticSearch } from './scoreSearchMatch'
import { enrichSemanticMetadata, FILLER_WORDS } from './enrichSemanticMetadata'
import { parseMemoryQuery } from './parseMemoryQuery'

function tagFreq(items) {
  const freq = {}
  for (const item of items) {
    for (const tag of (Array.isArray(item.tags) ? item.tags : [])) {
      if (tag) freq[tag] = (freq[tag] || 0) + 1
    }
    for (const theme of enrichSemanticMetadata(item).themes) {
      freq[theme] = (freq[theme] || 0) + 1
    }
  }
  return freq
}

function sourceFreq(items) {
  const freq = {}
  for (const item of items) {
    const src = item.source || item.metadata?.source
    if (src) freq[src] = (freq[src] || 0) + 1
  }
  return freq
}

const EMPTY = { relevantMemories: [], relatedJournals: [], themes: [], sources: [], observations: [], entities: [] }

export function buildMemoryContext(query = '', items, signals = {}) {
  if (!Array.isArray(items) || items.length === 0) return EMPTY

  const q = typeof query === 'string' ? query.trim() : ''
  const parsed = q ? parseMemoryQuery(q) : null

  const byRecency = [...items].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

  // Source filter
  let pool = items
  if (parsed?.sourceFilters?.length > 0) {
    const sf = parsed.sourceFilters.map(s => s.toLowerCase())
    const sourceFiltered = items.filter(item => {
      const src = (item.source || item.metadata?.source || '').toLowerCase()
      return sf.some(s => src.includes(s))
    })
    if (sourceFiltered.length > 0) pool = sourceFiltered
  }

  // Time filter
  if (parsed?.timeFilters) {
    const now = Date.now()
    const MS = { today: 86400000, yesterday: 172800000, week: 604800000, recent: 604800000, month: 2592000000, year: 31536000000 }
    const cutoff = now - (MS[parsed.timeFilters.period] || 604800000)
    const timeFiltered = pool.filter(item => (item.createdAt || 0) >= cutoff)
    if (timeFiltered.length > 0) pool = timeFiltered
  }

  const poolByRecency = [...pool].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  const poolJournals = pool.filter(i => i.type === 'journal')

  let relevantMemories, relatedJournals

  if (parsed?.intent === 'trend') {
    relevantMemories = poolByRecency.slice(0, 5)
    relatedJournals = [...poolJournals].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 3)
  } else if (q) {
    relevantMemories = semanticSearch(q, pool).slice(0, 5)
    relatedJournals = semanticSearch(q, poolJournals).slice(0, 3)
  } else {
    relevantMemories = poolByRecency.slice(0, 5)
    relatedJournals = [...poolJournals].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 3)
  }

  const themes = Object.entries(tagFreq(relevantMemories))
    .filter(([tag]) => !FILLER_WORDS.has(tag.toLowerCase()))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag)

  const sources = Object.entries(sourceFreq(relevantMemories))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([src]) => src)

  let observations = []
  if (Array.isArray(signals.observations) && signals.observations.length > 0) {
    observations = signals.observations.slice(0, 5)
  } else {
    const topTags = signals.topTags || []
    const topSources = signals.topSources || []
    if (topTags[0]) observations.push(`Frequent theme: ${topTags[0].tag}`)
    if (topSources[0]) observations.push(`Top source: ${topSources[0].source}`)
    if (signals.saveFrequency === 'high') observations.push('High save activity recently.')
  }

  const entitySet = new Set()
  for (const item of relevantMemories) {
    for (const e of enrichSemanticMetadata(item).entities) entitySet.add(e)
  }
  const entities = [...entitySet].slice(0, 3)

  return { relevantMemories, relatedJournals, themes, sources, observations, entities }
}
