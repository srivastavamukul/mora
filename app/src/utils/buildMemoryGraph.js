import { enrichSemanticMetadata } from './enrichSemanticMetadata'

const MAX_NODES = 25
const MAX_EDGES = 50
const MIN_EDGE_STRENGTH = 2

const _cache = new Map()

function getSemanticThemes(item) {
  const { themes } = enrichSemanticMetadata(item)
  return themes
}

export function buildMemoryGraph(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { nodes: [], edges: [] }
  }

  const cacheKey = `${items.length}:${items[0]?.id ?? ''}:${items[items.length - 1]?.id ?? ''}`
  if (_cache.has(cacheKey)) return _cache.get(cacheKey)

  const themeCount = new Map()
  const coCount = new Map()

  for (const item of items) {
    const themes = getSemanticThemes(item)
    if (!themes.length) continue

    for (const t of themes) {
      themeCount.set(t, (themeCount.get(t) || 0) + 1)
    }

    for (let i = 0; i < themes.length; i++) {
      for (let j = i + 1; j < themes.length; j++) {
        const [a, b] = themes[i] < themes[j]
          ? [themes[i], themes[j]]
          : [themes[j], themes[i]]
        const key = `${a}|||${b}`
        coCount.set(key, (coCount.get(key) || 0) + 1)
      }
    }
  }

  const sortedThemes = [...themeCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_NODES)

  const topThemeSet = new Set(sortedThemes.map(([t]) => t))
  const nodes = sortedThemes.map(([theme, count]) => ({ theme, count }))

  const edges = []
  for (const [key, strength] of coCount) {
    if (strength < MIN_EDGE_STRENGTH) continue
    const [source, target] = key.split('|||')
    if (!topThemeSet.has(source) || !topThemeSet.has(target)) continue
    edges.push({ source, target, strength })
  }

  edges.sort((a, b) => b.strength - a.strength)

  const result = { nodes, edges: edges.slice(0, MAX_EDGES) }

  if (_cache.size > 50) _cache.clear()
  _cache.set(cacheKey, result)

  return result
}
