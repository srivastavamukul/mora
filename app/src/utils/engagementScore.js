const WEIGHTS = { open: 1, save: 2, edit: 3, dismiss: -1 }
const HALF_LIFE_MS = 7 * 24 * 60 * 60 * 1000
const SCORE_CAP = 8

export function getEngagementScore(itemId) {
  if (!itemId) return { score: 0, reasons: [] }

  let events
  try {
    events = JSON.parse(localStorage.getItem('mora_events')) || []
  } catch {
    return { score: 0, reasons: [] }
  }

  const itemEvents = events.filter(e => e.itemId === itemId)
  if (!itemEvents.length) return { score: 0, reasons: [] }

  const now = Date.now()
  let raw = 0
  let opens = 0

  for (const e of itemEvents) {
    const weight = WEIGHTS[e.type] ?? 0
    if (!weight) continue
    const ageMs = now - (e.ts || now)
    const decay = Math.exp(-ageMs / HALF_LIFE_MS)
    raw += weight * decay
    if (e.type === 'open') opens++
  }

  if (opens >= 3) raw += 2

  const score = Math.min(Math.round(raw), SCORE_CAP)
  if (score <= 0) return { score: 0, reasons: [] }

  const reasons = []
  if (opens >= 3) reasons.push('Revisited multiple times')
  else if (opens >= 1) reasons.push('Recently opened')

  return { score, reasons }
}
