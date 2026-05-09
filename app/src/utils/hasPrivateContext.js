export function hasPrivateContext(item) {
  if (!item) return false
  return !!(
    (item.privateNote && typeof item.privateNote === 'string' && item.privateNote.trim()) ||
    item.memoryType ||
    item.memoryDate
  )
}
