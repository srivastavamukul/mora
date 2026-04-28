const KEY = 'mora_events'
const MAX = 1000

export function getEvents() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}

export function logEvent(itemId, type) {
  if (!itemId || !type) return
  const events = getEvents()
  events.push({ itemId, type, ts: Date.now() })
  if (events.length > MAX) events.splice(0, events.length - MAX)
  localStorage.setItem(KEY, JSON.stringify(events))
}
