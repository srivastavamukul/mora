export function getItemMemoryText(item) {
  if (!item) return ''
  const parts = [
    item.title || '',
    item.description || item.body || '',
    Array.isArray(item.tags) ? item.tags.join(' ') : '',
    item.source || '',
    item.type || '',
    item.privateNote || '',
  ]
  const text = parts.filter(Boolean).join(' ').toLowerCase().trim()
  return text
}
