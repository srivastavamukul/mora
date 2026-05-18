import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { groupItemsByTags } from '../utils/groupItems'
import { buildDisplayMemory } from '../utils/buildDisplayMemory'
import { enrichSemanticMetadata } from '../utils/enrichSemanticMetadata'

function relativeTimeLabel(ts) {
  if (!ts) return ''
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(diff / 86400000)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return 'last week'
  if (days < 90) return 'last month'
  if (days < 365) return 'last season'
  return 'earlier on'
}

function constellationBlurb(tag, items) {
  const sourceCounts = items.reduce((acc, item) => {
    const key = (item.source || 'web').toLowerCase()
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const dominantSource = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0]

  const prettySource = dominantSource
    ? dominantSource
        .split(/[\s.-]+/)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    : null

  const recentCount = items.filter(item => {
    const createdAt = item.createdAt || 0
    return Date.now() - createdAt < 1000 * 60 * 60 * 24 * 30
  }).length

  if (prettySource && recentCount >= Math.max(2, Math.ceil(items.length / 3))) {
    return `A thread around ${tag}, with several recent keeps and a strong pull toward ${prettySource}.`
  }

  if (prettySource) {
    return `A recurring thread around ${tag}, turning up often among what you've kept from ${prettySource}.`
  }

  return `A recurring thread around ${tag}, gathered from the patterns Mora has noticed in your archive.`
}

function openWithKey(e, handler) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    handler()
  }
}

export default function Constellations() {
  const { items, flags, setSelectedItemId } = useApp()
  const navigate = useNavigate()

  const enrichedItems = useMemo(() =>
    items.map(item => {
      const { themes } = enrichSemanticMetadata(item)
      if (themes.length === 0) return item
      const existing = Array.isArray(item.tags) ? item.tags : []
      return { ...item, tags: [...new Set([...existing, ...themes])] }
    }),
    [items]
  )

  const groups = groupItemsByTags(enrichedItems, flags)
  const groupEntries = Object.entries(groups).sort((a, b) => b[1].length - a[1].length)

  const handleItemClick = (id) => {
    setSelectedItemId(id)
    navigate('/item')
  }

  return (
    <div className="m-constellations">
      <p className="m-constellations-intro">
        Patterns Mora has noticed in what you've saved. They form on their own - you don't have to tend them.
      </p>

      {groupEntries.length === 0 ? (
        <p className="m-constellations-empty">Threads form as you keep saving. Mora will notice the patterns on its own — you don&apos;t have to tend them.</p>
      ) : (
        groupEntries.map(([tag, groupedItems]) => (
          <section key={tag} className="m-constellation">
            <div className="m-constellation-head">
              <h2 className="m-constellation-name">{tag}</h2>
              <span className="m-constellation-count">{groupedItems.length} saves</span>
            </div>

            <p className="m-constellation-blurb">{constellationBlurb(tag, groupedItems)}</p>

            <ul className="m-constellation-list">
              {groupedItems.map(item => (
                <li
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => openWithKey(e, () => handleItemClick(item.id))}
                >
                  <span className="m-cl-time">{relativeTimeLabel(item.createdAt)}</span>
                  <span className="m-cl-title">{buildDisplayMemory(item).displayTitle}</span>
                  <span className="m-cl-source">{item.source || 'web'}</span>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
