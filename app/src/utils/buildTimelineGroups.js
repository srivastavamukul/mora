const DAY = 86400000

export function buildTimelineGroups(items) {
  const now = Date.now()
  const todayStart = new Date().setHours(0, 0, 0, 0)
  const weekStart = todayStart - new Date().getDay() * DAY
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()

  const buckets = [
    { label: 'Today', items: [] },
    { label: 'This Week', items: [] },
    { label: 'This Month', items: [] },
    { label: 'Older', items: [] },
  ]

  for (const item of items) {
    const ts = item.createdAt || 0
    if (ts >= todayStart) buckets[0].items.push(item)
    else if (ts >= weekStart) buckets[1].items.push(item)
    else if (ts >= monthStart) buckets[2].items.push(item)
    else buckets[3].items.push(item)
  }

  return buckets.filter(b => b.items.length > 0)
}
