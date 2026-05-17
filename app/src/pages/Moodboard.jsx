import { useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import {
  ActiveFilters,
  Eyebrow,
  FILTER_DEFINITIONS,
  MemoryCard,
  Pill,
  Rule,
  SourceChip,
  TagFilterBar,
  mapItemToMemory,
  searchMemories,
} from '../components/MoraUI'
import { filterItemsAdvanced, getTopTags } from '../utils/filterItems'
import { buildDisplayMemory } from '../utils/buildDisplayMemory'
import { OnboardingHint } from '../components/OnboardingHint'

function sortMemories(memories, sort) {
  if (sort === 'recent') {
    return [...memories].sort((a, b) => (b.raw.createdAt || 0) - (a.raw.createdAt || 0))
  }
  return memories
}

export default function Moodboard() {
  const navigate = useNavigate()
  const { query } = useOutletContext()
  const { items, flags, resurfacedItems, setSelectedItemId, personalRecallMoments } = useApp()
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('feeling')
  const [activeTags, setActiveTags] = useState([])
  const [activeSource, setActiveSource] = useState(null)

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

  const topTags = useMemo(() => getTopTags(items, 8), [items])

  const filteredMemories = useMemo(() => {
    const base = filterItemsAdvanced(memories, { type: filter, tags: activeTags, source: activeSource })
    return sortMemories(searchMemories(base, query), sort)
  }, [memories, filter, activeTags, activeSource, query, sort])

  const openItem = (id) => {
    setSelectedItemId(id)
    navigate('/item')
  }

  const toggleTag = (tag) => {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
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
                <span className="m-resurface-title">{buildDisplayMemory(memory.raw).displayTitle}</span>
                <SourceChip source={memory.source} />
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {personalRecallMoments && personalRecallMoments.length > 0 && (
        <section className="m-familiar">
          <Eyebrow color="var(--mora-ochre)">FAMILIAR THEMES</Eyebrow>
          <div className="m-familiar-moments">
            {personalRecallMoments.map((moment, i) => (
              <p key={i} className="m-familiar-moment">{moment}</p>
            ))}
          </div>
        </section>
      )}

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
          <TagFilterBar topTags={topTags} activeTags={activeTags} onToggle={toggleTag} />
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

      <ActiveFilters
        activeTags={activeTags}
        activeSource={activeSource}
        onRemoveTag={tag => setActiveTags(prev => prev.filter(t => t !== tag))}
        onRemoveSource={() => setActiveSource(null)}
      />

      {memories.length >= 5 && (
        <OnboardingHint hintKey="search">
          Mora understands meaning. Try searching a mood, a theme, or a feeling — not just a word.
        </OnboardingHint>
      )}

      {memories.length === 0 ? (
        <div className="m-empty">
          <p>Start with something worth remembering. A song, a quote, an article you want to return to.</p>
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="m-empty">
          <p>Nothing matches. Try a different word, or clear the filter.</p>
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
