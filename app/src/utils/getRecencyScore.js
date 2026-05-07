const DAY = 86400000

export function getRecencyScore(timestamp) {
  const age = Date.now() - (timestamp || 0)
  if (age < DAY)       return 1.0
  if (age < 7 * DAY)   return 0.7
  if (age < 30 * DAY)  return 0.4
  if (age < 90 * DAY)  return 0.2
  return 0.05
}
