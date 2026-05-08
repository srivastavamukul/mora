import { getItemMemoryText } from './getItemMemoryText'
import { getRecencyScore } from './getRecencyScore'

function normalize(str) {
  return str.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

export function scoreSearchMatch(query, item) {
  const q = normalize(query)
  if (!q) return 0

  const text = normalize(getItemMemoryText(item))
  const words = q.split(' ').filter(Boolean)

  let score = 0

  if (text.includes(q)) score += 5

  for (const word of words) {
    const wordBoundary = new RegExp(`\\b${word}\\b`)
    if (wordBoundary.test(text)) {
      score += 3
    } else if (text.includes(word)) {
      score += 1
    }
  }

  if (score === 0) return 0

  score += getRecencyScore(item.createdAt) * 0.3
  return score
}

export function semanticSearch(query, items) {
  const q = query.trim()
  if (!q) return items

  return items
    .map(item => ({ item, score: scoreSearchMatch(query, item) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item)
}
