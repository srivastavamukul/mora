const ANNUAL_TYPES = new Set(['birthday', 'anniversary'])

function parseDateLocal(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  d.setHours(0, 0, 0, 0)
  return d
}

function todayMidnight() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function daysUntilDate(date, today) {
  return Math.round((date - today) / 86400000)
}

function computeDaysUntil(memoryDate, memoryType) {
  const today = todayMidnight()
  const parsed = parseDateLocal(memoryDate)

  if (ANNUAL_TYPES.has(memoryType)) {
    const thisYear = new Date(today.getFullYear(), parsed.getMonth(), parsed.getDate())
    thisYear.setHours(0, 0, 0, 0)
    if (thisYear >= today) return daysUntilDate(thisYear, today)
    const nextYear = new Date(today.getFullYear() + 1, parsed.getMonth(), parsed.getDate())
    return daysUntilDate(nextYear, today)
  }

  const diff = daysUntilDate(parsed, today)
  return diff >= 0 ? diff : -1
}

function makeLabel(daysUntil) {
  if (daysUntil === 0) return 'Today'
  if (daysUntil === 1) return 'Tomorrow'
  if (daysUntil <= 6) return `In ${daysUntil} days`
  if (daysUntil <= 13) return 'Next week'
  const d = new Date()
  d.setDate(d.getDate() + daysUntil)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function getUpcomingMemoryEvents(items) {
  const results = []

  for (const item of items) {
    if (!item.memoryDate) continue
    const daysUntil = computeDaysUntil(item.memoryDate, item.memoryType)
    if (daysUntil < 0) continue
    results.push({ item, daysUntil, label: makeLabel(daysUntil) })
  }

  return results.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 10)
}
