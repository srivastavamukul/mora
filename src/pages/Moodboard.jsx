import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FILTER_KEYS, FILTER_LABELS } from '../data/items'
import { useApp } from '../context/AppContext'
import { mapItemToUI } from '../utils/mapItemToUI'

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
    case 'image':    return <ImageTile item={item} />
    case 'note':     return <NoteTile item={item} />
    case 'activity': return <ActivityTile item={item} />
    default:
    return (
      <div className="p-4">
        <h3 className="text-on-surface font-headline-md">
          {item.title || 'Saved Link'}
        </h3>
        <p className="text-on-surface-variant text-body-sm">
          {item.source || 'Unknown source'}
        </p>
      </div>
    )
  }
}

export default function Moodboard() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const { items, setSelectedItemId } = useApp()

  const matchesSearch = (item) => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return true

    return (
      item.title.toLowerCase().includes(query) ||
      item.source.toLowerCase().includes(query) ||
      item.tags.some(tag => tag.toLowerCase().includes(query)) ||
      (item.mood && item.mood.toLowerCase().includes(query))
    )
  }

  const filtered = items.filter(item => {
    const matchesType = activeFilter === 'all' || (item.type || item.filterKey) === activeFilter
    const matchesSearch_result = matchesSearch(item)
    return matchesType && matchesSearch_result
  })

  const filteredTagSet = new Set(filtered.flatMap(i => i.tags))
  const suggestions = activeFilter === 'all'
    ? []
    : items.filter(i => i.type !== activeFilter && i.tags.some(t => filteredTagSet.has(t)))

  return (
    <div className="pt-8 pb-24 px-6 md:px-12 relative min-h-screen">

      {/* Page header */}
      <section className="mb-xl relative">
        <div className="flex items-center justify-between gap-4 mb-sm">
          <div className="flex items-center gap-4">
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Digital Sentiment</h1>
            <div className="px-3 py-1 rounded-full bg-surface-container-high border border-white/10 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary-container shadow-[0_0_8px_#00eefc]" />
              <span className="font-label-sm text-label-sm text-secondary-fixed">Reflective Neon</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/add')}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-on-primary font-label-sm text-label-sm hover:shadow-[0_0_15px_#ff479c] transition-all whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Add Item
          </button>
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

        {/* Filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-wrap mb-md">
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

        {/* Dynamic bento grid */}
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-48 border border-white/5 rounded-xl bg-surface-container-lowest">
            <p className="text-on-surface-variant font-body-md text-body-md">
              {searchQuery.trim() ? 'No items found.' : 'No items for this filter.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            {filtered.map(item => {
              const { badge, badgeColor, colSpanClass, tiltClass } = mapItemToUI(item)
              return (
                <article
                  key={item.id}
                  onClick={() => { setSelectedItemId(item.id); navigate('/item') }}
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
                  {renderTileContent({
                    ...item,
                    title: item.title || 'Saved Link',
                    body: item.body || 'Saved item'
                  })}
                </article>
              )
            })}
          </div>
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
              const { badge } = mapItemToUI(item)
              return (
                <article
                  key={item.id}
                  onClick={() => { setSelectedItemId(item.id); navigate('/item') }}
                  className="cursor-pointer flex items-center gap-3 p-3 rounded-xl bg-surface-container-high border border-white/10 hover:border-white/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 via-tertiary/10 to-secondary/20 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-label-sm text-label-sm text-on-surface truncate">{item.title}</p>
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
