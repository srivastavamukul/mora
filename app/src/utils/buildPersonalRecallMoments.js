const STOP_WORDS = new Set([
  'this', 'that', 'with', 'have', 'from', 'they', 'will', 'been', 'were',
  'what', 'when', 'where', 'which', 'your', 'just', 'like', 'more', 'some',
  'then', 'than', 'also', 'into', 'over', 'very', 'would', 'could', 'should',
  'today', 'daily', 'again', 'here', 'need', 'work', 'needed', 'deep',
])

const DAY_MS = 24 * 60 * 60 * 1000

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function topWordFromItems(items) {
  const counts = {}
  for (const item of items) {
    const text = (item.body || item.title || '').toLowerCase()
    const words = text.split(/\W+/).filter(w => w.length >= 4 && !STOP_WORDS.has(w))
    for (const w of words) counts[w] = (counts[w] || 0) + 1
  }
  const top = Object.entries(counts).filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1])[0]
  return top?.[0] ?? null
}

export function buildPersonalRecallMoments(items) {
  if (!Array.isArray(items) || items.length < 5) return []

  const now = Date.now()
  const THIRTY_DAYS = 30 * DAY_MS
  const SIXTY_DAYS = 60 * DAY_MS
  const FOURTEEN_DAYS = 14 * DAY_MS
  const moments = []

  const tagSpans = {}
  for (const item of items) {
    const tags = Array.isArray(item.tags) ? item.tags : []
    const ts = item.createdAt || 0
    for (const tag of tags) {
      if (!tagSpans[tag]) tagSpans[tag] = { count: 0, first: ts, last: ts }
      tagSpans[tag].count++
      if (ts < tagSpans[tag].first) tagSpans[tag].first = ts
      if (ts > tagSpans[tag].last) tagSpans[tag].last = ts
    }
  }

  // Moment 1: recurring tag (>= 3 items, span >= 30d)
  const topRecurring = Object.entries(tagSpans)
    .filter(([, v]) => v.count >= 3 && (v.last - v.first) >= THIRTY_DAYS)
    .sort((a, b) => b[1].count - a[1].count)[0]
  if (topRecurring) {
    moments.push(`You return to ${topRecurring[0]} often.`)
  }

  // Moment 2: recent journal theme (>= 3 journals in last 14d, top word >= 2 occurrences)
  if (moments.length < 5) {
    const recentJournals = items.filter(i => i.type === 'journal' && (i.createdAt || 0) > now - FOURTEEN_DAYS)
    if (recentJournals.length >= 3) {
      const topWord = topWordFromItems(recentJournals)
      if (topWord) moments.push(`You've been thinking about ${topWord} lately.`)
    }
  }

  // Moment 3: recent reflections > 0, no recent visuals, historical visuals >= 3
  if (moments.length < 5) {
    const recentJournalCount = items.filter(i => i.type === 'journal' && (i.createdAt || 0) > now - FOURTEEN_DAYS).length
    const recentVisualCount = items.filter(i => ['image', 'video'].includes(i.type) && (i.createdAt || 0) > now - FOURTEEN_DAYS).length
    const historicalVisualCount = items.filter(i => ['image', 'video'].includes(i.type) && (i.createdAt || 0) <= now - FOURTEEN_DAYS).length
    if (recentJournalCount > 0 && recentVisualCount === 0 && historicalVisualCount >= 3) {
      moments.push('Your recent reflections are more personal than visual.')
    }
  }

  // Moment 4: long-running topic (span > 60d)
  if (moments.length < 5) {
    const longRunning = Object.entries(tagSpans)
      .filter(([, v]) => (v.last - v.first) > SIXTY_DAYS)
      .sort((a, b) => (b[1].last - b[1].first) - (a[1].last - a[1].first))[0]
    if (longRunning) {
      moments.push(`${capitalize(longRunning[0])} has been part of your thinking for a while.`)
    }
  }

  // Moment 5: familiar source (>= 5 items)
  if (moments.length < 5) {
    const sourceCounts = {}
    for (const item of items) {
      const src = item.source || 'unknown'
      sourceCounts[src] = (sourceCounts[src] || 0) + 1
    }
    const topSource = Object.entries(sourceCounts)
      .filter(([, c]) => c >= 5)
      .sort((a, b) => b[1] - a[1])[0]
    if (topSource) moments.push(`You often revisit ${topSource[0]}.`)
  }

  return moments
}
