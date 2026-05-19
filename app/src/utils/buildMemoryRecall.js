import { enrichSemanticMetadata } from './enrichSemanticMetadata'

const _cache = new Map()

const STOP = new Set([
  'a','an','the','is','was','are','were','i','me','my','what','that','this',
  'did','do','does','have','has','had','about','with','for','from','in','on',
  'at','of','to','and','or','but','not','it','its','be','by','as','so',
  'there','their','they','we','you','your','he','she','can','could','would',
  'should','will','just','any','all','some','which','when','who','how','been',
  'thing','stuff','something','anything','saved','save','saving','showed',
  'show','keeps','kept','keep','returning','return','returns','remember',
  'recall','find','found','tell','know','see','look','get','go','went',
])

function phrase(t) { return (t || '').toLowerCase() }
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '' }

function extractKeywords(query) {
  return query.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP.has(w))
}

function buildGraphNeighbors(keywords, graph) {
  const matched = new Set()
  const neighbors = new Set()
  if (!graph?.nodes?.length) return neighbors

  for (const { theme } of graph.nodes) {
    if (keywords.some(kw => phrase(theme).includes(kw))) matched.add(phrase(theme))
  }

  for (const node of matched) neighbors.add(node)
  for (const { source, target } of (graph.edges || [])) {
    if (matched.has(phrase(source))) neighbors.add(phrase(target))
    if (matched.has(phrase(target))) neighbors.add(phrase(source))
  }

  return neighbors
}

function scoreItem(item, keywords, graphNeighbors, recentThemeSet) {
  const text = [
    item.title || '',
    item.body || '',
    ...(Array.isArray(item.tags) ? item.tags : []),
  ].join(' ').toLowerCase()

  const { themes } = enrichSemanticMetadata(item)
  const itemThemes = themes.map(phrase)

  let score = 0
  for (const kw of keywords) {
    if (text.includes(kw)) score += 2
  }
  for (const t of itemThemes) {
    if (graphNeighbors.has(t)) score += 1
  }
  if (itemThemes.some(t => recentThemeSet.has(t))) score += 0.5

  return score
}

function recentThemeSet(evolution) {
  const themes = evolution?.periods?.[0]?.dominantThemes || []
  return new Set(themes.map(phrase))
}

function buildResponse(keywords, context, graph, evolution, ranked) {
  const themes = context?.themes || []
  const n = ranked.length

  if (n === 0) {
    const graphMatches = (graph?.nodes || [])
      .filter(({ theme }) => keywords.some(kw => phrase(theme).includes(kw)))
      .slice(0, 1)
      .map(({ theme }) => phrase(theme))

    if (graphMatches.length > 0) {
      return `${cap(graphMatches[0])} appears across your archive, though the specific memory may be harder to surface.`
    }
    return 'Nothing in your memories closely matches that, though it may live under a different theme.'
  }

  const recentPeriod = evolution?.periods?.[0]
  const recentMatch = recentPeriod?.dominantThemes?.find(t =>
    keywords.some(kw => phrase(t).includes(kw)) || themes.some(ct => phrase(t) === phrase(ct))
  )

  if (themes.length >= 2) {
    const base = `Several ${phrase(themes[0])}-related memories appear, mostly around ${phrase(themes[1])}`
    const suffix = recentMatch
      ? `, which became more active in ${recentPeriod.period}.`
      : '.'
    return cap(base + suffix)
  }

  if (themes.length === 1) {
    const base = `${cap(phrase(themes[0]))} ideas appear across your archive`
    const suffix = recentMatch
      ? `, growing more prominent in ${recentPeriod.period}.`
      : '.'
    return base + suffix
  }

  const kw = keywords[0]
  if (kw) {
    const suffix = recentMatch ? ` These ideas became more active in ${recentPeriod.period}.` : ''
    return `${cap(kw)} comes up in ${n} ${n === 1 ? 'memory' : 'memories'} across your archive.${suffix}`
  }

  return 'These memories appear across your archive.'
}

function calcConfidence(ranked, context) {
  const directHits = ranked.filter(({ score }) => score >= 4).length
  if (directHits >= 3) return 'high'
  if (directHits >= 1 || (ranked.length >= 2 && (context?.themes?.length || 0) >= 1)) return 'medium'
  return 'low'
}

export function buildMemoryRecall(query, context, graph, evolution) {
  if (!query) return { response: '', recalledItems: [], confidence: 'low' }

  const cacheKey = `${query}:${context?.relevantMemories?.length ?? 0}:${graph?.nodes?.length ?? 0}:${evolution?.periods?.length ?? 0}`
  if (_cache.has(cacheKey)) return _cache.get(cacheKey)

  const keywords = extractKeywords(query)
  const graphNeighbors = buildGraphNeighbors(keywords, graph)
  const recentThemes = recentThemeSet(evolution)

  const items = context?.relevantMemories || []

  const ranked = items
    .map(item => ({ item, score: scoreItem(item, keywords, graphNeighbors, recentThemes) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  const recalledItems = ranked.map(({ item }) => item)
  const response = buildResponse(keywords, context, graph, evolution, ranked)
  const confidence = calcConfidence(ranked, context)

  const result = { response, recalledItems, confidence }
  if (_cache.size > 50) _cache.clear()
  _cache.set(cacheKey, result)
  return result
}
