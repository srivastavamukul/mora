const _cache = new Map()

const PLATFORM_THEMES = new Set([
  'social media', 'video content', 'visual discovery', 'content creation', 'influencer marketing',
])

function phrase(theme) { return (theme || '').toLowerCase() }
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '' }
function isPlatform(theme) { return PLATFORM_THEMES.has(phrase(theme)) }

function crossPeriodRecurring(evolution) {
  const periods = evolution?.periods || []
  if (periods.length < 3) return null

  const counts = {}
  for (const p of periods) {
    for (const t of (p.dominantThemes || [])) {
      if (!isPlatform(t)) counts[t] = (counts[t] || 0) + 1
    }
  }

  const top = Object.entries(counts)
    .filter(([, c]) => c >= 3)
    .sort((a, b) => b[1] - a[1])[0]

  if (!top) return null
  return `You seem to revisit ${phrase(top[0])} across different periods.`
}

function recentSurge(resurfacingSignals) {
  const trends = (resurfacingSignals?.trendCandidates || [])
    .filter(t => !isPlatform(t.theme) && t.count >= 3)
  if (!trends.length) return null
  return `Your archive shows stronger exploration around ${phrase(trends[0].theme)} recently.`
}

function coOccurrence(graph) {
  const edge = (graph?.edges || [])
    .filter(e => !isPlatform(e.source) && !isPlatform(e.target) && e.strength >= 3)[0]
  if (!edge) return null
  return `${cap(phrase(edge.source))} often appears alongside ${phrase(edge.target)} ideas.`
}

function gradualFade(evolution) {
  const periods = evolution?.periods || []
  if (periods.length < 3) return null

  const recentSet = new Set([
    ...(periods[0]?.dominantThemes || []),
    ...(periods[1]?.dominantThemes || []),
  ])

  const olderCounts = {}
  for (const p of periods.slice(2)) {
    for (const t of (p.dominantThemes || [])) {
      if (!isPlatform(t) && !recentSet.has(t)) {
        olderCounts[t] = (olderCounts[t] || 0) + 1
      }
    }
  }

  const top = Object.entries(olderCounts)
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])[0]

  if (!top) return null
  return `${cap(phrase(top[0]))} content gradually gave way to more focused interests.`
}

function dormantQuiet(resurfacingSignals) {
  const dormant = (resurfacingSignals?.dormantThemes || [])
    .filter(t => !isPlatform(t.theme) && t.count >= 5 && t.daysSinceLast >= 45)
  if (!dormant.length) return null
  return `${cap(phrase(dormant[0].theme))} seems to have quieted in your recent saves.`
}

export function buildMemoryAdvisor(items, evolution, resurfacingSignals, graph) {
  if (!Array.isArray(items) || items.length < 10) return { observations: [] }

  const cacheKey = `${items.length}:${evolution?.periods?.length ?? 0}:${resurfacingSignals?.recurringThemes?.length ?? 0}:${graph?.edges?.length ?? 0}`
  if (_cache.has(cacheKey)) return _cache.get(cacheKey)

  const observations = [
    crossPeriodRecurring(evolution),
    recentSurge(resurfacingSignals),
    coOccurrence(graph),
    gradualFade(evolution),
    dormantQuiet(resurfacingSignals),
  ].filter(Boolean).slice(0, 5)

  const result = { observations }
  if (_cache.size > 50) _cache.clear()
  _cache.set(cacheKey, result)
  return result
}
