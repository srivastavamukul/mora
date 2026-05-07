const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export function buildBehaviorSignals(items) {
  if (!items || items.length === 0) {
    return { topSources: [], topTags: [], dominantType: null, saveFrequency: 'low' }
  }

  // topSources
  const sourceCounts = {}
  for (const item of items) {
    const src = item.source || 'unknown'
    sourceCounts[src] = (sourceCounts[src] || 0) + 1
  }
  const topSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([source, count]) => ({ source, count }))

  // topTags
  const tagCounts = {}
  for (const item of items) {
    const tags = Array.isArray(item.tags) ? item.tags : []
    for (const tag of tags) tagCounts[tag] = (tagCounts[tag] || 0) + 1
  }
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }))

  // dominantType
  const typeCounts = {}
  for (const item of items) {
    const t = item.type || 'unknown'
    typeCounts[t] = (typeCounts[t] || 0) + 1
  }
  const dominantType = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  // saveFrequency: items saved in last 7 days
  const now = Date.now()
  const recentCount = items.filter(item => (item.createdAt || 0) > now - WEEK_MS).length
  let saveFrequency = 'low'
  if (recentCount >= 10) saveFrequency = 'high'
  else if (recentCount >= 4) saveFrequency = 'medium'

  return { topSources, topTags, dominantType, saveFrequency }
}
