const RE_URL = /^(https?:\/\/|www\.)/i
const RE_PLATFORM = /^(instagram|youtube|spotify|twitter|pinterest|tiktok|facebook|reddit|medium|substack)$/i
const RE_HASHTAGS = /^(#\w+\s*)+$/

function isLowValue(text) {
  if (!text) return true
  const t = text.trim()
  if (!t) return true
  if (RE_URL.test(t)) return true
  if (RE_PLATFORM.test(t)) return true
  if (RE_HASHTAGS.test(t)) return true
  return false
}

function firstSentence(text) {
  const t = text.trim()
  const m = t.match(/^.+?[.!?](?=\s|$)/)
  return m ? m[0].trim() : t
}

function clean(text) {
  return text.trim().replace(/\s+/g, ' ').replace(/([.!?]){2,}/g, '$1')
}

function truncate(text, max = 140) {
  if (text.length <= max) return text
  const cut = text.lastIndexOf(' ', max - 3)
  return (cut > 0 ? text.slice(0, cut) : text.slice(0, max - 3)) + '...'
}

function tagContext(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return ''
  return ' about ' + tags.slice(0, 2).join(' ')
}

export function generateItemSummary(item) {
  if (!item) return ''

  const { title = '', description, body, tags } = item

  let base = ''
  if (!isLowValue(description)) {
    base = firstSentence(description)
  } else if (!isLowValue(body)) {
    base = firstSentence(body)
  }

  base = clean(base || title || '')
  if (!base) return ''

  return truncate(base + tagContext(tags))
}
