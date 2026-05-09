const CATEGORY_KEYWORDS = {
  creativity:    ['design', 'art', 'music', 'illustration', 'color', 'aesthetic', 'visual', 'photography', 'animation', 'typography', 'creative', 'draw', 'film'],
  learning:      ['learn', 'tutorial', 'guide', 'course', 'education', 'study', 'research', 'science', 'programming', 'code', 'development', 'engineering', 'tech'],
  inspiration:   ['inspiration', 'motivation', 'mindset', 'ideas', 'quotes', 'philosophy', 'culture', 'perspective'],
  productivity:  ['productivity', 'focus', 'work', 'tools', 'workflow', 'efficiency', 'habit', 'planning', 'organization', 'time'],
  entertainment: ['entertainment', 'gaming', 'sports', 'comedy', 'memes', 'podcast', 'movies', 'shows'],
  personal:      ['health', 'fitness', 'food', 'travel', 'fashion', 'lifestyle', 'family', 'home'],
}

const CATEGORY_LABELS = {
  creativity:    'creativity',
  learning:      'learning',
  inspiration:   'inspiration',
  productivity:  'productivity',
  entertainment: 'entertainment',
  personal:      'personal',
}

function dominantCategory(topTags) {
  const scores = {}
  for (const { tag, count } of topTags) {
    const t = tag.toLowerCase()
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(k => t.includes(k) || k.includes(t))) {
        scores[cat] = (scores[cat] || 0) + count
      }
    }
  }
  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1])
  if (!entries.length) return null
  return { category: entries[0][0], total: entries[0][1] }
}

export function buildMemoryInsights(items, behaviorSignals, interestClusters) {
  if (!Array.isArray(items) || items.length < 5) return []

  const signals = behaviorSignals || { topSources: [], topTags: [], dominantType: null, saveFrequency: 'low' }
  const topTags = signals.topTags || []
  const topSources = signals.topSources || []
  const total = items.length

  const insights = []

  // Tag insight: top tag count >= 3 AND ratio >= 20%
  const topTag = topTags[0]
  if (topTag && topTag.count >= 3 && topTag.count / total >= 0.2) {
    insights.push(`You save a lot of ${topTag.tag}-related content`)
  }

  // Source insight: top source count >= 3 AND ratio >= 30%
  const topSource = topSources[0]
  if (topSource && topSource.count >= 3 && topSource.count / total >= 0.3) {
    insights.push(`Most of your recent saves come from ${topSource.source}`)
  }

  // Visual insight: >= 5 thumbnails AND ratio >= 50%
  const thumbCount = items.filter(i => i.thumbnail).length
  if (thumbCount >= 5 && thumbCount / total >= 0.5) {
    insights.push('Your saves are heavily visual lately')
  }

  // Category insight: dominant category with combined count >= 5
  const cat = dominantCategory(topTags)
  if (cat && cat.total >= 5) {
    insights.push(`You tend to save a lot of ${CATEGORY_LABELS[cat.category]} content`)
  }

  // Frequency insight
  if (signals.saveFrequency === 'high') {
    insights.push("You've been saving a lot lately — you're in an active discovery phase")
  }

  return insights.slice(0, 5)
}
