export function getRelatedItems(item, items) {
  if (!item || !Array.isArray(items)) return []
  const itemTags = new Set(Array.isArray(item.tags) ? item.tags : [])

  return items
    .filter(i => i.id !== item.id)
    .map(i => {
      let score = 0
      const iTags = Array.isArray(i.tags) ? i.tags : []
      for (const tag of iTags) {
        if (itemTags.has(tag)) score += 2
      }
      if (item.source && i.source && i.source === item.source) score += 1
      if (item.type && i.type && i.type === item.type) score += 1
      return { item: i, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ item: i }) => i)
}
