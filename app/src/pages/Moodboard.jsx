import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FILTER_KEYS, FILTER_LABELS } from '../data/items'
import { useApp } from '../context/AppContext'
import { mapItemToUI } from '../utils/mapItemToUI'
import { scoreItems } from '../utils/scoreItems'
import { getContext } from '../utils/getContext'
import { captureItem } from '../utils/captureItem'
import { deduplicateCapture } from '../utils/deduplicateCapture'
import { logEvent } from '../utils/eventLogger'

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
  // default: saved-not-tried → score desc → older first
  const scoreMap = new Map(
    scoreItems(items, flags, getContext()).map(r => [r.item.id, r.score])
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

function SongTile({ item }) {
  return (
    <div className="h-64 relative overflow-hidden bg-surface-container-high rounded-t-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-tertiary/10 to-secondary/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-transparent" />
      <div className="absolute bottom-4 left-4 z-20">
        <h3 className="font-headline-md text-headline-md text-on-surface mb-1">{item.title}</h3>
        <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">headphones</span>
          {item.body}
        </p>
      </div>
      <button className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-primary text-on-primary-fixed flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:shadow-[0_0_15px_#ff479c]">
        <span className="material-symbols-outlined">play_arrow</span>
      </button>
    </div>
  )
}

function InsightTile({ item }) {
  const navigate = useNavigate()
  return (
    <div className="p-6 flex flex-col justify-between h-full">
      <div>
        <span className="material-symbols-outlined text-secondary-fixed-dim text-3xl mb-4 block">lightbulb</span>
        <h3 className="font-headline-md text-headline-md text-on-surface mb-2">{item.title}</h3>
        <p className="font-body-md text-body-md text-on-surface-variant">{item.body}</p>
      </div>
      <button
        onClick={() => navigate('/constellations')}
        className="mt-4 self-start text-secondary-fixed border-b border-secondary-fixed/30 pb-1 font-label-sm text-label-sm hover:border-secondary-fixed transition-colors"
      >
        Review Items
      </button>
    </div>
  )
}

function ImageTile({ item }) {
  return (
    <div className="h-48 relative bg-surface-container-high overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-pink-900/20 to-cyan-900/40 group-hover:scale-105 transition-transform duration-700" />
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute bottom-4 left-4 z-20 bg-surface-container-highest/80 backdrop-blur px-3 py-2 rounded border border-white/5">
        <p className="font-label-sm text-label-sm text-on-surface">{item.body}</p>
      </div>
    </div>
  )
}

function NoteTile({ item }) {
  return (
    <div className="p-5 h-full flex flex-col">
      <p className="font-body-md text-body-md text-on-surface italic opacity-80 mt-6 flex-1">{item.title}</p>
      <div className="mt-4 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
        <span>{item.body}</span>
        <span className="material-symbols-outlined text-[16px]">edit_note</span>
      </div>
    </div>
  )
}

function ActivityTile({ item }) {
  return (
    <div className="p-6 relative overflow-hidden h-full">
      <div className="absolute -right-10 -bottom-10 opacity-10">
        <span className="material-symbols-outlined text-[120px]">graphic_eq</span>
      </div>
      <h3 className="font-headline-md text-headline-md text-on-surface mb-4">{item.title}</h3>
      <div className="space-y-3">
        {[['Focus', 'w-3/4', 'bg-primary-container'], ['Drift', 'w-1/2', 'bg-secondary-container']].map(([label, width, color]) => (
          <div key={label} className="flex items-center gap-3">
            <div className="w-8 h-1 bg-surface-container-highest rounded-full overflow-hidden">
              <div className={`${width} h-full ${color}`} />
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const TILE_BG = {
  song: 'bg-surface-container/80 backdrop-blur-md neon-underglow-primary overflow-hidden',
  insight: 'bg-surface-container-high/60 backdrop-blur-sm neon-underglow-secondary',
  image: 'bg-surface-container/80 backdrop-blur-md overflow-hidden',
  note: 'bg-surface-container-low/90 backdrop-blur-md',
  activity: 'bg-surface-container/50 backdrop-blur-lg',
}

function renderTileContent(item) {
  switch (item.type || item.filterKey) {
    case 'song':     return <SongTile item={item} />
    case 'insight':  return <InsightTile item={item} />
    case 'image':
      if (item.url || item.thumbnail) {
        return (
          <>
            {item.source && <span className="absolute top-2 left-2 z-20 px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-[10px] text-white/70 capitalize leading-none">{item.source}</span>}
            <div className="h-40 w-full relative overflow-hidden rounded-t-xl">
              {(item.thumbnail || '')
                ? <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-primary/20 via-tertiary/10 to-secondary/20" />
              }
            </div>
            <div className="p-4">
              <h3 className="text-on-surface font-headline-md leading-snug">{item.title}</h3>
            </div>
          </>
        )
      }
      return <ImageTile item={item} />
    case 'note':     return <NoteTile item={item} />
    case 'activity': return <ActivityTile item={item} />
    case 'video':
      return (
        <>
          {item.source && <span className="absolute top-2 left-2 z-20 px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-[10px] text-white/70 capitalize leading-none">{item.source}</span>}
          <div className="h-40 w-full relative overflow-hidden rounded-t-xl">
            {(item.thumbnail || '')
              ? <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-primary/20 via-tertiary/10 to-secondary/20" />
            }
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-black/50 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                <span className="material-symbols-outlined text-white/90 text-[20px]">play_arrow</span>
              </div>
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-on-surface font-headline-md leading-snug">{item.title}</h3>
            {item.source && (
              <p className="font-label-sm text-label-sm text-on-surface-variant/60 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">link</span>
                {item.source}
              </p>
            )}
          </div>
        </>
      )
    default:
      return (
        <>
          {item.source && <span className="absolute top-2 left-2 z-20 px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-[10px] text-white/70 capitalize leading-none">{item.source}</span>}
          <div className="h-32 w-full relative overflow-hidden rounded-t-xl">
            {(item.thumbnail || '')
              ? <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-primary/20 via-tertiary/10 to-secondary/20" />
            }
          </div>
          <div className="p-4">
            <h3 className="text-on-surface font-headline-md leading-snug">{item.title}</h3>
            {item.source && (
              <p className="font-label-sm text-label-sm text-on-surface-variant/60 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">link</span>
                {item.source}
              </p>
            )}
          </div>
        </>
      )
  }
}

function BentoGrid({ items, onSelect }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
      {items.map(item => {
        const safe = safeItem(item)
        const { badge, badgeColor, colSpanClass, tiltClass } = mapItemToUI(item)
        return (
          <article
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`
              ${colSpanClass}
              ${TILE_BG[item.type || item.filterKey] || 'bg-surface-container'}
              min-h-[140px]
              rounded-xl border border-white/10 relative group cursor-pointer
              transform ${tiltClass} hover:-translate-y-1 transition-transform duration-300
            `}
          >
            <div className={`absolute top-4 right-4 bg-surface-container-highest/90 px-2 py-1 border border-white/10 rounded font-label-sm text-label-sm z-20 ${badgeColor}`}>
              {badge}
            </div>
            {item.url && (
              <button
                onClick={e => { e.stopPropagation(); window.open(item.url, '_blank', 'noopener,noreferrer') }}
                className="absolute bottom-3 right-3 z-30 w-7 h-7 flex items-center justify-center rounded-full bg-surface-container-highest/80 border border-white/10 text-on-surface-variant hover:text-primary hover:border-primary/50 transition-all opacity-0 group-hover:opacity-100"
              >
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </button>
            )}
            {renderTileContent(safe)}
          </article>
        )
      })}
    </div>
  )
}

const SORT_OPTIONS = [
  { key: 'default', label: 'Priority' },
  { key: 'recent', label: 'Recent' },
  { key: 'relevant', label: 'Relevant' },
]

export default function Moodboard() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortMode, setSortMode] = useState('default')
  const [urlInput, setUrlInput] = useState('')
  const navigate = useNavigate()
  const { items, setItems, flags, setSelectedItemId } = useApp()

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

  const matchesSearch = (item) => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return true
    const safe = safeItem(item)
    return (
      safe.title.toLowerCase().includes(query) ||
      safe.source.toLowerCase().includes(query) ||
      safe.tags.some(tag => tag.toLowerCase().includes(query)) ||
      (item.mood && item.mood.toLowerCase().includes(query))
    )
  }

  const filtered = items.filter(item => {
    const matchesType = activeFilter === 'all' || (item.type || item.filterKey) === activeFilter
    return matchesType && matchesSearch(item)
  })

  const sorted = sortItems(filtered, flags, sortMode)
  const dominantTag = detectDominantTag(sorted)

  const groups = dominantTag
    ? [
        { label: dominantTag, items: sorted.filter(i => (Array.isArray(i.tags) ? i.tags : []).includes(dominantTag)) },
        { label: null, items: sorted.filter(i => !(Array.isArray(i.tags) ? i.tags : []).includes(dominantTag)) },
      ].filter(g => g.items.length > 0)
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
    <div className="pt-8 pb-24 px-6 md:px-12 relative min-h-screen">

      {/* Page header */}
      <section className="mb-xl relative">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Digital Sentiment</h1>
            <div className="px-3 py-1 rounded-full bg-surface-container-high border border-white/10 flex items-center gap-2 w-fit">
              <div className="w-2 h-2 rounded-full bg-secondary-container shadow-[0_0_8px_#00eefc]" />
              <span className="font-label-sm text-label-sm text-secondary-fixed">Reflective Neon</span>
            </div>
          </div>
          
          {/* URL Capture Section - Integrated with glass styling */}
          <div className="
            flex w-full lg:w-auto
            flex-col sm:flex-row
            sm:flex-wrap lg:flex-nowrap
            gap-2 sm:gap-2
            items-stretch sm:items-center
            bg-surface-container/20 backdrop-blur-md
            border border-white/5
            rounded-xl sm:rounded-full
            px-3 py-3 sm:px-2 sm:py-1.5
            ">
            <input
              type="text"
              placeholder="Paste URL..."
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUrlAdd()}
              className="
                w-full sm:flex-1 lg:w-56
                px-3 py-2 sm:py-1.5
                bg-transparent
                text-on-surface
                placeholder-on-surface-variant/60
                focus:outline-none
                text-sm
              "
            />
            <div className="flex w-full sm:w-auto gap-2">
              <button
                onClick={handleUrlAdd}
                className="
                  w-full sm:w-auto
                  flex items-center justify-center
                  px-3 py-2 sm:py-1
                  rounded-full
                  text-xs
                  whitespace-nowrap
                  bg-surface-container
                  border border-white/10
                  text-on-surface-variant
                  hover:bg-surface-container-high
                  hover:text-on-surface
                  transition-all
                "
              >
                Add URL
              </button>
    
              <button
                onClick={() => navigate('/add')}
                className="
                  w-full sm:w-auto
                  flex items-center justify-center
                  px-3 py-2 sm:py-1
                  rounded-full
                  text-xs
                  whitespace-nowrap
                  bg-primary text-on-primary-fixed
                  hover:shadow-[0_0_15px_rgba(255,176,203,0.4)]
                  transition-all
                "
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Add Item</span>
              </button>
            </div>
          </div>
        </div>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Your curated memories from the past cycle, organized by emotional resonance rather than chronology.
        </p>
      </section>

      <div className="pixel-divider mb-xl w-full" />

      {/* Revisit section */}
      <section className="mb-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-md">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">psychology</span>
            <h2 className="font-headline-md text-headline-md text-on-surface">What should I revisit today?</h2>
          </div>

          {/* Search input */}
          <div className="flex items-center gap-2 flex-1 sm:flex-none sm:max-w-xs">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 rounded-full bg-surface-container border border-white/10 text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary transition-colors font-body-sm text-body-sm"
            />
          </div>
        </div>

        {/* Filter chips + sort toggle */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-md">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {FILTER_KEYS.map(key => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`px-3 py-1 rounded-full font-label-sm text-label-sm border whitespace-nowrap transition-all duration-200 ${
                  activeFilter === key
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-surface-container-high border-white/10 text-on-surface-variant hover:border-white/30 hover:text-on-surface'
                }`}
              >
                {FILTER_LABELS[key]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-px border border-white/10 rounded-lg overflow-hidden flex-shrink-0">
            {SORT_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortMode(key)}
                className={`px-3 py-1 font-label-sm text-label-sm text-xs transition-colors ${
                  sortMode === key
                    ? 'bg-surface-container-high text-on-surface'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid / empty states */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border border-white/5 rounded-xl bg-surface-container-lowest gap-4">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl">add_box</span>
            <p className="text-on-surface font-body-md text-body-md text-center">Start by adding or capturing items</p>
            <button
              onClick={() => navigate('/add')}
              className="px-4 py-2 rounded-full bg-primary text-on-primary font-label-sm text-label-sm hover:shadow-[0_0_15px_#ff479c] transition-all"
            >
              Add Item
            </button>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 border border-white/5 rounded-xl bg-surface-container-lowest gap-2 text-center px-6">
            <span className="material-symbols-outlined text-on-surface-variant text-3xl">search_off</span>
            <p className="text-on-surface font-body-md text-body-md">No items match your search</p>
            <p className="text-on-surface-variant font-body-sm text-body-sm">Try a different filter or add new items</p>
          </div>
        ) : groups ? (
          <div className="space-y-8">
            {groups.map((group, i) => (
              <div key={group.label ?? '__other'}>
                {group.label && (
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">#{group.label}</span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>
                )}
                {!group.label && i > 0 && (
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Other</span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>
                )}
                <BentoGrid items={group.items} onSelect={handleSelect} />
              </div>
            ))}
          </div>
        ) : (
          <BentoGrid items={sorted} onSelect={handleSelect} />
        )}
      </section>

      {/* Suggested for you */}
      {suggestions.length > 0 && (
        <section className="mb-xl">
          <div className="flex items-center gap-2 mb-md">
            <span className="material-symbols-outlined text-secondary-fixed-dim">auto_awesome</span>
            <h2 className="font-headline-md text-headline-md text-on-surface">Suggested for you</h2>
          </div>
          <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map(item => {
              const safe = safeItem(item)
              const { badge } = mapItemToUI(item)
              return (
                <article
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className="cursor-pointer flex items-center gap-3 p-3 rounded-xl bg-surface-container-high border border-white/10 hover:border-white/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden">
                    {item.thumbnail
                      ? <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gradient-to-br from-primary/20 via-tertiary/10 to-secondary/20" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="font-label-sm text-label-sm text-on-surface truncate">{safe.title}</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant opacity-60">{badge}</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant ml-auto text-[16px]">chevron_right</span>
                </article>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
