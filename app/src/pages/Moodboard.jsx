import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FILTER_KEYS, FILTER_LABELS } from '../data/items'
import { useApp } from '../context/AppContext'
import { mapItemToUI } from '../utils/mapItemToUI'
import { scoreItems } from '../utils/scoreItems'
import { getContext } from '../utils/getContext'
import { getRecencyScore } from '../utils/getRecencyScore'
import { buildTimelineGroups } from '../utils/buildTimelineGroups'
import { captureItem } from '../utils/captureItem'
import { deduplicateCapture } from '../utils/deduplicateCapture'
import { logEvent } from '../utils/eventLogger'
import { semanticSearch } from '../utils/scoreSearchMatch'
import { generateItemSummary } from '../utils/generateItemSummary'
import { createJournalEntry } from '../utils/createJournalEntry'
import { buildCollections } from '../utils/buildCollections'

/* ─── Helpers (unchanged logic) ─── */

function safeItem(item) {
  return {
    ...item,
    title: item.title || 'Saved Link',
    source: item.source || 'web',
    tags: Array.isArray(item.tags) ? item.tags : [],
    body: item.body || '',
    metadata: item.metadata || {},
  }
}

function sortItems(items, flags, sortMode) {
  if (sortMode === 'recent') {
    return [...items].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  }
  if (sortMode === 'relevant') {
    return scoreItems(items, flags, getContext()).map(r => r.item)
  }
  const scoreMap = new Map(
    scoreItems(items, flags, getContext()).map(r => [r.item.id, r.score + getRecencyScore(r.item.createdAt) * 0.1])
  )
  return [...items].sort((a, b) => {
    const aP = !!(flags[a.id]?.isSaved && !flags[a.id]?.isTried)
    const bP = !!(flags[b.id]?.isSaved && !flags[b.id]?.isTried)
    if (aP !== bP) return bP ? 1 : -1
    const scoreDiff = (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0)
    if (scoreDiff !== 0) return scoreDiff
    return (a.createdAt || 0) - (b.createdAt || 0)
  })
}

function detectDominantTag(items) {
  if (items.length < 3) return null
  const freq = {}
  for (const item of items) {
    const tags = Array.isArray(item.tags) ? item.tags : []
    for (const tag of tags) freq[tag] = (freq[tag] || 0) + 1
  }
  const entries = Object.entries(freq).sort((a, b) => b[1] - a[1])
  if (!entries.length) return null
  const [topTag, topCount] = entries[0]
  return (topCount >= 3 && topCount / items.length >= 0.3) ? topTag : null
}

function relativeTime(ts) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(diff / 86400000)
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

/* ─── Source chip (maps source string to design-kit color) ─── */

const SOURCE_COLOR = {
  spotify: 'moss', pinterest: 'ember', youtube: 'ochre',
  'mora · journal': 'indigo', manual: 'ink', web: 'ink',
  mora: 'indigo', nytimes: 'ink', 'are.na': 'ink',
}

function SourceChip({ source }) {
  const c = SOURCE_COLOR[(source || '').toLowerCase()] || 'ink'
  return (
    <span className={'m-source m-source-' + c}>
      <span className="m-source-dot" />
      {source}
    </span>
  )
}

/* ─── Memory Card (editorial style) ─── */

