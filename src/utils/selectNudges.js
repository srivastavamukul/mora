function idTiebreak(id) {
  let h = 0
  const s = String(id)
  for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i)) % 1000
  return h
}

export function selectNudges(scoredItems) {
  if (!scoredItems?.length) return []

  const sorted = [...scoredItems].sort((a, b) => {
    const diff = b.score - a.score
    if (Math.abs(diff) < 5) return idTiebreak(a.item.id) - idTiebreak(b.item.id)
    return diff
  })

  const typeCount = {}
  const selected = []

  for (const scored of sorted) {
    const type = scored.item.type || scored.item.filterKey || 'link'
    typeCount[type] = (typeCount[type] || 0) + 1
    if (typeCount[type] <= 2) {
      selected.push(scored)
      if (selected.length >= 8) break
    }
  }

  const types = new Set(selected.map(s => s.item.type || s.item.filterKey || 'link'))
  if (types.size === 1) {
    for (const scored of sorted) {
      if (selected.includes(scored)) continue
      const type = scored.item.type || scored.item.filterKey || 'link'
      if (!types.has(type)) {
        selected.push(scored)
        break
      }
    }
  }

  return selected
}
