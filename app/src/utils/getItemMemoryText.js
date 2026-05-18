import { enrichSemanticMetadata } from './enrichSemanticMetadata'

export function getItemMemoryText(item) {
  if (!item) return ''
  const { entities, themes } = enrichSemanticMetadata(item)
  const parts = [
    item.title || '',
    item.description || item.body || '',
    Array.isArray(item.tags) ? item.tags.join(' ') : '',
    item.source || '',
    item.type || '',
    item.privateNote || '',
    item.collection || '',
    entities.join(' '),
    themes.join(' '),
  ]
  return parts.filter(Boolean).join(' ').toLowerCase().trim()
}
