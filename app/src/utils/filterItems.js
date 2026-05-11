export function normalizeTag(t) {
  return String(t).trim().toLowerCase()
}

export function getTopTags(items, n = 10) {
  const freq = {}
  for (const item of items) {
    if (!Array.isArray(item.tags)) continue
    for (const raw of item.tags) {
      const tag = normalizeTag(raw)
      if (!tag) continue
      freq[tag] = (freq[tag] || 0) + 1
    }
  }
  return Object.keys(freq)
    .sort((a, b) => freq[b] - freq[a] || a.localeCompare(b))
    .slice(0, n)
    .map(tag => ({ tag, count: freq[tag] }))
}

export function filterItemsAdvanced(memories, { type = 'all', tags = [], source = null } = {}) {
  return memories.filter(memory => {
    if (type !== 'all' && memory.type !== type) return false
    if (source !== null && normalizeTag(memory.source) !== normalizeTag(source)) return false
    if (tags.length > 0) {
      const memTags = Array.isArray(memory.tags) ? memory.tags.map(normalizeTag) : []
      if (!tags.every(t => memTags.includes(normalizeTag(t)))) return false
    }
    return true
  })
}
