const SITE_SUFFIX = /\s*[-|–—]\s*(YouTube|Pinterest|Instagram|Spotify|Twitter|X|Facebook|TikTok|Reddit|Substack|Medium|NYTimes|The New York Times|New York Times|Are\.na|Google|LinkedIn|Vimeo|SoundCloud|Bandcamp|Behance|Dribbble|Wikipedia)\s*$/i

function cleanTitle(raw) {
  if (!raw) return ''
  let t = raw.trim()
  let prev
  do {
    prev = t
    t = t.replace(SITE_SUFFIX, '').trim()
  } while (t !== prev)
  t = t.replace(/(\s*[-–—]\s*){2,}/g, ' – ').replace(/(\s*\|\s*){2,}/g, ' | ')
  return t.trim()
}

function truncateAtBoundary(str, max) {
  if (str.length <= max) return str
  const sub = str.slice(0, max)
  let i = sub.length - 1
  while (i > max * 0.5 && !/[.!?,;:]/.test(sub[i])) i--
  if (i > max * 0.5) return sub.slice(0, i + 1).trim()
  const lastSpace = sub.lastIndexOf(' ')
  if (lastSpace > max * 0.4) return sub.slice(0, lastSpace).trim()
  return sub.trim()
}

export function buildDisplayMemory(item) {
  if (!item) return { displayTitle: 'Saved Memory', displayDescription: '' }

  const rawType = (item.type || item.filterKey || '').toLowerCase()
  const isNote = rawType === 'note' || rawType === 'journal'
  const rawDesc = item.description || item.body || ''
  const rawTitle = item.title || (isNote ? rawDesc : '')

  let displayTitle = cleanTitle(rawTitle)
  if (displayTitle.length > 60) {
    displayTitle = truncateAtBoundary(displayTitle, 60)
  }
  if (!displayTitle) displayTitle = 'Saved Memory'

  let displayDescription = rawDesc.trim().replace(/\s{2,}/g, ' ')
  if (displayTitle.length >= 10) {
    const fragment = displayTitle.slice(0, Math.min(25, displayTitle.length)).toLowerCase()
    if (displayDescription.toLowerCase().startsWith(fragment)) {
      const end = displayDescription.search(/[.!?]\s/)
      displayDescription = end > 0 && end < displayDescription.length - 10
        ? displayDescription.slice(end + 1).trim()
        : ''
    }
  }
  if (displayDescription.length > 120) {
    displayDescription = truncateAtBoundary(displayDescription, 120)
  }

  return { displayTitle, displayDescription }
}
