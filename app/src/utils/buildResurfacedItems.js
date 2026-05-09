const DAY = 86400000

function getMediumRecencyScore(timestamp) {
  const age = Date.now() - (timestamp || 0)
  if (age < DAY)        return 0.1
  if (age < 7 * DAY)   return 0.5
  if (age < 30 * DAY)  return 1.0
  if (age < 90 * DAY)  return 0.7
  return 0.3
}

export function buildResurfacedItems(items, behaviorSignals) {
  if (!Array.isArray(items) || items.length === 0) return []
  const signals = behaviorSignals || { topTags: [], topSources: [] }
  const topTagSet = new Set((signals.topTags || []).map(t => t.tag))

  const scored = items.map(item => {
    const tags = Array.isArray(item.tags) ? item.tags : []

    const matchCount = tags.filter(t => topTagSet.has(t)).length
    const interestScore = Math.min(matchCount, 3) / 3

    const recencyScore = getMediumRecencyScore(item.createdAt)

    const richness =
      (item.body ? 0.3 : 0) +
      (item.thumbnail ? 0.3 : 0) +
      Math.min(tags.length * 0.1, 0.4)

    const score = interestScore * 0.4 + recencyScore * 0.35 + richness * 0.25
    return { item, score }
  })

  scored.sort((a, b) => b.score - a.score)

  const sourceCount = {}
  const clusterCount = {}
  const result = []

  for (const { item } of scored) {
    if (result.length >= 8) break

    const src = item.source || 'unknown'
    if ((sourceCount[src] || 0) >= 2) continue

    const tags = Array.isArray(item.tags) ? item.tags : []
    const topTag = tags.find(t => topTagSet.has(t)) || null
    if (topTag && (clusterCount[topTag] || 0) >= 2) continue

    sourceCount[src] = (sourceCount[src] || 0) + 1
    if (topTag) clusterCount[topTag] = (clusterCount[topTag] || 0) + 1
    result.push(item)
  }

  return result
}
