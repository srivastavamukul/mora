function normalizeTag(tag) {
  return tag.trim().toLowerCase()
}

function sortGroupItems(items, flags) {
  return [...items].sort((a, b) => {
    const fa = flags?.[a.id] || {}
    const fb = flags?.[b.id] || {}
    const aPriority = fa.isSaved && !fa.isTried ? 1 : 0
    const bPriority = fb.isSaved && !fb.isTried ? 1 : 0
    if (bPriority !== aPriority) return bPriority - aPriority
    return (a.createdAt || 0) - (b.createdAt || 0)
  })
}

export function groupItemsByTags(items, flags = {}) {
  const tagFreq = {}
  const tagMap = {}

  for (const item of items) {
    const tags = Array.isArray(item.tags) ? item.tags : []
    for (const raw of tags) {
      const tag = normalizeTag(raw)
      if (!tag) continue
      tagFreq[tag] = (tagFreq[tag] || 0) + 1
      if (!tagMap[tag]) tagMap[tag] = []
      if (!tagMap[tag].includes(item)) tagMap[tag].push(item)
    }
  }

  // Top 12 tags by frequency
  const topTags = Object.keys(tagFreq)
    .sort((a, b) => tagFreq[b] - tagFreq[a])
    .slice(0, 12)

  // Filter to min 2 items, sort clusters by size desc, then alphabetically for determinism
  const clusters = topTags
    .filter(tag => tagMap[tag].length >= 2)
    .sort((a, b) => tagMap[b].length - tagMap[a].length || a.localeCompare(b))

  if (clusters.length > 0) {
    return clusters.reduce((acc, tag) => {
      acc[tag] = sortGroupItems(tagMap[tag], flags)
      return acc
    }, {})
  }

  // Fallback: group by type
  const byType = {}
  for (const item of items) {
    const type = item.type || item.filterKey || 'other'
    if (!byType[type]) byType[type] = []
    byType[type].push(item)
  }

  return Object.fromEntries(
    Object.entries(byType)
      .sort(([ka, a], [kb, b]) => b.length - a.length || ka.localeCompare(kb))
      .map(([type, typeItems]) => [type, sortGroupItems(typeItems, flags)])
  )
}
