/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react'

const SOURCE_COLOR = {
  spotify: 'moss',
  pinterest: 'ember',
  youtube: 'ember',
  instagram: 'ember',
  'mora · journal': 'moss',
  mora: 'moss',
  manual: 'ink',
  web: 'ink',
  reading: 'indigo',
  substack: 'indigo',
  nyt: 'ink',
  nytimes: 'ink',
  'are.na': 'ink',
  highlights: 'ochre',
}

const FILTER_DEFINITIONS = [
  { id: 'all', label: 'Everything' },
  { id: 'note', label: 'Notes' },
  { id: 'song', label: 'Listening' },
  { id: 'reading', label: 'Reading' },
  { id: 'image', label: 'Images' },
  { id: 'video', label: 'Watching' },
]

export function Eyebrow({ children, color = 'var(--mora-ember)', dot = true, className = '' }) {
  return (
    <span className={`m-eyebrow${className ? ` ${className}` : ''}`}>
      {dot ? <span className="m-eyebrow-dot" style={{ background: color }} /> : null}
      {children}
    </span>
  )
}

export function Rule({ ornament = false, className = '' }) {
  return (
    <div className={`m-rule${className ? ` ${className}` : ''}`} role="separator">
      <span className="m-rule-line" />
      {ornament ? <span className="m-rule-orn">˖</span> : null}
      <span className="m-rule-line" />
    </div>
  )
}

export function Pill({ active, children, onClick, className = '', type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`m-pill${active ? ' is-active' : ''}${className ? ` ${className}` : ''}`}
    >
      {children}
    </button>
  )
}

export function SourceChip({ source }) {
  const normalized = String(source || 'web').trim()
  const color = SOURCE_COLOR[normalized.toLowerCase()] || 'ink'
  return (
    <span className={`m-source m-source-${color}`}>
      <span className="m-source-dot" />
      {normalized}
    </span>
  )
}

export function formatRelativeTime(timestamp) {
  if (!timestamp) return ''
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(diff / 86400000)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return 'last week'
  if (days < 90) return 'last month'
  if (days < 365) return 'last season'
  return 'earlier on'
}

export function mapItemToMemory(item, flags = {}) {
  const source = item.source || item.metadata?.source || 'web'
  const rawType = item.type || item.filterKey || item.metadata?.type || 'note'
  const type = normalizeMemoryType(rawType, source)
  const body = item.body || item.description || ''
  const thumbnail = item.thumbnail || item.metadata?.thumbnail || ''
  const kept = Boolean(flags[item.id]?.isSaved)

  return {
    id: item.id,
    source,
    type,
    title: item.title || (type === 'note' ? body : 'Untitled'),
    body,
    time: formatRelativeTime(item.createdAt),
    tags: Array.isArray(item.tags) ? item.tags : [],
    thumb: thumbnail ? `url("${thumbnail}") center / cover no-repeat` : thumbFallback(type),
    kept,
    url: item.url || null,
    author: item.author || null,
    privateNote: item.privateNote || null,
    raw: item,
  }
}

export function normalizeMemoryType(type, source = '') {
  const normalized = String(type || '').toLowerCase()
  if (normalized === 'song') return 'song'
  if (normalized === 'image') return 'image'
  if (normalized === 'video') return 'video'
  if (normalized === 'reading') return 'reading'
  if (normalized === 'note') return 'note'
  if (normalized === 'journal') return 'note'
  if (normalized === 'insight') return 'note'
  if (normalized === 'activity') return 'note'

  const normalizedSource = String(source || '').toLowerCase()
  if (normalizedSource.includes('spotify')) return 'song'
  if (normalizedSource.includes('youtube')) return 'video'
  if (normalizedSource.includes('substack') || normalizedSource.includes('nyt') || normalizedSource.includes('reading')) return 'reading'
  return 'reading'
}

function thumbFallback(type) {
  if (type === 'song') return 'linear-gradient(135deg, var(--mora-moss-wash), color-mix(in srgb, var(--mora-moss-wash) 70%, var(--mora-paper)))'
  if (type === 'video') return 'linear-gradient(135deg, var(--mora-indigo-wash), color-mix(in srgb, var(--mora-indigo-wash) 70%, var(--mora-paper)))'
  if (type === 'image') return 'linear-gradient(135deg, var(--mora-ember-wash), color-mix(in srgb, var(--mora-ember-wash) 70%, var(--mora-paper)))'
  if (type === 'reading') return 'linear-gradient(135deg, var(--mora-paper-deep), var(--mora-vellum))'
  return ''
}

export function matchesLibraryFilter(memory, filter) {
  if (filter === 'all') return true
  return memory.type === filter
}

export function searchMemories(memories, query) {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return memories
  return memories.filter(memory =>
    memory.title.toLowerCase().includes(trimmed) ||
    memory.body.toLowerCase().includes(trimmed) ||
    memory.source.toLowerCase().includes(trimmed) ||
    memory.tags.join(' ').toLowerCase().includes(trimmed)
  )
}

export function MemoryCard({ memory, onOpen }) {
  const isImage = memory.type === 'image' || memory.type === 'video'
  const isNote = memory.type === 'note'
  const isSong = memory.type === 'song'

  return (
    <article
      className={`m-card m-card-${memory.type}`}
      onClick={() => onOpen(memory.id)}
      role="button"
      tabIndex={0}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen(memory.id)
        }
      }}
    >
      {memory.thumb ? (
        <div className="m-card-thumb" style={{ background: memory.thumb }}>
          {memory.type === 'video' ? (
            <span className="m-card-play">
              <i className="ph ph-play" />
            </span>
          ) : null}
          {isSong ? (
            <span className="m-card-play">
              <i className="ph ph-music-notes" />
            </span>
          ) : null}
          <span className="m-card-grain" />
        </div>
      ) : null}
      <div className="m-card-body">
        <SourceChip source={memory.source} />
        <h3 className={`m-card-title${isNote ? ' is-quote' : ''}`}>
          {isNote ? '“' : ''}
          {memory.title}
          {isNote ? '”' : ''}
        </h3>
        {memory.body && !isImage ? <p className="m-card-text">{memory.body}</p> : null}
        <div className="m-card-meta">
          <span>{memory.time}</span>
          {memory.tags.slice(0, 2).map(tag => (
            <span key={tag} className="m-meta-tag">#{tag}</span>
          ))}
        </div>
      </div>
      {memory.kept ? <i className="ph-fill ph-bookmark-simple m-card-keep" /> : null}
    </article>
  )
}

export function useLibraryMemories(items, flags) {
  return useMemo(() => items.map(item => mapItemToMemory(item, flags)), [items, flags])
}

export { FILTER_DEFINITIONS }
