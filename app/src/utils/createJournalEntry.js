import { extractTags } from './normalizeCapture.js'

const STOPWORDS = new Set([
  'the','and','for','with','this','that','from','you','your','are','was',
  'its','has','had','not','but','they','will','can','all','more','have',
  'been','what','how','when','who','which','into','about','than','also',
  'a','an','i','is','in','it','of','to','be','do','he','she','we','at',
  'on','up','if','as','my','me','by','so','go','no',
])

function autoTitle(text) {
  if (!text || !text.trim()) return 'Untitled'
  const words = text
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0 && !STOPWORDS.has(w.toLowerCase()))
  if (words.length === 0) return 'Untitled'
  const title = words
    .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
  return title.length > 60 ? title.slice(0, 60) + '…' : title
}

export function createJournalEntry(text) {
  const body = (text || '').trim()
  const now = Date.now()
  return {
    id: String(now),
    title: autoTitle(body),
    url: null,
    source: 'mora',
    type: 'journal',
    thumbnail: '',
    description: '',
    tags: extractTags(body),
    mood: null,
    body,
    createdAt: now,
    updatedAt: null,
    externalId: null,
    memoryDate: null,
    memoryType: null,
    privateNote: null,
    schemaVersion: 2,
    metadata: {
      thumbnail: null,
      description: '',
      source: 'mora',
      type: 'journal',
      platform: null,
      hostname: null,
      canonicalUrl: null,
      origin: 'mora',
      capturedAt: now,
    },
    raw: {},
  }
}
