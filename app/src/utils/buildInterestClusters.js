export function buildInterestClusters(items) {
  const tagMap = new Map()

  for (const item of items) {
    const tags = Array.isArray(item.tags) ? item.tags : []
    for (const tag of tags) {
      if (!tagMap.has(tag)) tagMap.set(tag, [])
      tagMap.get(tag).push(item)
    }
  }

  const clusters = []
  for (const [tag, tagItems] of tagMap) {
    if (tagItems.length < 2) continue
    const latestTimestamp = Math.max(...tagItems.map(i => i.createdAt || 0))
    clusters.push({ tag, items: tagItems, count: tagItems.length, latestTimestamp })
  }

  clusters.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    return b.latestTimestamp - a.latestTimestamp
  })

  return clusters.slice(0, 10)
}
