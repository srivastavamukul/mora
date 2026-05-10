import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { createJournalEntry } from '../utils/createJournalEntry'

function parseTags(value) {
  return value
    .split(/[,\s]+/)
    .map(tag => tag.trim().replace(/^#/, ''))
    .filter(Boolean)
}

export default function JournalComposeModal({ onClose, onSave }) {
  const [text, setText] = useState('')
  const [tags, setTags] = useState('')

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const canSave = useMemo(() => text.trim().length > 0, [text])

  const handleSave = () => {
    const entry = createJournalEntry(text)
    const extraTags = parseTags(tags)
    const mergedTags = Array.from(new Set([...(entry.tags || []), ...extraTags]))

    onSave({
      ...entry,
      tags: mergedTags,
    })
  }

  return createPortal(
    <div className="m-compose-modal-scrim" onClick={onClose}>
      <div className="m-compose-modal" onClick={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="mora-compose-title">
        <header className="m-compose-modal-head">
          <span className="m-eyebrow">A THOUGHT</span>
          <button type="button" onClick={onClose} className="m-compose-modal-close" aria-label="Close capture">
            <i className="ph ph-x" />
          </button>
        </header>

        <textarea
          id="mora-compose-title"
          autoFocus
          value={text}
          onChange={event => setText(event.target.value)}
          placeholder="What's worth remembering?"
          rows={6}
          className="m-compose-modal-textarea"
        />

        <div className="m-compose-modal-tags">
          <i className="ph ph-hash" />
          <input
            value={tags}
            onChange={event => setTags(event.target.value)}
            placeholder="add tags…"
            aria-label="Add tags"
          />
        </div>

        <footer className="m-compose-modal-foot">
          <span className="m-compose-modal-meta">Kept locally. Never sent.</span>
          <div className="m-compose-modal-actions">
            <button type="button" className="m-btn m-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="button" className="m-btn m-btn-primary" onClick={handleSave} disabled={!canSave}>
              <i className="ph-fill ph-bookmark-simple" />
              Keep
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  )
}
