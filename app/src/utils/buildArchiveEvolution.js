function groupByMonth(items) {
  const groups = {}
  for (const item of items) {
    const ts = item.createdAt
    if (typeof ts !== 'number' || !isFinite(ts) || ts <= 0) continue
    const d = new Date(ts)
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  return groups
}

function tagCounts(arr) {
  const counts = {}
  for (const item of arr) {
    for (const tag of (Array.isArray(item.tags) ? item.tags : [])) {
      if (tag) counts[tag] = (counts[tag] || 0) + 1
    }
  }
  return counts
}

function sourceCounts(arr) {
  const counts = {}
  for (const item of arr) {
    const src = item.source || item.metadata?.source
    if (src) counts[src] = (counts[src] || 0) + 1
  }
  return counts
}

function capitalize(str) {
  return String(str).charAt(0).toUpperCase() + String(str).slice(1)
}

const EMPTY = { evolvingTags: [], emergingSources: [], recurringThemes: [], shifts: [] }

export function buildArchiveEvolution(items) {
  if (!Array.isArray(items) || items.length < 10) return EMPTY

  const groups = groupByMonth(items)
  const keys = Object.keys(groups).sort()

  if (keys.length < 3) return EMPTY

  const mid = Math.floor(keys.length / 2)
  const earlierKeys = keys.slice(0, mid)
  const recentKeys = keys.slice(mid)

  const earlierItems = earlierKeys.flatMap(k => groups[k])
  const recentItems = recentKeys.flatMap(k => groups[k])

  const eTagCounts = tagCounts(earlierItems)
  const rTagCounts = tagCounts(recentItems)
  const eSrcCounts = sourceCounts(earlierItems)
  const rSrcCounts = sourceCounts(recentItems)

  const earlierLen = Math.max(earlierItems.length, 1)
  const recentLen = Math.max(recentItems.length, 1)

  // evolvingTags: growing rate from earlier → recent
  const evolvingTags = []
  for (const [tag, rCount] of Object.entries(rTagCounts)) {
    if (rCount < 3) continue
    const eCount = eTagCounts[tag] || 0
    const rRate = rCount / recentLen
    const eRate = eCount / earlierLen
    if (rRate >= 0.1 && rRate > eRate * 1.5) {
      evolvingTags.push({ tag, recentCount: rCount, earlierCount: eCount })
    }
  }
  evolvingTags.sort((a, b) => b.recentCount - a.recentCount)

  // emergingSources: growing dominance from earlier → recent
  const emergingSources = []
  for (const [src, rCount] of Object.entries(rSrcCounts)) {
    if (rCount < 3) continue
    const eCount = eSrcCounts[src] || 0
    const rRate = rCount / recentLen
    const eRate = eCount / earlierLen
    if (rRate >= 0.15 && rRate > eRate * 1.5) {
      emergingSources.push({ source: src, recentCount: rCount, earlierCount: eCount })
    }
  }
  emergingSources.sort((a, b) => b.recentCount - a.recentCount)

  // recurringThemes: tags present in ≥ 3 distinct months
  const tagMonths = {}
  for (const [key, monthItems] of Object.entries(groups)) {
    for (const item of monthItems) {
      for (const tag of (Array.isArray(item.tags) ? item.tags : [])) {
        if (!tag) continue
        if (!tagMonths[tag]) tagMonths[tag] = new Set()
        tagMonths[tag].add(key)
      }
    }
  }

  const recurringThemes = []
  for (const [tag, monthSet] of Object.entries(tagMonths)) {
    if (monthSet.size < 3) continue
    const total = (eTagCounts[tag] || 0) + (rTagCounts[tag] || 0)
    if (total >= 5) recurringThemes.push({ tag, monthCount: monthSet.size, totalCount: total })
  }
  recurringThemes.sort((a, b) => b.monthCount - a.monthCount || b.totalCount - a.totalCount)

  // shifts: calm observational sentences
  const shifts = []
  for (const { tag } of evolvingTags.slice(0, 2)) {
    shifts.push(`${capitalize(tag)} has become more frequent recently.`)
  }
  for (const { source } of emergingSources.slice(0, 1)) {
    shifts.push(`You've been saving more from ${source} lately.`)
  }
  for (const { tag } of recurringThemes.slice(0, 2)) {
    if (!evolvingTags.find(e => e.tag === tag)) {
      shifts.push(`${capitalize(tag)} appears consistently across your saves.`)
    }
  }

  return {
    evolvingTags: evolvingTags.slice(0, 5),
    emergingSources: emergingSources.slice(0, 3),
    recurringThemes: recurringThemes.slice(0, 5),
    shifts: shifts.slice(0, 5),
  }
}
