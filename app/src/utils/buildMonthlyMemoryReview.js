import { enrichSemanticMetadata } from './enrichSemanticMetadata'

const DAY = 86400000
const MONTH_WINDOW = 30 * DAY
const PREV_MONTH_WINDOW = 60 * DAY

const THEME_PHRASE = {
  'Online Income': 'building income online',
  'Entrepreneurship': 'entrepreneurship and growth',
  'Freelancing': 'freelancing and independent work',
  'Business': 'business strategy',
  'Branding': 'building a brand',
  'Marketing': 'marketing and reach',
  'Sales': 'sales and conversion',
  'Software Business': 'software products and business',
  'Investing': 'growing wealth through investing',
  'Personal Finance': 'managing personal finances',
  'Wealth Building': 'building long-term wealth',
  'Cryptocurrency': 'crypto and digital assets',
  'Technology': 'technology and tools',
  'Software': 'software and systems',
  'Programming': 'programming and code',
  'Software Development': 'software development',
  'Engineering': 'engineering and technical systems',
  'Artificial Intelligence': 'AI and machine learning',
  'Data Science': 'data and analytics',
  'Design': 'design and aesthetics',
  'UX/UI Design': 'product design and UX',
  'Graphic Design': 'graphic design',
  'Visual Design': 'visual design and composition',
  'Art': 'art and creative expression',
  'Creativity': 'creative thinking and making',
  'Illustration': 'illustration and drawing',
  'Photography': 'photography and visual storytelling',
  'Cinema': 'film and cinema',
  'Entertainment': 'entertainment and culture',
  'Gaming': 'gaming and play',
  'Podcasts': 'podcasts and conversations',
  'Music': 'music and sound',
  'Health': 'health and wellbeing',
  'Fitness': 'fitness and movement',
  'Wellness': 'wellness and self-care',
  'Mindfulness': 'mindfulness and presence',
  'Food': 'food and cooking',
  'Travel': 'travel and exploration',
  'Lifestyle': 'lifestyle and living',
  'Fashion': 'fashion and personal style',
  'Learning': 'learning and curiosity',
  'Education': 'education and knowledge',
  'Productivity': 'productivity and focus',
  'Personal Development': 'personal growth and habits',
  'Writing': 'writing and storytelling',
  'Books': 'books and ideas',
  'Reading': 'reading and reflection',
  'Research': 'research and knowledge',
  'Science': 'science and discovery',
  'Psychology': 'psychology and the mind',
  'Philosophy': 'philosophy and meaning',
  'Spirituality': 'spirituality and inner life',
}

const PLATFORM_THEMES = new Set([
  'Social Media', 'Video Content', 'Visual Discovery', 'Content Creation', 'Influencer Marketing',
])

function getThemesForItem(item) {
  const tags = Array.isArray(item.tags) ? item.tags.map(t => t.toLowerCase()) : []
  const { themes } = enrichSemanticMetadata(item)
  return [...new Set([...tags, ...themes])]
}

function sourceFrequency(items) {
  const freq = {}
  for (const item of items) {
    const src = item.source || item.metadata?.source
    if (src) freq[src] = (freq[src] || 0) + 1
  }
  return freq
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

function monthLabel(items) {
  const timestamps = items.map(i => i.createdAt).filter(t => typeof t === 'number' && isFinite(t))
  if (!timestamps.length) {
    return new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  }
  return new Date(Math.max(...timestamps)).toLocaleString('default', { month: 'long', year: 'numeric' })
}

const EMPTY = { month: '', totalItems: 0, dominantThemes: [], dominantSources: [], journalCount: 0, observations: [] }

export function buildMonthlyMemoryReview(items) {
  if (!Array.isArray(items) || items.length === 0) return EMPTY

  const now = Date.now()
  const monthCutoff = now - MONTH_WINDOW

  const monthItems = items.filter(i =>
    typeof i.createdAt === 'number' && isFinite(i.createdAt) && i.createdAt > 0 && i.createdAt >= monthCutoff
  )

  if (monthItems.length < 3) return EMPTY

  const prevItems = items.filter(i =>
    typeof i.createdAt === 'number' && isFinite(i.createdAt) && i.createdAt > 0 &&
    i.createdAt >= now - PREV_MONTH_WINDOW && i.createdAt < monthCutoff
  )

  const monthLen = monthItems.length
  const prevLen = prevItems.length

  const themeMap = buildThemeMap(monthItems)

  const dominantThemes = Object.entries(themeMap)
    .filter(([, count]) => count >= 2 && count / monthLen >= 0.15)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([theme]) => theme)

  const srcFreq = sourceFrequency(monthItems)
  const dominantSources = Object.entries(srcFreq)
    .filter(([, count]) => count >= 2 && count / monthLen >= 0.25)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([src]) => src)

  const journalCount = monthItems.filter(i => i.type === 'journal').length
  const observations = []

  // Recurring theme(s)
  if (dominantThemes.length >= 2) {
    const p1 = THEME_PHRASE[dominantThemes[0]] || dominantThemes[0].toLowerCase()
    const p2 = (THEME_PHRASE[dominantThemes[1]] || dominantThemes[1]).toLowerCase()
    observations.push(`This month, ${p1} and ${p2} appeared repeatedly.`)
  } else if (dominantThemes.length === 1) {
    const phrase = THEME_PHRASE[dominantThemes[0]] || dominantThemes[0].toLowerCase()
    observations.push(`This month, ${phrase} appeared repeatedly.`)
  }

  // Revisiting a theme from last month
  if (dominantThemes.length > 0 && prevLen > 0) {
    const prevThemeMap = buildThemeMap(prevItems)
    const topTheme = dominantThemes[0]
    if (prevThemeMap[topTheme] && prevThemeMap[topTheme] >= 2) {
      const phrase = THEME_PHRASE[topTheme] || topTheme.toLowerCase()
      observations.push(`You revisited ${phrase} again this month.`)
    }
  }

  // Dominant source
  if (dominantSources.length > 0) {
    observations.push(`Most of your exploration came from ${dominantSources[0]}.`)
  }

  // Visual content cluster
  const visualCount = monthItems.filter(i => Boolean(i.thumbnail)).length
  if (visualCount >= 3 && visualCount / monthLen >= 0.5) {
    observations.push('Visual inspiration increased this month.')
  }

  // Journaling frequency vs prior month
  const journalRate = journalCount / monthLen
  const prevJournalRate = prevLen > 0
    ? prevItems.filter(i => i.type === 'journal').length / prevLen
    : 0
  if (journalCount >= 2 && journalRate >= 0.15 && (prevLen === 0 || journalRate > prevJournalRate * 1.3)) {
    observations.push('Journaling became more frequent.')
  }

  return {
    month: monthLabel(monthItems),
    totalItems: monthLen,
    dominantThemes,
    dominantSources,
    journalCount,
    observations: observations.slice(0, 5),
  }
}
