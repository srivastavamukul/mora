import { getContext } from './getContext.js'

const NIGHT_TAGS = ['chill', 'calm', 'watch']
const MORNING_TAGS = ['focus', 'learn', 'read']

function itemTags(item) {
  const tags = item.tags?.map(t => t.toLowerCase()) || []
  const mood = item.mood?.toLowerCase()
  return mood ? [...tags, mood] : tags
}

function getRecentEventTags(items) {
  try {
    const events = JSON.parse(localStorage.getItem('mora_events') || '[]')
    const last10 = events.slice(-10)
    const ids = new Set(last10.map(e => e.itemId))
    const tags = []
    for (const item of items || []) {
      if (ids.has(item.id)) {
        tags.push(...itemTags(item))
      }
    }
    return tags
  } catch {
    return []
  }
}

export function getContextScore(item, allItems) {
  const ctx = getContext()
  const tags = itemTags(item)
  let score = 0
  let reason

  if (ctx.isNight && NIGHT_TAGS.some(t => tags.includes(t))) {
    score += 5
    reason = 'Good fit for tonight'
  } else if ((ctx.isMorning || ctx.isWorkHours) && MORNING_TAGS.some(t => tags.includes(t))) {
    score += 5
    reason = 'Good for focus time'
  }

  if (tags.length > 0) {
    const recentTags = getRecentEventTags(allItems)
    if (recentTags.some(t => tags.includes(t))) {
      score += 3
      if (!reason) reason = 'Matches recent activity'
    }
  }

  if (score > 10) score = 10

  return { score, reason }
}
