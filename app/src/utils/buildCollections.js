export function buildCollections(items) {
  const map = new Map()
  for (const item of items) {
    const name = typeof item.collection === 'string' ? item.collection.trim() : ''
    if (!name) continue
    if (!map.has(name)) map.set(name, { name, items: [], latestTimestamp: 0 })
    const group = map.get(name)
    group.items.push(item)
    if ((item.createdAt || 0) > group.latestTimestamp) {
      group.latestTimestamp = item.createdAt || 0
    }
  }
  return Array.from(map.values())
    .map(g => ({ ...g, count: g.items.length }))
    .sort((a, b) => b.latestTimestamp - a.latestTimestamp)
}
