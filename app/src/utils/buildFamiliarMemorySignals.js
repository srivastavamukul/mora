const STOP_WORDS = new Set([
  'this', 'that', 'with', 'have', 'from', 'they', 'will', 'been', 'were',
  'what', 'when', 'where', 'which', 'your', 'just', 'like', 'more', 'some',
  'then', 'than', 'also', 'into', 'over', 'very', 'would', 'could', 'should',
])

const DAY_MS = 24 * 60 * 60 * 1000

function computeTagSpans(items) {
  const spans = {}
  for (const item of items) {
    const tags = Array.isArray(item.tags) ? item.tags : []
    const ts = item.createdAt || 0
    for (const tag of tags) {
      if (!spans[tag]) spans[tag] = { count: 0, first: ts, last: ts }
      spans[tag].count++
      if (ts < spans[tag].first) spans[tag].first = ts
      if (ts > spans[tag].last) spans[tag].last = ts
    }
  }
  return spans
}

function wordFrequency(items) {
  const counts = {}
  for (const item of items) {
    const text = (item.body || item.title || '').toLowerCase()
    const words = text.split(/\W+/).filter(w => w.length >= 4 && !STOP_WORDS.has(w))
    for (const w of words) counts[w] = (counts[w] || 0) + 1
  }
  return counts
}

export function buildFamiliarMemorySignals(items, behaviorSignals, recentReflections) {
  if (!Array.isArray(items) || items.length < 5) {
    return {
      recurringInterests: [],
      recurringCollections: [],
      longRunningTopics: [],
      familiarSources: [],
      reflectionThemes: [],
    }
  }

  const signals = behaviorSignals || { topSources: [] }
  const THIRTY_DAYS = 30 * DAY_MS
  const SIXTY_DAYS = 60 * DAY_MS
  const FOURTEEN_DAYS = 14 * DAY_MS

  const tagSpans = computeTagSpans(items)

  const recurringInterests = Object.entries(tagSpans)
    .filter(([, v]) => v.count >= 3 && (v.last - v.first) >= THIRTY_DAYS)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([tag, v]) => ({ tag, count: v.count, span: v.last - v.first }))

  const longRunningTopics = Object.entries(tagSpans)
    .filter(([, v]) => (v.last - v.first) > SIXTY_DAYS)
    .sort((a, b) => (b[1].last - b[1].first) - (a[1].last - a[1].first))
    .map(([tag, v]) => ({ tag, span: v.last - v.first, count: v.count }))

  const colMap = {}
  for (const item of items) {
    if (!item.collection) continue
    const ts = item.createdAt || 0
    if (!colMap[item.collection]) colMap[item.collection] = { count: 0, first: ts, last: ts }
    colMap[item.collection].count++
    if (ts < colMap[item.collection].first) colMap[item.collection].first = ts
    if (ts > colMap[item.collection].last) colMap[item.collection].last = ts
  }
  const recurringCollections = Object.entries(colMap)
    .filter(([, v]) => v.count >= 2 && (v.last - v.first) >= FOURTEEN_DAYS)
    .sort((a, b) => (b[1].last - b[1].first) - (a[1].last - a[1].first))
    .map(([name, v]) => ({ name, count: v.count, span: v.last - v.first }))

  const familiarSources = (signals.topSources || [])
    .filter(s => s.count >= 3)
    .map(({ source, count }) => ({ source, count }))

  const journalSource = (Array.isArray(recentReflections) && recentReflections.length > 0)
    ? recentReflections
    : items.filter(i => i.type === 'journal')
  const wordCounts = wordFrequency(journalSource)
  const reflectionThemes = Object.entries(wordCounts)
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }))

  return { recurringInterests, recurringCollections, longRunningTopics, familiarSources, reflectionThemes }
}
