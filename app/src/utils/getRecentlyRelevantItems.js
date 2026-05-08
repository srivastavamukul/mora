import { getRecencyScore } from './getRecencyScore'

export function getRecentlyRelevantItems(items) {
  if (!Array.isArray(items) || items.length === 0) return []

  const tagFreq = {}
  for (const item of items) {
    const tags = Array.isArray(item.tags) ? item.tags : []
    for (const tag of tags) {
      tagFreq[tag] = (tagFreq[tag] || 0) + 1
    }
  }

  const top3Tags = new Set(
    Object.entries(tagFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag)
  )

  const maxTags = Math.max(...items.map(i => (Array.isArray(i.tags) ? i.tags : []).length), 1)

  return items
    .map(item => {
      const tags = Array.isArray(item.tags) ? item.tags : []
      const recency = getRecencyScore(item.createdAt)
      const density = tags.length / maxTags
      const interestBoost = tags.some(t => top3Tags.has(t)) ? 0.5 : 0
      return { item, score: recency + density + interestBoost }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ item }) => item)
}
