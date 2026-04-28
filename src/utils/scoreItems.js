import { getEngagementScore } from './engagementScore.js'
import { getContextScore } from './contextScore.js'

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000
const TWO_DAYS = 2 * 24 * 60 * 60 * 1000

const NIGHT_KEYWORDS = ['chill', 'calm', 'watch', 'music']
const FOCUS_KEYWORDS = ['focus', 'learn', 'read']

function hasKeyword(item, keywords) {
  const mood = item.mood?.toLowerCase() || ''
  const tags = item.tags?.map(t => t.toLowerCase()) || []
  return keywords.some(kw => mood.includes(kw) || tags.includes(kw))
}

export function scoreItems(items, flags, context) {
  const now = Date.now()

  return items.map(item => {
    let score = 0
    const reasons = []
    let bucket = 'normal'

    const itemFlags = flags?.[item.id] || {}
    const isSaved = !!itemFlags.isSaved
    const isTried = !!itemFlags.isTried

    if (isSaved && !isTried) {
      score += 50
      bucket = 'priority'
      reasons.push('Saved but not tried')
    }

    if (isTried) {
      score -= 20
      bucket = 'low'
    }

    const ageMs = now - (item.createdAt || now)
    if (ageMs > THIRTY_DAYS) {
      score += 30
      reasons.push('Not revisited in a while')
    } else if (ageMs > SEVEN_DAYS) {
      score += 20
      reasons.push('Not revisited in a while')
    } else if (ageMs < TWO_DAYS) {
      score += 5
    }

    if (item.updatedAt && now - item.updatedAt < TWO_DAYS) {
      score -= 10
    }

    if (context?.isNight && hasKeyword(item, NIGHT_KEYWORDS)) {
      score += 10
      reasons.push('Good fit for tonight')
    }

    if ((context?.isMorning || context?.isWorkHours) && hasKeyword(item, FOCUS_KEYWORDS)) {
      score += 10
      reasons.push('Good for focus time')
    }

    const eng = getEngagementScore(item.id)
    if (eng.score > 0) {
      score += eng.score
      reasons.push(eng.reasons[0])
    }

    const ctx = getContextScore(item, items)
    if (ctx.score > 0) {
      score += ctx.score
      if (ctx.reason) reasons.push(ctx.reason)
    }

    return {
      item,
      score,
      reasons: reasons.slice(0, 2),
      bucket,
    }
  }).sort((a, b) => b.score - a.score)
}
