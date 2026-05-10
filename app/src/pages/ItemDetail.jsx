import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { mapItemToUI } from '../utils/mapItemToUI'
import { logEvent } from '../utils/eventLogger'
import { getRelatedItems } from '../utils/getRelatedItems'
import { generateItemSummary } from '../utils/generateItemSummary'
import { hasPrivateContext } from '../utils/hasPrivateContext'

/* ─── Source chip (reused from Moodboard) ─── */

const SOURCE_COLOR = {
  spotify: 'moss', pinterest: 'ember', youtube: 'ochre',
  'mora · journal': 'indigo', manual: 'ink', web: 'ink',
  mora: 'indigo', nytimes: 'ink', 'are.na': 'ink', google: 'ink',
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

/* ─── Helpers ─── */

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

/* ─── Figure (platform-aware thumb/media) ─── */

function DetailFigure({ item, onOpenLink }) {
  const hasThumb = !!item.thumbnail
  const isVideo = item.type === 'video' || item.source === 'youtube'
  const platform = platformLabel(item.source)

  // Instagram: taller aspect for reels
  const figureStyle = {}
  if (item.source === 'instagram' && item.type === 'video') {
    figureStyle.height = 420
    figureStyle.maxHeight = '60vh'
  } else if (item.source === 'instagram') {
    figureStyle.height = 360
    figureStyle.maxHeight = '50vh'
  } else if (item.source === 'pinterest') {
    figureStyle.height = 320
  }

  return (
    <figure
      className="m-detail-figure"
      style={figureStyle}
      onClick={() => onOpenLink(item.url)}
      role="button"
      tabIndex={0}
      aria-label="Open original link"
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpenLink(item.url))}
    >
      {hasThumb ? (
        <img
          src={item.thumbnail}
          alt={item.title || ''}
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextSibling && (e.target.nextSibling.style.display = 'block')
          }}
        />
      ) : (
        <div className="m-detail-figure-gradient" />
      )}
      {/* Hidden fallback gradient — shown if img errors */}
      {hasThumb && <div className="m-detail-figure-gradient" style={{ display: 'none', position: 'absolute', inset: 0 }} />}
      <span className="m-card-grain" />
      {linkError && (
        <div style={{ padding: '16px 20px', background: 'var(--mora-paper-deep)', color: 'var(--mora-ink-2)', borderRadius: 12, marginBottom: 24, fontSize: 13, border: '1px solid var(--mora-rule-soft)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="ph ph-warning-circle" style={{ fontSize: 18, color: 'var(--mora-ember)' }} />
          This link seems to have drifted away. It might be broken or currently unavailable.
        </div>
      )}
      {isVideo && (
        <div className="m-detail-figure-play">
          <span className="m-detail-figure-play-btn">
            <i className="ph ph-play" style={{ fontSize: 22 }} />
          </span>
        </div>
      )}
      {platform && <span className="m-detail-figure-badge">{platform}</span>}
      {item.source && !platform && (
        <figcaption>{item.source} · {relativeTime(item.createdAt)}</figcaption>
      )}
    </figure>
  )
}

/* ─── Main component ─── */

