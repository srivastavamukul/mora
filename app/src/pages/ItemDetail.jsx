import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { logEvent } from '../utils/eventLogger'
import { getRelatedItems } from '../utils/getRelatedItems'
import { generateItemSummary } from '../utils/generateItemSummary'
import { hasPrivateContext } from '../utils/hasPrivateContext'
import { buildDisplayMemory } from '../utils/buildDisplayMemory'

const SOURCE_COLOR = {
  spotify: 'moss',
  pinterest: 'ember',
  youtube: 'ochre',
  instagram: 'ember',
  'mora · journal': 'indigo',
  manual: 'ink',
  web: 'ink',
  mora: 'indigo',
  nytimes: 'ink',
  'are.na': 'ink',
  google: 'ink',
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

function relativeTime(ts) {
  if (!ts) return ''
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

function platformLabel(source) {
  const s = (source || '').toLowerCase()
  if (s === 'youtube') return 'YouTube'
  if (s === 'instagram') return 'Instagram'
  if (s === 'pinterest') return 'Pinterest'
  if (s === 'spotify') return 'Spotify'
  return null
}

function figureLabel(item) {
  if (item.author) return item.author
  if (item.source) return item.source
  return 'Saved memory'
}

function DetailFigure({ item, onOpenLink, onBrokenThumb }) {
  const hasThumb = !!item.thumbnail
  const isVideo = item.type === 'video' || item.source === 'youtube' || item.source === 'instagram'
  const platform = platformLabel(item.source)
  const isPinterest = (item.source || '').toLowerCase() === 'pinterest'
  const isInstagram = (item.source || '').toLowerCase() === 'instagram'

  const figureStyle = {}
  if (isInstagram && item.type === 'video') {
    figureStyle.height = 420
    figureStyle.maxHeight = '60vh'
  } else if (isInstagram) {
    figureStyle.height = 360
    figureStyle.maxHeight = '50vh'
  } else if (isPinterest) {
    figureStyle.height = 320
  }

  return (
    <figure
      className="m-detail-figure"
      style={figureStyle}
      onClick={() => onOpenLink(item.url)}
      role={item.url ? 'button' : undefined}
      tabIndex={item.url ? 0 : undefined}
      aria-label={item.url ? 'Open original link' : undefined}
      onKeyDown={item.url ? e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpenLink(item.url)) : undefined}
    >
      {hasThumb ? (
        <img
          src={item.thumbnail}
          alt={item.title || ''}
          onError={onBrokenThumb}
        />
      ) : (
        <div className="m-detail-figure-gradient" />
      )}
      <span className="m-card-grain" />
      {isVideo && (
        <div className="m-detail-figure-play">
          <span className="m-detail-figure-play-btn">
            <i className="ph ph-play" style={{ fontSize: 22 }} />
          </span>
        </div>
      )}
      {platform && <span className="m-detail-figure-badge">{platform}</span>}
      <figcaption>{figureLabel(item)} · {relativeTime(item.createdAt)}</figcaption>
    </figure>
  )
}

function EventBlock({ item }) {
  if (!item.memoryDate) return null
  return (
    <section className="m-detail-event">
      <span className="m-eyebrow">MEMORY EVENT</span>
      <div className="m-detail-event-row">
        <span className="m-detail-event-date">{item.memoryDate}</span>
        {item.memoryType && <span className="m-detail-event-type">{item.memoryType}</span>}
      </div>
    </section>
  )
}

export default function ItemDetail() {
  const navigate = useNavigate()
  const { items, selectedItemId, setSelectedItemId, flags, toggleFlag, deleteItem, updateItem } = useApp()
  const item = items.find(i => i.id === selectedItemId) || null
  const [linkError, setLinkError] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [collectionValue, setCollectionValue] = useState('')
  const [isEditingCollection, setIsEditingCollection] = useState(false)
  const [thumbFailed, setThumbFailed] = useState(false)

  useEffect(() => {
    if (!item) return
    logEvent(item.id, 'open')
  }, [item])

  useEffect(() => {
    setLinkError(false)
    setThumbFailed(false)
    setNoteText(item?.privateNote || '')
    setIsEditingNote(false)
    setCollectionValue(item?.collection || '')
    setIsEditingCollection(false)
  }, [item?.id, item?.privateNote, item?.collection])

  const itemFlags = item ? (flags[item.id] ?? {}) : {}
  const itemTags = useMemo(() => Array.isArray(item?.tags) ? item.tags : [], [item])
  const relatedItems = useMemo(() => (item ? getRelatedItems(item, items) : []), [item, items])
  const summary = useMemo(() => (item ? generateItemSummary(item) : ''), [item])

  if (!item) {
    return (
      <article className="m-detail" style={{ paddingTop: 60 }}>
        <div className="m-empty" style={{ minHeight: '50vh', justifyContent: 'center' }}>
          <p style={{ color: 'var(--mora-ink-4)' }}>This memory feels out of reach right now.</p>
        </div>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/moodboard" className="m-btn m-btn-secondary">
            Back to library
          </Link>
        </div>
      </article>
    )
  }

  const type = item.type || item.filterKey || 'link'
  const isNote = type === 'note'
  const isJournal = type === 'journal'
  const { displayTitle } = buildDisplayMemory(item)
  const bodyText = item.description || item.body || ''
  const authorLine = item.author ? `— ${item.author}` : ''
  const showFigure = !thumbFailed && (item.thumbnail || item.url) && !(isNote || isJournal)

  const handleOpenLink = (url) => {
    if (!url) {
      setLinkError(true)
      return
    }
    try {
      const w = window.open(url, '_blank', 'noopener,noreferrer')
      if (!w) setLinkError(true)
    } catch {
      setLinkError(true)
    }
  }

  const handleRelatedClick = (relatedItem) => {
    setSelectedItemId(relatedItem.id)
    navigate('/item')
  }

  const handleDelete = () => {
    if (confirm('Let go of this memory?')) {
      deleteItem(item.id)
      navigate('/moodboard')
    }
  }

  return (
    <article className="m-detail m-detail-page">
      <Link to="/moodboard" className="m-back">
        <i className="ph ph-arrow-left" /> Back to Library
      </Link>

      {showFigure && (
        <DetailFigure
          item={item}
          onOpenLink={handleOpenLink}
          onBrokenThumb={() => setThumbFailed(true)}
        />
      )}

      {linkError && (
        <div className="m-detail-error">
          This link seems to have drifted away. It might be broken or currently unavailable.
        </div>
      )}

      <div className="m-detail-head">
        <span className="m-detail-time">{relativeTime(item.createdAt)}</span>
        <SourceChip source={item.source || 'web'} />
        {hasPrivateContext(item) && (
          <span className="m-detail-private-badge">
            <i className="ph ph-lock-simple" style={{ fontSize: 10 }} /> Personal
          </span>
        )}
      </div>

      {(isNote || isJournal) ? (
        <blockquote className="m-detail-quote">{displayTitle}</blockquote>
      ) : (
        <h1 className="m-detail-title">{displayTitle}</h1>
      )}

      {authorLine && <p className="m-detail-author">{authorLine}</p>}

      {bodyText ? (
        <p className="m-detail-body">{bodyText}</p>
      ) : summary && summary !== displayTitle ? (
        <p className="m-detail-summary">{summary}</p>
      ) : null}

      <div className="m-detail-actions">
        <button
          className={'m-btn ' + (itemFlags.isSaved ? 'm-btn-kept' : 'm-btn-secondary')}
          onClick={() => toggleFlag(item.id, 'isSaved')}
        >
          <i className={itemFlags.isSaved ? 'ph-fill ph-bookmark-simple' : 'ph ph-bookmark-simple'} />
          {itemFlags.isSaved ? 'Kept' : 'Save'}
        </button>
        <button
          className={'m-btn ' + (itemFlags.isTried ? 'm-btn-kept' : 'm-btn-secondary')}
          onClick={() => toggleFlag(item.id, 'isTried')}
        >
          <i className={itemFlags.isTried ? 'ph-fill ph-check-circle' : 'ph ph-check-circle'} />
          {itemFlags.isTried ? 'Tried' : 'Mark as tried'}
        </button>
        {item.url && (
          <button className="m-btn m-btn-ghost" onClick={() => handleOpenLink(item.url)}>
            <i className="ph ph-arrow-up-right" /> Open original
          </button>
        )}
        <button className="m-btn m-btn-ghost" onClick={() => navigate(`/add?id=${item.id}`)}>
          <i className="ph ph-pencil-simple" /> Edit
        </button>
        <button className="m-btn m-btn-ghost m-detail-delete" onClick={handleDelete}>
          <i className="ph ph-trash" /> Let it go
        </button>
      </div>

      {itemTags.length > 0 && (
        <section className="m-detail-tags">
          <span className="m-eyebrow">TAGS</span>
          <div className="m-detail-tag-row">
            {itemTags.map(tag => (
              <span key={tag} className="m-tag">#{tag}</span>
            ))}
          </div>
        </section>
      )}

      <section className="m-detail-private">
        <div className="m-detail-private-head">
          <span className="m-eyebrow">YOUR PRIVATE NOTES</span>
          {!isEditingNote && (
            <button
              onClick={() => setIsEditingNote(true)}
              className="m-btn m-btn-ghost m-detail-inline-action"
            >
              {item.privateNote ? 'Edit' : 'Add a note'}
            </button>
          )}
        </div>
        {isEditingNote ? (
          <>
            <textarea
              autoFocus
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="A place for what only you should hear."
              aria-label="Private note"
              rows={3}
            />
            <div className="m-detail-private-actions">
              <button
                onClick={() => { setNoteText(item.privateNote || ''); setIsEditingNote(false) }}
                className="m-btn m-btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={() => { updateItem(item.id, { privateNote: noteText.trim() || null }); setIsEditingNote(false) }}
                className="m-btn m-btn-secondary"
              >
                Save
              </button>
            </div>
          </>
        ) : item.privateNote ? (
          <p className="m-detail-body m-detail-private-body">{item.privateNote}</p>
        ) : (
          <p className="m-detail-private-empty">A place for what only you should hear.</p>
        )}
      </section>

      <section className="m-detail-collection">
        <div className="m-detail-collection-head">
          <span className="m-eyebrow">COLLECTION</span>
          {!isEditingCollection && (
            <button
              onClick={() => setIsEditingCollection(true)}
              className="m-btn m-btn-ghost m-detail-inline-action"
            >
              {item.collection ? 'Edit' : 'Assign'}
            </button>
          )}
        </div>
        {isEditingCollection ? (
          <>
            <div className="m-detail-collection-presets">
              {['Ideas', 'Personal', 'Design', 'Research', 'Travel'].map(preset => (
                <button
                  key={preset}
                  onClick={() => setCollectionValue(preset)}
                  className={'m-pill' + (collectionValue === preset ? ' is-active' : '')}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={collectionValue}
              onChange={e => setCollectionValue(e.target.value)}
              placeholder="Type a collection name"
              aria-label="Custom collection name"
            />
            <div className="m-detail-collection-actions">
              <button
                onClick={() => { setCollectionValue(item.collection || ''); setIsEditingCollection(false) }}
                className="m-btn m-btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateItem(item.id, { collection: collectionValue.trim() || null })
                  setIsEditingCollection(false)
                }}
                className="m-btn m-btn-secondary"
              >
                Save
              </button>
            </div>
          </>
        ) : item.collection ? (
          <p className="m-detail-collection-value">{item.collection}</p>
        ) : (
          <p className="m-detail-private-empty">Not tied to any collection yet.</p>
        )}
      </section>

      <EventBlock item={item} />

      {relatedItems.length > 0 && (
        <section className="m-detail-related">
          <span className="m-eyebrow">RELATED</span>
          <h2 className="m-related-h">Other memories that share a thread</h2>
          <div className="m-related-list">
            {relatedItems.map(rel => (
              <div
                key={rel.id}
                className="m-related-item"
                onClick={() => handleRelatedClick(rel)}
                role="button"
                tabIndex={0}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), handleRelatedClick(rel))}
              >
                <span className="m-related-time">{relativeTime(rel.createdAt)}</span>
                <span className="m-related-title">{buildDisplayMemory(rel).displayTitle}</span>
                <span className="m-related-source">{rel.source || 'Saved'}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
