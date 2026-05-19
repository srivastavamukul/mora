import { enrichSemanticMetadata } from './enrichSemanticMetadata'

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

function cap(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function getThemesForItem(item) {
  const tags = Array.isArray(item.tags) ? item.tags : []
  const { themes } = enrichSemanticMetadata(item)
  return [...new Set([...tags, ...themes])]
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

function periodLabel(key) {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })
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

function topThemes(themeMap, total) {
  return Object.entries(themeMap)
    .filter(([, c]) => c >= 2 && c / total >= 0.15)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t)
}

function topSources(srcMap, total) {
  return Object.entries(srcMap)
    .filter(([, c]) => c >= 2 && c / total >= 0.20)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([s]) => s)
}

function changeSignals(cur, prev, olderThemes, curMap, prevMap, curLen, prevLen) {
  const signals = []
  const curSet = new Set(cur)
  const prevSet = new Set(prev)

  // Returned: absent last period, present period before that
  if (olderThemes) {
    const olderSet = new Set(olderThemes)
    for (const t of cur) {
      if (!prevSet.has(t) && olderSet.has(t)) {
        signals.push(`You returned to ${phrase(t)}.`)
        break
      }
    }
  }

  // Shift: dominant theme swapped entirely
  if (
    prev[0] && cur[0] &&
    prev[0] !== cur[0] &&
    !curSet.has(prev[0]) &&
    !prevSet.has(cur[0])
  ) {
    signals.push(`You shifted from ${phrase(prev[0])} toward ${phrase(cur[0])}.`)
  }

  // Increased: theme present in both, rate grew significantly
  for (const t of cur) {
    if (!prevSet.has(t)) continue
    const cRate = (curMap[t] || 0) / curLen
    const pRate = (prevMap[t] || 0) / Math.max(prevLen, 1)
    if (cRate > pRate * 1.6 && (curMap[t] || 0) >= 3) {
      signals.push(`${cap(phrase(t))} increased recently.`)
      break
    }
  }

  // Faded: strong prev theme absent now
  for (const t of prev) {
    if (curSet.has(t)) continue
    const pRate = (prevMap[t] || 0) / Math.max(prevLen, 1)
    if (pRate >= 0.2 && (prevMap[t] || 0) >= 3) {
      signals.push(`${cap(phrase(t))} faded from view.`)
      break
    }
  }

  // Emerged: new theme not seen before
  for (const t of cur) {
    if (!prevSet.has(t) && !(olderThemes && new Set(olderThemes).has(t))) {
      signals.push(`${cap(phrase(t))} emerged this month.`)
      break
    }
  }

  return signals.slice(0, 2)
}

const EMPTY = { periods: [] }

export function buildMemoryEvolution(items) {
  if (!Array.isArray(items) || items.length < 5) return EMPTY

  const groups = groupByMonth(items)
  const keys = Object.keys(groups).sort().reverse()

  if (keys.length < 2) return EMPTY

  // Pre-compute per-period data
  const periodData = keys.map(key => {
    const periodItems = groups[key]
    if (periodItems.length < 3) return null
    const total = periodItems.length
    const themeMap = buildThemeMap(periodItems)
    const srcMap = buildSourceMap(periodItems)
    return {
      key,
      total,
      themeMap,
      srcMap,
      themes: topThemes(themeMap, total),
      sources: topSources(srcMap, total),
    }
  })

  const valid = periodData.filter(Boolean)
  if (valid.length < 2) return EMPTY

  const periods = valid.map((cur, i) => {
    const prev = valid[i + 1] || null
    const older = valid[i + 2] || null

    const signals = prev
      ? changeSignals(
          cur.themes, prev.themes,
          older ? older.themes : null,
          cur.themeMap, prev.themeMap,
          cur.total, prev.total,
        )
      : []

    return {
      period: periodLabel(cur.key),
      dominantThemes: cur.themes,
      dominantSources: cur.sources,
      changeSignals: signals,
    }
  })

  // Only include periods that have something to say
  const meaningful = periods.filter(p =>
    p.changeSignals.length > 0 || p.dominantThemes.length > 0
  )

  if (meaningful.length < 2) return EMPTY

  return { periods: meaningful.slice(0, 6) }
}