export default function ItemDetail() {
  const navigate = useNavigate()
  const { items, selectedItemId, setSelectedItemId, flags, toggleFlag, deleteItem, updateItem } = useApp()
  const item = items.find(i => i.id === selectedItemId)

  useEffect(() => {
    if (!item) return
    logEvent(item.id, 'open')
  }, [item?.id])
  if (!item) {
    return (
      <article className="m-detail" style={{ paddingTop: 60 }}>
        <div className="m-empty" style={{ minHeight: '50vh', justifyContent: 'center' }}>
          <i className="ph ph-moon" style={{ color: 'var(--mora-ink-4)' }} />
          <p style={{ color: 'var(--mora-ink-4)' }}>This memory seems to be out of reach.</p>
        </div>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/moodboard" className="m-btn m-btn-secondary">
            Return to Library
          </Link>
        </div>
      </article>
    )
  }

  const [linkError, setLinkError] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [collectionValue, setCollectionValue] = useState('')
  const [isEditingCollection, setIsEditingCollection] = useState(false)

  useEffect(() => {
    setLinkError(false)
    setNoteText(item?.privateNote || '')
    setIsEditingNote(false)
    setCollectionValue(item?.collection || '')
    setIsEditingCollection(false)
  }, [item?.id])

  const handleOpenLink = (url) => {
    if (!url) { setLinkError(true); return }
    try {
      const w = window.open(url, '_blank', 'noopener,noreferrer')
      if (!w) setLinkError(true)
    } catch {
      setLinkError(true)
    }
  }

  const itemFlags = flags[item.id] ?? {}
  const itemTags = Array.isArray(item.tags) ? item.tags : []
  const relatedItems = getRelatedItems(item, items)
  const summary = generateItemSummary(item)
  const type = item.type || item.filterKey || 'link'
  const isNote = type === 'note'
  const isJournal = type === 'journal'

  const handleRelatedClick = (relatedItem) => {
    setSelectedItemId(relatedItem.id)
    navigate('/item')
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteItem(item.id)
      navigate('/moodboard')
    }
  }

  return (
    <article className="m-detail">

      {/* ── Back ── */}
      <Link to="/moodboard" className="m-back">
        <i className="ph ph-arrow-left" /> Back to library
      </Link>

      {/* ── Figure / Media ── */}
      {(item.thumbnail || item.url) && !(isNote || isJournal) && (
        <DetailFigure item={item} onOpenLink={handleOpenLink} />
      )}

      {linkError && (
        <div style={{ padding: '16px 20px', background: 'var(--mora-paper-deep)', color: 'var(--mora-ink-2)', borderRadius: 12, marginBottom: 24, fontSize: 13, border: '1px solid var(--mora-rule-soft)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="ph ph-warning-circle" style={{ fontSize: 18, color: 'var(--mora-ember)' }} />
          This link seems to have drifted away. It might be broken or currently unavailable.
        </div>
      )}

      {/* ── Head: source + time ── */}
      <div className="m-detail-head">
        <SourceChip source={item.source || 'web'} />
        <span className="m-detail-time">{relativeTime(item.createdAt)}</span>
        {hasPrivateContext(item) && (
          <span className="m-detail-private-badge">
            <i className="ph ph-lock-simple" style={{ fontSize: 10 }} /> Personal
          </span>
        )}
      </div>

      {/* ── Title / Quote ── */}
      {(isNote || isJournal) ? (
        <blockquote className="m-detail-quote">
          {item.title || 'Untitled'}
        </blockquote>
      ) : (
        <h1 className="m-detail-title">{item.title || 'Untitled'}</h1>
      )}

      {/* ── Author (if present) ── */}
      {item.author && <p className="m-detail-author">{item.author}</p>}

      {/* ── Description / Body / Summary ── */}
      {item.description ? (
        <p className="m-detail-body">{item.description}</p>
      ) : item.body ? (
        <p className="m-detail-body">{item.body}</p>
      ) : summary && summary !== item.title ? (
        <p className="m-detail-summary">{summary}</p>
      ) : null}

      {/* ── Rule ── */}
      <div className="m-rule">
        <span className="m-rule-line" />
        <span className="m-rule-line" />
      </div>

      {/* ── Actions ── */}
      <div className="m-detail-actions">
        <button
          className={'m-btn ' + (itemFlags.isSaved ? 'm-btn-primary' : 'm-btn-secondary')}
          onClick={() => toggleFlag(item.id, 'isSaved')}
        >
          <i className={itemFlags.isSaved ? 'ph-fill ph-bookmark-simple' : 'ph ph-bookmark-simple'} />
          {itemFlags.isSaved ? 'Kept' : 'Keep this'}
        </button>
        <button
          className={'m-btn ' + (itemFlags.isTried ? 'm-btn-primary' : 'm-btn-secondary')}
          onClick={() => toggleFlag(item.id, 'isTried')}
        >
          <i className={itemFlags.isTried ? 'ph-fill ph-check-circle' : 'ph ph-check-circle'} />
          {itemFlags.isTried ? 'Tried' : 'Mark as tried'}
        </button>
        {item.url && (
          <button className="m-btn m-btn-secondary" onClick={() => handleOpenLink(item.url)}>
            <i className="ph ph-arrow-up-right" /> Open original
          </button>
        )}
        <button className="m-btn m-btn-ghost" onClick={() => navigate(`/add?id=${item.id}`)}>
          <i className="ph ph-pencil-simple" /> Edit
        </button>
        <button className="m-btn m-btn-ghost" onClick={handleDelete} style={{ color: 'var(--mora-ember)' }}>
          <i className="ph ph-trash" /> Forget
        </button>
      </div>

      {/* ── Tags ── */}
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

      {/* ── Private note ── */}
      <section className="m-detail-private">
        <div className="m-detail-private-head">
          <i className="ph ph-lock-simple" style={{ fontSize: 14, color: 'var(--mora-ink-3)' }} />
          <span className="m-eyebrow">A NOTE TO YOURSELF</span>
          {!isEditingNote && (
            <button
              onClick={() => setIsEditingNote(true)}
              className="m-btn m-btn-ghost"
              style={{ marginLeft: 'auto', fontSize: 11, padding: '4px 8px' }}
            >
              {item.privateNote ? 'Edit' : 'Add note'}
            </button>
          )}
        </div>
        {isEditingNote ? (
          <>
            <textarea
              autoFocus
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Private note — only visible to you"
              aria-label="Private note"
              rows={3}
            />
            <div className="m-detail-private-actions">
              <button
                onClick={() => { setNoteText(item.privateNote || ''); setIsEditingNote(false) }}
                className="m-btn m-btn-ghost"
                style={{ fontSize: 12, padding: '6px 12px' }}
              >
                Cancel
              </button>
              <button
                onClick={() => { updateItem(item.id, { privateNote: noteText.trim() || null }); setIsEditingNote(false) }}
                className="m-btn m-btn-primary"
                style={{ fontSize: 12, padding: '6px 12px' }}
              >
                Save
              </button>
            </div>
          </>
        ) : item.privateNote ? (
          <p style={{ fontFamily: 'var(--mora-font-serif)', fontSize: 15, lineHeight: 1.55, color: 'var(--mora-ink-2)', whiteSpace: 'pre-wrap', margin: 0 }}>
            {item.privateNote}
          </p>
        ) : (
          <p className="m-detail-private-empty" style={{ fontStyle: 'italic', color: 'var(--mora-ink-4)', fontSize: 13, lineHeight: 1.5 }}>
            A quiet space waiting for your thoughts. Press the pencil to add a reflection.
          </p>
        )}
      </section>

      {/* ── Collection ── */}
      <section className="m-detail-collection">
        <div className="m-detail-collection-head">
          <i className="ph ph-folder-open" style={{ fontSize: 14, color: 'var(--mora-ochre)' }} />
          <span className="m-eyebrow">COLLECTION</span>
          {!isEditingCollection && (
            <button
              onClick={() => setIsEditingCollection(true)}
              className="m-btn m-btn-ghost"
              style={{ marginLeft: 'auto', fontSize: 11, padding: '4px 8px' }}
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
                  style={{ fontSize: 12, padding: '4px 12px' }}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={collectionValue}
              onChange={e => setCollectionValue(e.target.value)}
              placeholder="Or type a custom collection name"
              aria-label="Custom collection name"
            />
            <div className="m-detail-collection-actions">
              <button
                onClick={() => { setCollectionValue(item.collection || ''); setIsEditingCollection(false) }}
                className="m-btn m-btn-ghost"
                style={{ fontSize: 12, padding: '6px 12px' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateItem(item.id, { collection: collectionValue.trim() || null })
                  setIsEditingCollection(false)
                }}
                className="m-btn m-btn-primary"
                style={{ fontSize: 12, padding: '6px 12px' }}
              >
                Save
              </button>
            </div>
          </>
        ) : item.collection ? (
          <p className="m-detail-collection-value">{item.collection}</p>
        ) : (
          <p className="m-detail-private-empty" style={{ fontStyle: 'italic', color: 'var(--mora-ink-4)', fontSize: 13 }}>
            Unbound memory. Not tied to any collection.
          </p>
        )}
      </section>

      {/* ── Related items ── */}
      {relatedItems.length > 0 && (
        <section className="m-detail-related">
          <span className="m-eyebrow">
            <span className="m-eyebrow-dot" style={{ background: 'var(--mora-moss)' }} />
            NEAR THIS
          </span>
          <h2 className="m-related-h">Other memories that share a thread</h2>
          <div className="m-related-list">
            {relatedItems.map(rel => {
              const { badge } = mapItemToUI(rel)
              return (
                <div
                  key={rel.id}
                  className="m-related-item"
                  onClick={() => handleRelatedClick(rel)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), handleRelatedClick(rel))}
                >
                  <span className="m-related-title">{rel.title}</span>
                  <span className="m-related-source">{rel.source || badge}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </article>
  )
}
