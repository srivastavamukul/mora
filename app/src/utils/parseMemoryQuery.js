import { liftThemes, FILLER_WORDS } from './enrichSemanticMetadata'

const TREND_RE = /\b(lately|recently|been\s+(thinking|saving|collecting|looking)|keep\s+saving|often|frequently|a\s+lot|what\s+am\s+i|trending)\b/i
const RELATED_RE = /\b(similar|related|like\s+this|anything\s+(like|related)|more\s+like)\b/i

const TIME_PHRASES = [
  ['last week', { period: 'week' }],
  ['last month', { period: 'month' }],
  ['last year', { period: 'year' }],
  ['this week', { period: 'week' }],
  ['this month', { period: 'month' }],
  ['yesterday', { period: 'yesterday' }],
  ['today', { period: 'today' }],
  ['recently', { period: 'recent' }],
  ['lately', { period: 'recent' }],
  ['recent', { period: 'recent' }],
]

const SOURCE_MAP = {
  youtube: 'youtube',
  video: 'youtube',
  videos: 'youtube',
  instagram: 'instagram',
  twitter: 'twitter',
  tweet: 'twitter',
  tweets: 'twitter',
  pinterest: 'pinterest',
  pin: 'pinterest',
  pins: 'pinterest',
  tiktok: 'tiktok',
  reddit: 'reddit',
  medium: 'medium',
  article: 'article',
  articles: 'article',
  substack: 'substack',
  podcast: 'podcast',
  podcasts: 'podcast',
}

const QUERY_STOP = new Set([
  'what', 'when', 'where', 'which', 'who', 'why', 'how',
  'show', 'find', 'give', 'tell', 'search', 'look', 'fetch',
  'have', 'been', 'save', 'saved', 'saving', 'anything', 'something',
  'that', 'this', 'with', 'from', 'about', 'into', 'their', 'them',
  'there', 'these', 'those', 'here', 'some', 'more', 'also',
  'than', 'much', 'many', 'most', 'your', 'mine',
  'will', 'would', 'could', 'should', 'does',
  'last', 'month', 'week', 'year', 'today', 'yesterday', 'recent', 'lately', 'recently', 'ago',
])

function detectTimeFilters(q) {
  for (const [phrase, filter] of TIME_PHRASES) {
    if (q.includes(phrase)) return filter
  }
  return null
}

function detectSourceFilters(tokens) {
  const found = new Set()
  for (const t of tokens) {
    if (SOURCE_MAP[t]) found.add(SOURCE_MAP[t])
  }
  return [...found]
}

export function parseMemoryQuery(query) {
  const empty = { intent: 'recall', entities: [], themes: [], sourceFilters: [], timeFilters: null }
  if (!query || typeof query !== 'string') return empty

  const q = query.trim().toLowerCase()
  if (!q) return empty

  const tokens = q.split(/\W+/).filter(t => t.length > 1)
  const contentTokens = tokens.filter(t => !FILLER_WORDS.has(t))

  const timeFilters = detectTimeFilters(q)
  const sourceFilters = detectSourceFilters(tokens)
  const themes = liftThemes(contentTokens)
  const entities = contentTokens
    .filter(t => !SOURCE_MAP[t] && !QUERY_STOP.has(t) && t.length > 3)
    .slice(0, 3)

  let intent = 'recall'
  if (TREND_RE.test(q)) {
    intent = 'trend'
  } else if (RELATED_RE.test(q)) {
    intent = 'related'
  } else if (sourceFilters.length > 0 && (themes.length > 0 || entities.length > 0)) {
    intent = 'source-specific'
  } else if (timeFilters && themes.length === 0 && entities.length <= 1) {
    intent = 'time-based'
  }

  return { intent, entities, themes, sourceFilters, timeFilters }
}