function MemoryCard({ item, onSelect, flags }) {
  const safe = safeItem(item)
  const type = item.type || item.filterKey || 'link'
  const isNote = type === 'note'
  const isJournal = type === 'journal'
  const isSong = type === 'song'
  const isVideo = type === 'video'
  const isImage = type === 'image'
  const hasThumb = !!(item.thumbnail)
  const kept = flags?.[item.id]?.isSaved

  // Gradient thumb for items without real thumbnails
  const gradients = {
    song: 'linear-gradient(135deg, #4A3F30 0%, #2E4051 100%)',
    image: 'linear-gradient(135deg, #B6532E 0%, #B89B5E 100%)',
    video: 'linear-gradient(135deg, #5C6A4D 0%, #1E1A14 100%)',
  }
  const thumbBg = gradients[type] || 'linear-gradient(135deg, var(--mora-vellum) 0%, var(--mora-vellum-2) 100%)'

  const cardClass = `m-card${isNote ? ' m-card-note' : ''}${isJournal ? ' m-card-journal' : ''}`

  return (
    <article 
      className={cardClass} 
      onClick={() => onSelect(item.id)}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(item.id))}
    >
      {/* Thumbnail area for media types */}
      {(isSong || isImage || isVideo || hasThumb) && (
        <div
          className="m-card-thumb"
          style={{ background: hasThumb ? undefined : thumbBg }}
        >
          {hasThumb && (
            <img
              src={item.thumbnail}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
            />
          )}
          {isVideo && <span className="m-card-play"><i className="ph ph-play" /></span>}
          {isSong && <span className="m-card-play"><i className="ph ph-music-notes" /></span>}
          <span className="m-card-grain" />
        </div>
      )}

      <div className="m-card-body">
        <SourceChip source={safe.source} />
        <h3 className={'m-card-title' + (isNote || isJournal ? ' is-quote' : '')}>
          {(isNote || isJournal) ? '\u201C' : ''}{safe.title}{(isNote || isJournal) ? '\u201D' : ''}
        </h3>
        {safe.body && !isImage && (
          <p className="m-card-text">{safe.body}</p>
        )}
        <div className="m-card-meta">
          <span>{item.createdAt ? relativeTime(item.createdAt) : ''}</span>
          {safe.tags.slice(0, 2).map(t => (
            <span key={t} className="m-meta-tag">#{t}</span>
          ))}
        </div>
      </div>

      {kept && <i className="ph-fill ph-bookmark-simple m-card-keep" />}

      {item.url && (
        <button
          className="m-card-external"
          onClick={e => { e.stopPropagation(); window.open(item.url, '_blank', 'noopener,noreferrer') }}
          title="Open source"
          aria-label="Open source in new tab"
        >
          <i className="ph ph-arrow-square-out" />
        </button>
      )}
    </article>
  )
}

/* ─── Editorial Card Grid ─── */

function CardGrid({ items, onSelect, flags }) {
  return (
    <div className="m-grid">
      {items.map(item => (
        <MemoryCard key={item.id} item={item} onSelect={onSelect} flags={flags} />
      ))}
    </div>
  )
}

/* ─── Sort / Filter labels ─── */

const SORT_OPTIONS = [
  { key: 'default', label: 'feeling' },
  { key: 'recent', label: 'most recent' },
  { key: 'relevant', label: 'relevance' },
]

/* ─── Main page ─── */

