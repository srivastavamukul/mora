import { enrichSemanticMetadata } from './enrichSemanticMetadata'
import { buildMemoryEvolution } from './buildMemoryEvolution'
import { buildResurfacingSignals } from './buildResurfacingSignals'

const THEME_PHRASE = {
  'Online Income': 'building income online',
  'Entrepreneurship': 'entrepreneurship',
  'Freelancing': 'freelancing',
  'Business': 'business strategy',
  'Branding': 'branding',
  'Marketing': 'marketing',
  'Sales': 'sales',
  'Software Business': 'software products',
  'Investing': 'investing',
  'Personal Finance': 'personal finance',
  'Wealth Building': 'wealth building',
  'Cryptocurrency': 'crypto',
  'Technology': 'technology',
  'Software': 'software',
  'Programming': 'programming',
  'Software Development': 'software development',
  'Engineering': 'engineering',
  'Artificial Intelligence': 'AI',
  'Data Science': 'data science',
  'Design': 'design',
  'UX/UI Design': 'product design',
  'Graphic Design': 'graphic design',
  'Visual Design': 'visual design',
  'Art': 'art',
  'Creativity': 'creative thinking',
  'Illustration': 'illustration',
  'Photography': 'photography',
  'Cinema': 'film and cinema',
  'Entertainment': 'entertainment',
  'Gaming': 'gaming',
  'Podcasts': 'podcasts',
  'Music': 'music',
  'Health': 'health',
  'Fitness': 'fitness',
  'Wellness': 'wellness',
  'Mindfulness': 'mindfulness',
  'Food': 'food',
  'Travel': 'travel',
  'Lifestyle': 'lifestyle',
  'Fashion': 'fashion',
  'Learning': 'learning',
  'Education': 'education',
  'Productivity': 'productivity',
  'Personal Development': 'personal growth',
  'Writing': 'writing',
  'Books': 'books and ideas',
  'Reading': 'reading',
  'Research': 'research',
  'Science': 'science',
  'Psychology': 'psychology',
  'Philosophy': 'philosophy',
  'Spirituality': 'spirituality',
}

const PLATFORM_THEMES = new Set([
  'Social Media', 'Video Content', 'Visual Discovery', 'Content Creation', 'Influencer Marketing',
])

function phrase(theme) {
  return THEME_PHRASE[theme] || theme.toLowerCase()
}

function getThemesForItem(item) {
  const tags = Array.isArray(item.tags) ? item.tags : []
  const { themes } = enrichSemanticMetadata(item)
  return [...new Set([...tags, ...themes])]
}

function buildThemeMap(items) {
  const map = {}
  for (const item of items) {
    for (const theme of getThemesForItem(item)) {
      if (!theme || PLATFORM_THEMES.has(theme)) continue
      map[theme] = (map[theme] || 0) + 1
    }
  }
  return map
}

function buildSourceMap(items) {
  const map = {}
  for (const item of items) {
    const src = item.source || item.metadata?.source
    if (src) map[src] = (map[src] || 0) + 1
  }
  return map
}

function groupByMonth(items) {
  const groups = {}
  for (const item of items) {
    const ts = item.createdAt
    if (typeof ts !== 'number' || !isFinite(ts) || ts <= 0) continue
    const d = new Date(ts)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  return groups
}

const EMPTY = {
  year: new Date().getFullYear(),
  totalItems: 0,
  dominantThemes: [],
  dominantSources: [],
  strongestPeriod: null,
  observations: [],
}

export function buildYearlyMemoryReview(items) {
  if (!Array.isArray(items) || items.length < 5) return EMPTY

  const now = Date.now()
  const year = new Date(now).getFullYear()
  const yearStart = new Date(year, 0, 1).getTime()

  const yearItems = items.filter(i =>
    typeof i.createdAt === 'number' && isFinite(i.createdAt) && i.createdAt > 0 && i.createdAt >= yearStart
  )

  if (yearItems.length < 5) return EMPTY

  const total = yearItems.length

  const themeMap = buildThemeMap(yearItems)
  const dominantThemes = Object.entries(themeMap)
    .filter(([, c]) => c >= 3 && c / total >= 0.10)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([t]) => t)

  const srcMap = buildSourceMap(yearItems)
  const dominantSources = Object.entries(srcMap)
    .filter(([, c]) => c >= 3 && c / total >= 0.15)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([s]) => s)

  const monthGroups = groupByMonth(yearItems)
  let strongestPeriod = null
  let maxMonthCount = 0
  for (const [key, groupItems] of Object.entries(monthGroups)) {
    if (groupItems.length > maxMonthCount) {
      maxMonthCount = groupItems.length
      const [yr, mo] = key.split('-').map(Number)
      strongestPeriod = new Date(yr, mo - 1, 1).toLocaleString('default', { month: 'long' })
    }
  }

  const observations = []

  if (dominantThemes.length >= 2) {
    observations.push(`This year, ${phrase(dominantThemes[0])} and ${phrase(dominantThemes[1])} appeared repeatedly.`)
  } else if (dominantThemes.length === 1) {
    observations.push(`This year, ${phrase(dominantThemes[0])} appeared repeatedly.`)
  }

  if (dominantSources.length > 0) {
    observations.push(`Most exploration came from ${dominantSources[0]}.`)
  }

  if (strongestPeriod && maxMonthCount >= 5) {
    observations.push(`${strongestPeriod} showed the strongest activity.`)
  }

  const signals = buildResurfacingSignals(yearItems)
  if (signals.recurringThemes.length > 0) {
    const topRecurring = signals.recurringThemes[0]
    if (!dominantThemes.includes(topRecurring.theme)) {
      observations.push(`${topRecurring.theme} ideas returned across multiple periods.`)
    } else if (signals.recurringThemes.length > 1) {
      const second = signals.recurringThemes[1]
      if (!dominantThemes.includes(second.theme)) {
        observations.push(`${second.theme} ideas returned across multiple periods.`)
      }
    }
  }

  const evolution = buildMemoryEvolution(yearItems)
  if (evolution.periods.length >= 2) {
    const latest = evolution.periods[0]
    const oldest = evolution.periods[evolution.periods.length - 1]
    if (
      latest.dominantThemes[0] &&
      oldest.dominantThemes[0] &&
      latest.dominantThemes[0] !== oldest.dominantThemes[0]
    ) {
      observations.push(`Your archive shifted toward ${phrase(latest.dominantThemes[0])}.`)
    }
  }

  const journalCount = yearItems.filter(i => i.type === 'journal').length
  if (journalCount >= 3 && journalCount / total >= 0.10) {
    observations.push('Journaling was a recurring thread this year.')
  }

  return {
    year,
    totalItems: total,
    dominantThemes,
    dominantSources,
    strongestPeriod,
    observations: observations.slice(0, 6),
  }
}
