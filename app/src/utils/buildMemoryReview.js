const WEEK = 7 * 24 * 60 * 60 * 1000

function capitalize(str) {
  return String(str).charAt(0).toUpperCase() + String(str).slice(1)
}

function tagFrequency(items) {
  const freq = {}
  for (const item of items) {
    for (const tag of (Array.isArray(item.tags) ? item.tags : [])) {
      if (tag) freq[tag] = (freq[tag] || 0) + 1
    }
  }
  return freq
}

function sourceFrequency(items) {
  const freq = {}
  for (const item of items) {
    const src = item.source || item.metadata?.source
    if (src) freq[src] = (freq[src] || 0) + 1
  }
  return freq
}

function periodLabel(weekItems) {
  const timestamps = weekItems.map(i => i.createdAt).filter(t => typeof t === 'number' && isFinite(t))
  if (!timestamps.length) return 'This week'
  const earliest = new Date(Math.min(...timestamps))
  const latest = new Date(Math.max(...timestamps))
  const fmt = d => `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`
  if (fmt(earliest) === fmt(latest)) return fmt(earliest)
  return `${fmt(earliest)}–${fmt(latest)}`
}

export function buildMemoryReview(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { period: 'This week', observations: [] }
  }

  const now = Date.now()
  const weekCutoff = now - WEEK

  const weekItems = items.filter(i =>
    typeof i.createdAt === 'number' && isFinite(i.createdAt) && i.createdAt > 0 && i.createdAt >= weekCutoff
  )

  if (weekItems.length < 3) return { period: 'This week', observations: [] }

  const baselineItems = items.filter(i =>
    typeof i.createdAt === 'number' && isFinite(i.createdAt) && i.createdAt > 0 && i.createdAt < weekCutoff
  )

  const weekLen = weekItems.length
  const baselineLen = baselineItems.length
  const observations = []

  // Baseline weekly average from actual history span
  let baselineWeeklyAvg = 0
  if (baselineLen > 0) {
    const oldestTs = Math.min(...baselineItems.map(i => i.createdAt))
    const spanWeeks = Math.max((weekCutoff - oldestTs) / WEEK, 1)
    baselineWeeklyAvg = baselineLen / spanWeeks
  }

  // Journal pattern — elevated rate vs baseline
  const weekJournals = weekItems.filter(i => i.type === 'journal').length
  const weekJournalRate = weekJournals / weekLen
  const baselineJournalRate = baselineLen > 0
    ? baselineItems.filter(i => i.type === 'journal').length / baselineLen
    : 0
  if (weekJournals >= 2 && weekJournalRate >= 0.2 && (baselineLen === 0 || weekJournalRate > baselineJournalRate * 1.5)) {
    observations.push('You journaled more than usual recently.')
  }

  // Dominant tag this week
  const wTagFreq = tagFrequency(weekItems)
  const topTagEntry = Object.entries(wTagFreq).sort((a, b) => b[1] - a[1])[0]
  if (topTagEntry && topTagEntry[1] >= 2 && topTagEntry[1] / weekLen >= 0.25) {
    observations.push(`${capitalize(topTagEntry[0])} themes appeared repeatedly.`)
  }

  // Dominant source this week
  const wSrcFreq = sourceFrequency(weekItems)
  const topSrcEntry = Object.entries(wSrcFreq).sort((a, b) => b[1] - a[1])[0]
  if (topSrcEntry && topSrcEntry[1] >= 2 && topSrcEntry[1] / weekLen >= 0.35) {
    observations.push(`You saved mostly from ${topSrcEntry[0]} this week.`)
  }

  // Visual content cluster
  const visualCount = weekItems.filter(i => Boolean(i.thumbnail)).length
  if (visualCount >= 2 && visualCount / weekLen >= 0.5) {
    observations.push('You saved mostly visual content this week.')
  }

  // Volume vs baseline weekly average
  if (baselineWeeklyAvg >= 2) {
    if (weekLen >= baselineWeeklyAvg * 1.6) {
      observations.push('You saved more than usual this week.')
    } else if (weekLen <= baselineWeeklyAvg * 0.4) {
      observations.push('A quieter week for saving.')
    }
  }

  return {
    period: periodLabel(weekItems),
    observations: observations.slice(0, 5),
  }
}