export default function Moodboard() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortMode, setSortMode] = useState('default')
  const [urlInput, setUrlInput] = useState('')
  const [journalInput, setJournalInput] = useState('')
  const navigate = useNavigate()
  const { items, setItems, flags, setSelectedItemId, interestClusters, resurfacedItems, memoryInsights, upcomingMemoryEvents, recentReflections } = useApp()
  const collections = useMemo(() => buildCollections(items), [items])

  const handleUrlAdd = () => {
    const raw = urlInput.trim()
    if (!raw) return
    const captured = captureItem({ url: raw, origin: 'url' })
    const { isDuplicate } = deduplicateCapture(items, captured)
    if (isDuplicate) { setUrlInput(''); return }
    setItems(prev => [captured, ...prev])
    logEvent(captured.id, 'save')
    setUrlInput('')
  }

  const handleJournalAdd = () => {
    const text = journalInput.trim()
    if (!text) return
    const entry = createJournalEntry(text)
    setItems(prev => [entry, ...prev])
    setJournalInput('')
  }

  const typeFiltered = items.filter(item =>
    activeFilter === 'all' || (item.type || item.filterKey) === activeFilter
  )

  const filtered = searchQuery.trim()
    ? semanticSearch(searchQuery, typeFiltered)
    : typeFiltered

  const sorted = useMemo(
    () => searchQuery.trim() ? filtered : sortItems(filtered, flags, sortMode),
    [filtered, flags, sortMode, searchQuery]
  )
  const dominantTag = detectDominantTag(sorted)

  const groups = dominantTag
    ? [
        { label: dominantTag, items: sorted.filter(i => (Array.isArray(i.tags) ? i.tags : []).includes(dominantTag)) },
        { label: null, items: sorted.filter(i => !(Array.isArray(i.tags) ? i.tags : []).includes(dominantTag)) },
      ].filter(g => g.items.length > 0)
    : sortMode === 'recent'
      ? buildTimelineGroups(sorted)
      : null

  const visibleIds = new Set(sorted.map(i => i.id))
  const filteredTagSet = new Set(sorted.flatMap(i => Array.isArray(i.tags) ? i.tags : []))
  const filteredTypes = new Set(sorted.map(i => i.type || i.filterKey))

  const suggestions = items
    .filter(i => {
      if (visibleIds.has(i.id)) return false
      const tags = Array.isArray(i.tags) ? i.tags : []
      const sharedTag = tags.some(t => filteredTagSet.has(t))
      const sameType = activeFilter !== 'all' && filteredTypes.has(i.type || i.filterKey)
      return sharedTag || sameType
    })
    .slice(0, 6)

  const handleSelect = (id) => {
    setSelectedItemId(id)
    navigate('/item')
  }

  return (
    <div className="m-library">

      {/* ── Capture area ── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <div className="m-url-capture" style={{ flex: '1 1 280px' }}>
          <i className="ph ph-link-simple" style={{ color: 'var(--mora-ink-3)', fontSize: 15 }} />
          <input
            type="text"
            placeholder="Paste a URL…"
            aria-label="URL to capture"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUrlAdd()}
          />
          <button className="m-btn m-btn-secondary" style={{ padding: '6px 12px', fontSize: 12, borderRadius: 999 }} onClick={handleUrlAdd}>Add</button>
        </div>
        <button className="m-btn m-btn-primary" style={{ fontSize: 12, borderRadius: 999, padding: '8px 16px' }} onClick={() => navigate('/add')}>
          <i className="ph ph-plus" /> Add Item
        </button>
      </div>

      {/* Journal quick-capture */}
      <div className="m-journal-capture" style={{ marginBottom: 28 }}>
        <textarea
          rows={2}
          placeholder="Capture a thought…"
          aria-label="Capture a thought"
          value={journalInput}
          onChange={e => setJournalInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleJournalAdd())}
        />
        <button
          className="m-btn m-btn-secondary"
          style={{ padding: '8px 14px', fontSize: 12, whiteSpace: 'nowrap', borderRadius: 8 }}
          onClick={handleJournalAdd}
          disabled={!journalInput.trim()}
        >
          <i className="ph ph-feather" /> Capture
        </button>
      </div>

      {/* ── Reflections ── */}
      {recentReflections.length > 0 && (
        <section className="m-section">
          <div className="m-section-head">
            <i className="ph ph-notebook" style={{ color: 'var(--mora-indigo)', fontSize: 16 }} />
            <span className="m-section-title">Reflections</span>
            <span className="m-section-sep" />
          </div>
          {recentReflections.slice(0, 5).map(item => (
            <article
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className="m-reflection-item"
              role="button"
              tabIndex={0}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), handleSelect(item.id))}
            >
              <i className="ph ph-notebook m-reflection-icon" />
              <div className="m-reflection-body">
                <p className="m-reflection-title">{item.title}</p>
                {item.body && (
                  <p className="m-reflection-text">
                    {item.body.slice(0, 60)}{item.body.length > 60 ? '…' : ''}
                  </p>
                )}
              </div>
              <span className="m-reflection-time">
                {relativeTime(item.createdAt)}
              </span>
            </article>
          ))}
        </section>
      )}

      {/* ── Collections ── */}
      {collections.length > 0 && (
        <section className="m-section">
          <div className="m-section-head">
            <i className="ph ph-folder-open" style={{ color: 'var(--mora-ochre)', fontSize: 16 }} />
            <span className="m-section-title">Collections</span>
            <span className="m-section-sep" />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {collections.map(({ name, count }) => (
              <button
                key={name}
                onClick={() => setSearchQuery(name)}
                className="m-collection-chip"
              >
                <span>{name}</span>
                <span className="m-collection-count">{count}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Top Interests ── */}
      {interestClusters.length > 0 && (
        <section className="m-section">
          <div className="m-section-head">
            <i className="ph ph-star-four" style={{ color: 'var(--mora-ember)', fontSize: 16 }} />
            <span className="m-section-title">Top Interests</span>
            <span className="m-section-sep" />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {interestClusters.map(({ tag, count }) => (
              <button
                key={tag}
                onClick={() => setSearchQuery(tag)}
                className="m-interest-chip"
              >
                <span>#{tag}</span>
                <span className="m-interest-count">{count}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Resurface band ── */}
      {resurfacedItems.length > 0 && (
        <section className="m-resurface" style={{ marginBottom: 28 }}>
          <div className="m-resurface-head">
            <span className="m-eyebrow">
              <span className="m-eyebrow-dot" style={{ background: 'var(--mora-ochre)' }} />
              A LITTLE FROM THE PAST
            </span>
            <p className="m-resurface-blurb">
              Memories brought up by something you saved recently.
            </p>
          </div>
          <div className="m-resurface-row">
            {resurfacedItems.slice(0, 3).map(item => {
              const safe = safeItem(item)
              return (
                <button key={item.id} className="m-resurface-card" onClick={() => handleSelect(item.id)}>
                  <span className="m-resurface-when">{item.createdAt ? relativeTime(item.createdAt) : ''}</span>
                  <span className="m-resurface-title">{safe.title}</span>
                  <SourceChip source={safe.source} />
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Rule ornament ── */}
      <div className="m-rule">
        <span className="m-rule-line" />
        <span className="m-rule-orn">˖</span>
        <span className="m-rule-line" />
      </div>

      {/* ── Semantic search ── */}
      <div className="m-search" style={{ marginBottom: 16, width: '100%', borderRadius: 8, maxWidth: 480 }}>
        <i className="ph ph-magnifying-glass" />
        <input
          type="text"
          placeholder="Search your memories…"
          aria-label="Search your memories"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--mora-ink-3)', fontSize: 14, padding: '0 2px' }}
            aria-label="Clear search"
          >
            <i className="ph ph-x" />
          </button>
        )}
      </div>

      {/* ── Filter bar + sort ── */}
      <div className="m-filterbar">
        <div className="m-filters">
          {FILTER_KEYS.map(key => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={'m-pill' + (activeFilter === key ? ' is-active' : '')}
            >
              {FILTER_LABELS[key]}
            </button>
          ))}
        </div>
        <div className="m-sort">
          <span className="m-sort-label">arranged by</span>
          {SORT_OPTIONS.map(({ key, label }, i) => (
            <span key={key}>
              {i > 0 && <span className="m-sort-sep"> · </span>}
              <button
                className={'m-sort-btn' + (sortMode === key ? ' is-active' : '')}
                onClick={() => setSortMode(key)}
              >
                {label}
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* ── Main grid / empty states ── */}
      {items.length === 0 ? (
        <div className="m-empty">
          <i className="ph ph-folder-open" />
          <p>The library is quiet. Save links, posts, videos, and notes to begin building your Mora.</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="m-empty">
          <i className="ph ph-magnifying-glass" />
          <p>Nothing matches that. Try a softer search, or clear the filters.</p>
        </div>
      ) : groups ? (
        <div>
          {groups.map((group, i) => (
            <div key={group.label ?? '__other'} style={{ marginBottom: 32 }}>
              {group.label && (
                <div className="m-group-head">
                  <span className="m-group-label">#{group.label}</span>
                  <span className="m-group-line" />
                </div>
              )}
              {!group.label && i > 0 && (
                <div className="m-group-head">
                  <span className="m-group-label">Other</span>
                  <span className="m-group-line" />
                </div>
              )}
              <CardGrid items={group.items} onSelect={handleSelect} flags={flags} />
            </div>
          ))}
        </div>
      ) : (
        <CardGrid items={sorted} onSelect={handleSelect} flags={flags} />
      )}

      {/* ── Suggested for you ── */}
      {suggestions.length > 0 && (
        <section className="m-section" style={{ marginTop: 40 }}>
          <div className="m-section-head">
            <i className="ph ph-sparkle" style={{ color: 'var(--mora-ochre)', fontSize: 16 }} />
            <span className="m-section-title">Suggested for you</span>
            <span className="m-section-sep" />
          </div>
          <div className="m-suggest-grid">
            {suggestions.map(item => {
              const safe = safeItem(item)
              const { badge } = mapItemToUI(item)
              return (
                <article
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className="m-suggest-item"
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), handleSelect(item.id))}
                >
                  <div className="m-suggest-thumb">
                    {item.thumbnail
                      ? <img src={item.thumbnail} alt="" />
                      : <i className="ph ph-image" />
                    }
                  </div>
                  <div className="m-suggest-body">
                    <p className="m-suggest-title">{safe.title}</p>
                    <p className="m-suggest-badge">{badge}</p>
                  </div>
                  <i className="ph ph-caret-right m-suggest-arrow" />
                </article>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Rediscover ── */}
      {resurfacedItems.length > 0 && (
        <section className="m-section" style={{ marginTop: 40 }}>
          <div className="m-section-head">
            <i className="ph ph-clock-counter-clockwise" style={{ color: 'var(--mora-indigo)', fontSize: 16 }} />
            <span className="m-section-title">Rediscover</span>
            <span className="m-section-sep" />
            <span style={{ fontFamily: 'var(--mora-font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--mora-ink-4)' }}>from your past</span>
          </div>
          <div className="m-rediscover-grid">
            {resurfacedItems.slice(0, 4).map(item => {
              const safe = safeItem(item)
              const { badge } = mapItemToUI(item)
              const summary = generateItemSummary(item)
              return (
                <article
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className="m-suggest-item"
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), handleSelect(item.id))}
                >
                  <div className="m-suggest-thumb">
                    {item.thumbnail
                      ? <img src={item.thumbnail} alt="" />
                      : <i className="ph ph-hourglass-medium" />
                    }
                  </div>
                  <div className="m-suggest-body">
                    <p className="m-suggest-title">{safe.title}</p>
                    <p className="m-suggest-badge">{summary || badge}</p>
                  </div>
                  <i className="ph ph-caret-right m-suggest-arrow" />
                </article>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Upcoming ── */}
      {upcomingMemoryEvents.length > 0 && (
        <section className="m-section" style={{ marginTop: 40 }}>
          <div className="m-section-head">
            <i className="ph ph-calendar-blank" style={{ color: 'var(--mora-ember)', fontSize: 16 }} />
            <span className="m-section-title">Upcoming</span>
            <span className="m-section-sep" />
          </div>
          {upcomingMemoryEvents.map(({ item, label }) => (
            <article
              key={item.id}
              className="m-upcoming-item"
              onClick={() => { setSelectedItemId(item.id); navigate('/item/' + item.id) }}
              role="button"
              tabIndex={0}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSelectedItemId(item.id), navigate('/item/' + item.id))}
            >
              <span className="m-upcoming-label">{label}</span>
              <span className="m-upcoming-title">{item.title}</span>
              {item.memoryType && (
                <span className="m-upcoming-type">{item.memoryType}</span>
              )}
            </article>
          ))}
        </section>
      )}

      {/* ── Insights ── */}
      {memoryInsights.length > 0 && (
        <section className="m-section" style={{ marginTop: 40 }}>
          <div className="m-section-head">
            <i className="ph ph-brain" style={{ color: 'var(--mora-moss)', fontSize: 16 }} />
            <span className="m-section-title">Insights</span>
            <span className="m-section-sep" />
          </div>
          {memoryInsights.map((insight, i) => (
            <p key={i} className="m-insight-row">{insight}</p>
          ))}
        </section>
      )}
    </div>
  )
}
