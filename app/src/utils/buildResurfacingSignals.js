import { enrichSemanticMetadata } from './enrichSemanticMetadata'

const DAY = 86400000

const RECURRING_MIN_COUNT = 3
const RECURRING_MIN_SPAN = 30 * DAY
const DORMANT_WINDOW = 30 * DAY
const TREND_WINDOW = 14 * DAY
const TREND_MIN_COUNT = 2
const WEAK_SIGNAL_THRESHOLD = 0.1

const _cache = new Map()

function getThemesForItem(item) {
  const tags = Array.isArray(item.tags) ? item.tags.map(t => t.toLowerCase()) : []
  const { themes: semanticThemes } = enrichSemanticMetadata(item)
  return [...new Set([...tags, ...semanticThemes])]
}

export function buildResurfacingSignals(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { recurringThemes: [], dormantThemes: [], revisitCandidates: [], trendCandidates: [] }
  }

  const cacheKey = `${items.length}:${items[0]?.id ?? ''}:${items[items.length - 1]?.id ?? ''}`
  if (_cache.has(cacheKey)) return _cache.get(cacheKey)

  const now = Date.now()

  // Build theme frequency + recency map
  const themeMap = {}
  for (const item of items) {
    const ts = item.createdAt || 0
    const isRecent = ts > now - TREND_WINDOW
    const themes = getThemesForItem(item)
    for (const theme of themes) {
      if (!theme) continue
      if (!themeMap[theme]) themeMap[theme] = { count: 0, first: ts, last: ts, recentCount: 0 }
      const entry = themeMap[theme]
      entry.count++
      if (ts < entry.first) entry.first = ts
      if (ts > entry.last) entry.last = ts
      if (isRecent) entry.recentCount++
    }
  }

  // recurringThemes: active across time (count >= 3, span >= 30d)
  const recurringThemes = Object.entries(themeMap)
    .filter(([, v]) => v.count >= RECURRING_MIN_COUNT && (v.last - v.first) >= RECURRING_MIN_SPAN)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)
    .map(([theme, v]) => ({ theme, count: v.count, lastSeen: v.last }))

  // dormantThemes: historically active but not seen in last 30d
  const dormantThemes = Object.entries(themeMap)
    .filter(([, v]) => v.count >= RECURRING_MIN_COUNT && (now - v.last) > DORMANT_WINDOW)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([theme, v]) => ({ theme, count: v.count, daysSinceLast: Math.floor((now - v.last) / DAY) }))

  // trendCandidates: themes with >= 2 saves in last 14d
  const trendCandidates = Object.entries(themeMap)
    .filter(([, v]) => v.recentCount >= TREND_MIN_COUNT)
    .sort((a, b) => b[1].recentCount - a[1].recentCount)
    .slice(0, 5)
    .map(([theme, v]) => ({ theme, count: v.recentCount }))

  // revisitCandidates: older meaningful items aligned with recurring + trend themes
  const recurringSet = new Set(recurringThemes.map(t => t.theme))
  const trendSet = new Set(trendCandidates.map(t => t.theme))

  const scored = items
    .filter(item => (now - (item.createdAt || 0)) > 7 * DAY)
    .map(item => {
      const themes = getThemesForItem(item)
      const tags = Array.isArray(item.tags) ? item.tags : []
      const age = now - (item.createdAt || 0)

      const recurringMatch = themes.filter(t => recurringSet.has(t)).length
      const trendMatch = themes.filter(t => trendSet.has(t)).length

      // sweet spot: 30–180 days old
      let recencyScore
      if (age >= 30 * DAY && age <= 180 * DAY) recencyScore = 1.0
      else if (age >= 7 * DAY) recencyScore = 0.5
      else recencyScore = 0.3

      const richness =
        (item.body ? 0.3 : 0) +
        (item.thumbnail ? 0.3 : 0) +
        Math.min(tags.length * 0.1, 0.4)

      const interestScore = Math.min(recurringMatch, 3) / 3
      const trendBoost = Math.min(trendMatch, 2) / 2 * 0.2

      return {
        item,
        score: interestScore * 0.45 + recencyScore * 0.3 + richness * 0.2 + trendBoost,
        topTag: tags.find(t => recurringSet.has(t.toLowerCase())) || null,
      }
    })
    .filter(({ score }) => score > WEAK_SIGNAL_THRESHOLD)
    .sort((a, b) => b.score - a.score)

  const sourceCount = {}
  const clusterCount = {}
  const revisitCandidates = []
  for (const { item, topTag } of scored) {
    if (revisitCandidates.length >= 8) break
    const src = item.source || 'unknown'
    if ((sourceCount[src] || 0) >= 2) continue
    if (topTag && (clusterCount[topTag] || 0) >= 2) continue
    sourceCount[src] = (sourceCount[src] || 0) + 1
    if (topTag) clusterCount[topTag] = (clusterCount[topTag] || 0) + 1
    revisitCandidates.push(item)
  }

  const result = { recurringThemes, dormantThemes, revisitCandidates, trendCandidates }
  if (_cache.size > 50) _cache.clear()
  _cache.set(cacheKey, result)
  return result
}
