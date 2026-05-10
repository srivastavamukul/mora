import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { FILTER_KEYS, FILTER_LABELS } from '../data/items'
import { captureItem } from '../utils/captureItem'
import { deduplicateCapture } from '../utils/deduplicateCapture'
import { logEvent } from '../utils/eventLogger'

export default function AddItem() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { items, setItems, updateItem } = useApp()

  const itemId = searchParams.get('id')
  const existingItem = itemId ? items.find(i => i.id === itemId) : null
  const isEditing = !!existingItem

  const [formData, setFormData] = useState({
    title: '',
    source: '',
    filterKey: 'note',
    imageUrl: '',
    tags: '',
    mood: '',
    url: '',
  })

  useEffect(() => {
    if (existingItem) {
      setFormData({
        title: existingItem.title,
        source: existingItem.source,
        filterKey: existingItem.type,
        imageUrl: existingItem.metadata?.thumbnail || '',
        tags: existingItem.tags ? existingItem.tags.join(', ') : '',
        mood: existingItem.mood || '',
        url: existingItem.url || '',
      })
    }
  }, [existingItem])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.title.trim() && !formData.url) {
      alert('Title or URL is required')
      return
    }

    const itemData = captureItem({
      ...formData,
      type: formData.filterKey,
    }, existingItem)

    if (isEditing) {
      updateItem(existingItem.id, itemData)
      logEvent(existingItem.id, 'edit')
    } else {
      setItems(prev => {
        const { isDuplicate } = deduplicateCapture(prev, itemData)
        if (isDuplicate) return prev

        logEvent(itemData.id, 'save')
        return [...prev, itemData]
      })
    }

    navigate('/moodboard')
  }

  return (
    <div className="m-compose-page">
      <Link to="/moodboard" className="m-back">
        <i className="ph ph-arrow-left" /> Back to library
      </Link>

      <h1 className="m-compose-page-title">
        {isEditing ? 'Return to this memory' : 'Capture a thought'}
      </h1>
      <p className="m-compose-page-sub">
        {isEditing
          ? 'Refine what you kept. Add context, or soften its edges.'
          : "What's worth remembering?"
        }
      </p>

      <form onSubmit={handleSubmit}>
        <div className="m-form-group">
          <label htmlFor="url" className="m-form-label">
            <i className="ph ph-link-simple" style={{ fontSize: 12 }} /> URL
          </label>
          <input
            id="url"
            type="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            placeholder="https://…"
            className="m-form-input"
          />
          {!formData.url && (
            <p className="m-form-hint">Optional — leave empty for notes and journals.</p>
          )}
        </div>

        <div className="m-form-group">
          <label htmlFor="title" className="m-form-label">
            Title {!formData.url && <span style={{ color: 'var(--mora-ember)' }}>*</span>}
          </label>
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required={!formData.url}
            placeholder="Give this memory a name…"
            className="m-form-input"
          />
          {formData.url && !formData.title && (
            <p className="m-form-hint">Will be derived from the URL if left empty.</p>
          )}
        </div>

        <div className="m-form-group">
          <label htmlFor="source" className="m-form-label">
            Source {!formData.url && <span style={{ color: 'var(--mora-ember)' }}>*</span>}
          </label>
          <input
            id="source"
            type="text"
            name="source"
            value={formData.source}
            onChange={handleChange}
            required={!formData.url}
            placeholder="e.g., Spotify, Pinterest, Instagram"
            className="m-form-input"
          />
          {formData.url && !formData.source && (
            <p className="m-form-hint">Will be derived from the URL if left empty.</p>
          )}
        </div>

        <div className="m-form-group">
          <label htmlFor="filterKey" className="m-form-label">
            Type <span style={{ color: 'var(--mora-ember)' }}>*</span>
          </label>
          <select
            id="filterKey"
            name="filterKey"
            value={formData.filterKey}
            onChange={handleChange}
            className="m-form-select"
          >
            {FILTER_KEYS.filter(k => k !== 'all').map(key => (
              <option key={key} value={key}>
                {FILTER_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        <div className="m-form-group">
          <label htmlFor="imageUrl" className="m-form-label">
            <i className="ph ph-image" style={{ fontSize: 12 }} /> Image URL
          </label>
          <input
            id="imageUrl"
            type="url"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            placeholder="https://…"
            className="m-form-input"
          />
        </div>

        <div className="m-form-group">
          <label htmlFor="tags" className="m-form-label">
            <i className="ph ph-hash" style={{ fontSize: 12 }} /> Tags
          </label>
          <div className="m-compose-tags">
            <i className="ph ph-hash" />
            <input
              id="tags"
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="add tags…"
            />
          </div>
        </div>

        <div className="m-form-group">
          <label htmlFor="mood" className="m-form-label">
            <i className="ph ph-sun-horizon" style={{ fontSize: 12 }} /> Mood
          </label>
          <input
            id="mood"
            type="text"
            name="mood"
            value={formData.mood}
            onChange={handleChange}
            placeholder="What kind of feeling does it carry?"
            className="m-form-input"
          />
        </div>

        <div className="m-rule" style={{ margin: '24px 0 16px' }}>
          <span className="m-rule-line" />
          <span className="m-rule-line" />
        </div>

        <p className="m-compose-meta" style={{ marginBottom: 12 }}>
          It stays between you and Mora.
        </p>

        <div className="m-form-actions">
          <button type="submit" className="m-btn m-btn-primary">
            <i className="ph ph-bookmark-simple" />
            {isEditing ? 'Update' : 'Keep'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/moodboard')}
            className="m-btn m-btn-ghost"
          >
            Not now
          </button>
        </div>
      </form>
    </div>
  )
}
