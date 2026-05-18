import { semanticSearch } from './scoreSearchMatch'

function tagFreq(items) {
  const freq = {}
  for (const item of items) {
    for (const tag of (Array.isArray(item.tags) ? item.tags : [])) {
      if (tag) freq[tag] = (freq[tag] || 0) + 1
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

const EMPTY = { relevantMemories: [], relatedJournals: [], themes: [], sources: [], observations: [] }

export function buildMemoryContext(query, items, signals = {}) {
  if (!Array.isArray(items) || items.length === 0) return EMPTY

  const q = typeof query === 'string' ? query.trim() : ''

  const byRecency = [...items].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

  const relevantMemories = q
    ? semanticSearch(q, items).slice(0, 5)
    : byRecency.slice(0, 5)

  const journals = items.filter(i => i.type === 'journal')
  const relatedJournals = q
    ? semanticSearch(q, journals).slice(0, 3)
    : journals.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 3)

  const themes = Object.entries(tagFreq(relevantMemories))
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

  return { relevantMemories, relatedJournals, themes, sources, observations }
}
