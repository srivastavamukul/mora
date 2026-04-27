import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { FILTER_KEYS, FILTER_LABELS } from '../data/items'

const BADGE_CONFIG = {
  song: { badge: 'SONG CLIP', badgeColor: 'text-primary' },
  image: { badge: 'PINNED IMAGE', badgeColor: 'text-tertiary' },
  note: { badge: 'NOTE', badgeColor: 'text-secondary' },
  insight: { badge: 'INSIGHT', badgeColor: 'text-secondary' },
  activity: { badge: 'ACTIVITY', badgeColor: 'text-on-surface-variant' },
}

const COLSPAN_CONFIG = {
  song: 'md:col-span-8',
  image: 'md:col-span-5',
  note: 'md:col-span-4',
  insight: 'md:col-span-4',
  activity: 'md:col-span-6',
}

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
  })

  useEffect(() => {
    if (existingItem) {
      setFormData({
        title: existingItem.title,
        source: existingItem.source,
        filterKey: existingItem.filterKey,
        imageUrl: existingItem.imageUrl || '',
        tags: existingItem.tags.join(', '),
        mood: existingItem.mood || '',
      })
    }
  }, [existingItem])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const parsedTags = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    const itemData = {
      title: formData.title,
      source: formData.source,
      filterKey: formData.filterKey,
      imageUrl: formData.imageUrl,
      tags: parsedTags.length > 0 ? parsedTags : ['uncategorized'],
      mood: formData.mood || null,
      ...BADGE_CONFIG[formData.filterKey],
      colSpanClass: COLSPAN_CONFIG[formData.filterKey],
    }

    if (isEditing) {
      updateItem(existingItem.id, itemData)
    } else {
      const newItem = {
        id: String(Date.now()),
        body: 'Added just now',
        daysAgo: 0,
        tiltClass: '',
        ...itemData,
      }
      setItems(prev => [...prev, newItem])
    }

    navigate('/moodboard')
  }

  return (
    <div className="pt-8 pb-24 px-6 lg:px-12 min-h-screen w-full max-w-2xl mx-auto">
      {/* Back Button */}
      <Link
        to="/moodboard"
        className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label-sm text-label-sm uppercase tracking-widest w-fit mb-8"
      >
        <span className="material-symbols-outlined">arrow_back</span>
        Back
      </Link>

      <h1 className="font-display-xl text-display-xl text-on-surface mb-8">
        {isEditing ? 'Edit Item' : 'Add New Item'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block font-label-lg text-label-lg text-on-surface mb-2">
            Title *
          </label>
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Enter item title"
            className="w-full px-4 py-3 rounded-xl bg-surface-container border border-white/10 text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Source */}
        <div>
          <label htmlFor="source" className="block font-label-lg text-label-lg text-on-surface mb-2">
            Source *
          </label>
          <input
            id="source"
            type="text"
            name="source"
            value={formData.source}
            onChange={handleChange}
            required
            placeholder="e.g., spotify, pinterest, instagram"
            className="w-full px-4 py-3 rounded-xl bg-surface-container border border-white/10 text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Type (filterKey) */}
        <div>
          <label htmlFor="filterKey" className="block font-label-lg text-label-lg text-on-surface mb-2">
            Type *
          </label>
          <select
            id="filterKey"
            name="filterKey"
            value={formData.filterKey}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-surface-container border border-white/10 text-on-surface focus:outline-none focus:border-primary transition-colors"
          >
            {FILTER_KEYS.filter(k => k !== 'all').map(key => (
              <option key={key} value={key}>
                {FILTER_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        {/* Image URL */}
        <div>
          <label htmlFor="imageUrl" className="block font-label-lg text-label-lg text-on-surface mb-2">
            Image URL
          </label>
          <input
            id="imageUrl"
            type="url"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            placeholder="https://..."
            className="w-full px-4 py-3 rounded-xl bg-surface-container border border-white/10 text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block font-label-lg text-label-lg text-on-surface mb-2">
            Tags (comma-separated)
          </label>
          <input
            id="tags"
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="e.g., synthwave, focus, night"
            className="w-full px-4 py-3 rounded-xl bg-surface-container border border-white/10 text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label htmlFor="mood" className="block font-label-lg text-label-lg text-on-surface mb-2">
            Mood
          </label>
          <input
            id="mood"
            type="text"
            name="mood"
            value={formData.mood}
            onChange={handleChange}
            placeholder="e.g., Reflective Neon"
            className="w-full px-4 py-3 rounded-xl bg-surface-container border border-white/10 text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 px-6 py-3 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg hover:shadow-[0_0_15px_#ff479c] transition-all"
          >
            {isEditing ? 'Update Item' : 'Add Item'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/moodboard')}
            className="flex-1 px-6 py-3 rounded-xl bg-surface-container border border-white/10 text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
