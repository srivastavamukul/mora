export function getRecentReflections(items) {
  if (!Array.isArray(items)) return []
  return items
    .filter(item => item.type === 'journal')
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 10)
}
