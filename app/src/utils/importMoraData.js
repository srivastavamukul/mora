import { migrateItem } from './migrateItem'

export function importMoraData(json) {
  let parsed
  try {
    parsed = JSON.parse(json)
  } catch {
    return { ok: false, error: 'Invalid JSON — file may be corrupted.' }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'Backup must be a JSON object.' }
  }

  const rawItems = Array.isArray(parsed.items) ? parsed.items : []
  const items = rawItems
    .filter(i => i !== null && typeof i === 'object' && !Array.isArray(i))
    .map(migrateItem)
    .filter(Boolean)

  const rawSources = Array.isArray(parsed.sources) ? parsed.sources : []
  const sources = rawSources.filter(
    s => s !== null && typeof s === 'object' && !Array.isArray(s) && typeof s.id === 'string'
  )

  const rawFlags = (
    parsed.flags !== null &&
    typeof parsed.flags === 'object' &&
    !Array.isArray(parsed.flags)
  ) ? parsed.flags : {}

  const flags = {}
  for (const [key, val] of Object.entries(rawFlags)) {
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      flags[key] = val
    }
  }

  return { ok: true, data: { items, sources, flags } }
}
