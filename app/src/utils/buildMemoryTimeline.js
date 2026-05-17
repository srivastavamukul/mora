const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function dominant(arr) {
  if (!arr.length) return null
  const freq = {}
  for (const v of arr) if (v) freq[v] = (freq[v] || 0) + 1
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1])
  if (!sorted.length) return null
  const [top, count] = sorted[0]
  return count / arr.length >= 0.25 ? top : null
}

function buildInsight(monthName, count, dominantTag, dominantSource) {
  if (count < 3) return null
  if (dominantTag) return `${monthName} was focused on ${dominantTag}.`
  if (dominantSource) return `Saved mostly from ${dominantSource} in ${monthName}.`
  return null
}

export function buildMemoryTimeline(items) {
  const groups = {}
  for (const item of items) {
    const ts = item.createdAt
    if (typeof ts !== 'number' || !isFinite(ts) || ts <= 0) continue
    const d = new Date(ts)
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
    if (!groups[key]) groups[key] = { year: d.getFullYear(), month: d.getMonth(), items: [] }
    groups[key].items.push(item)
  }

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, { year, month, items: groupItems }]) => {
      const monthName = MONTH_NAMES[month]
      const periodLabel = `${monthName} ${year}`
      const allTags = groupItems.flatMap(item => (Array.isArray(item.tags) ? item.tags : []))
      const allSources = groupItems.map(item => item.source || item.metadata?.source || 'web')
      const dominantTag = dominant(allTags)
      const dominantSource = dominant(allSources)
      const insight = buildInsight(monthName, groupItems.length, dominantTag, dominantSource)
      return {
        periodLabel,
        items: groupItems,
        dominantTag,
        dominantSource,
        insight,
        count: groupItems.length,
      }
    })
}
