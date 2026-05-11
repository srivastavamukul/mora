export function exportMoraData(input = {}) {
  const { items, sources, flags } = input ?? {}
  const backup = {
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    items: Array.isArray(items) ? items : [],
    sources: Array.isArray(sources) ? sources : [],
    flags: (flags && typeof flags === 'object' && !Array.isArray(flags)) ? flags : {},
  }
  return JSON.stringify(backup, null, 2)
}
