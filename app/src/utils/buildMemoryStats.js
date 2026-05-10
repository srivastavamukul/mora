const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function computeWeeklyGrowth(items) {
  const now = Date.now()
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000
  const buckets = []
  for (let i = 11; i >= 0; i--) {
    const start = now - (i + 1) * WEEK_MS
    const end = now - i * WEEK_MS
    const d = new Date(start)
    const label = `${MONTHS[d.getMonth()]} W${Math.ceil(d.getDate() / 7)}`
    buckets.push({ label, start, end, count: 0 })
  }
  for (const item of items) {
    const t = item.createdAt
    if (!t) continue
    for (const bucket of buckets) {
      if (t >= bucket.start && t < bucket.end) {
        bucket.count++
        break
      }
    }
  }
  // Items outside the 12-week window match no bucket and are implicitly excluded.
  return buckets.map(({ label, count }) => ({ label, count }))
}

export function buildMemoryStats(items) {
  if (!Array.isArray(items)) return { total: 0, journals: 0, collections: 0, topSource: null, topTag: null, weeklyGrowth: [] }

  const total = items.length
  const journals = items.filter(i => i.type === 'journal').length

  const collections = new Set(items.map(i => i.collection).filter(Boolean)).size

  const sourceCounts = {}
  for (const item of items) {
    if (item.source) sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1
  }
  const srcEntries = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])
  const topSource = srcEntries.length ? { source: srcEntries[0][0], count: srcEntries[0][1] } : null

  const tagCounts = {}
  for (const item of items) {
    for (const tag of (item.tags || [])) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    }
  }
  const tagEntries = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])
  const topTag = tagEntries.length ? { tag: tagEntries[0][0], count: tagEntries[0][1] } : null

  return { total, journals, collections, topSource, topTag, weeklyGrowth: computeWeeklyGrowth(items) }
}
