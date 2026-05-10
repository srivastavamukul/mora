import { useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import {
  Eyebrow,
  FILTER_DEFINITIONS,
  MemoryCard,
  Pill,
  Rule,
  SourceChip,
  mapItemToMemory,
  matchesLibraryFilter,
  searchMemories,
} from '../components/MoraUI'

function sortMemories(memories, sort) {
  if (sort === 'recent') {
    return [...memories].sort((a, b) => (b.raw.createdAt || 0) - (a.raw.createdAt || 0))
  }
  return memories
}

export default function Moodboard() {
  const navigate = useNavigate()
  const { query } = useOutletContext()
  const { items, flags, resurfacedItems, setSelectedItemId } = useApp()
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('feeling')

  const memories = useMemo(
    () => items.map(item => mapItemToMemory(item, flags)),
    [items, flags]
  )

  const resurfaced = useMemo(
    () => resurfacedItems
      .slice(0, 3)
      .map(item => mapItemToMemory(item, flags))
      .filter(Boolean),
    [resurfacedItems, flags]
  )

  const filteredMemories = useMemo(() => {
    const base = memories.filter(memory => matchesLibraryFilter(memory, filter))
    return sortMemories(searchMemories(base, query), sort)
  }, [memories, filter, query, sort])

  const openItem = (id) => {
    setSelectedItemId(id)
    navigate('/item')
  }

  return (
    <div className="m-library">
      {resurfaced.length === 3 ? (
        <section className="m-resurface">
          <div className="m-resurface-head">
            <Eyebrow color="var(--mora-ochre)">A LITTLE FROM THE PAST</Eyebrow>
            <p className="m-resurface-blurb">
              Three memories from the past, brought up by something you saved this week.
            </p>
          </div>
          <div className="m-resurface-row">
            {resurfaced.map(memory => (
              <button key={memory.id} type="button" className="m-resurface-card" onClick={() => openItem(memory.id)}>
                <span className="m-resurface-when">{memory.time}</span>
                <span className="m-resurface-title">{memory.title}</span>
                <SourceChip source={memory.source} />
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <Rule ornament />

      <div className="m-filterbar">
        <div className="m-filters">
          {FILTER_DEFINITIONS.map(definition => (
            <Pill
              key={definition.id}
              active={filter === definition.id}
              onClick={() => setFilter(definition.id)}
            >
              {definition.label}
            </Pill>
          ))}
        </div>
        <div className="m-sort">
          <span className="m-sort-label">arranged by</span>
          <button
            type="button"
            className={`m-sort-btn${sort === 'feeling' ? ' is-active' : ''}`}
            onClick={() => setSort('feeling')}
          >
            feeling
          </button>
          <span className="m-sort-sep">·</span>
          <button
            type="button"
            className={`m-sort-btn${sort === 'recent' ? ' is-active' : ''}`}
            onClick={() => setSort('recent')}
          >
            most recent
          </button>
        </div>
      </div>

      {memories.length === 0 ? (
        <div className="m-empty">
          <p>Nothing here yet. When you save something — a song, a quote, a half-formed idea — it&apos;ll find a home in this room.</p>
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="m-empty">
          <p>Nothing matches that. Try a softer search, or clear the filter.</p>
        </div>
      ) : (
        <div className="m-grid">
          {filteredMemories.map(memory => (
            <MemoryCard key={memory.id} memory={memory} onOpen={openItem} />
          ))}
        </div>
      )}
    </div>
  )
}
