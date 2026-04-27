import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

function FlagButton({ active, icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full border font-label-sm text-label-sm transition-all duration-200 ${
        active
          ? 'bg-primary/20 border-primary text-primary'
          : 'bg-surface-container-high border-white/10 text-on-surface-variant hover:border-white/30 hover:text-on-surface'
      }`}
    >
      <span className="material-symbols-outlined text-[16px]">{icon}</span>
      {label}
    </button>
  )
}

function RelatedCard({ item, onClick }) {
  return (
    <article
      onClick={onClick}
      className="cursor-pointer flex items-center gap-3 p-3 rounded-xl bg-surface-container-high border border-white/10 hover:border-white/30 transition-colors"
    >
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 via-tertiary/10 to-secondary/20 flex-shrink-0" />
      <div className="min-w-0">
        <p className="font-label-sm text-label-sm text-on-surface truncate">{item.title}</p>
        <p className="font-label-sm text-label-sm text-on-surface-variant opacity-60">{item.badge}</p>
      </div>
    </article>
  )
}

export default function ItemDetail() {
  const navigate = useNavigate()
  const { items, selectedItemId, setSelectedItemId, flags, toggleFlag } = useApp()
  const item = items.find(i => i.id === selectedItemId)

  if (!item) {
    return (
      <div className="pt-8 pb-24 px-6 lg:px-12 min-h-screen w-full max-w-7xl mx-auto">
        <div className="mb-8">
          <Link to="/moodboard" className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label-sm text-label-sm uppercase tracking-widest w-fit">
            <span className="material-symbols-outlined">arrow_back</span>
            Back
          </Link>
        </div>
        <p className="text-on-surface-variant font-body-md text-body-md">No item selected.</p>
      </div>
    )
  }

  const itemFlags = flags[item.id] ?? {}
  const relatedItems = items.filter(i => i.id !== item.id && i.tags.some(t => item.tags.includes(t)))

  const handleRelatedClick = (relatedItem) => {
    setSelectedItemId(relatedItem.id)
    navigate('/item')
  }

  return (
    <div className="pt-8 pb-24 px-6 lg:px-12 min-h-screen relative w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <Link
          to="/moodboard"
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label-sm text-label-sm uppercase tracking-widest w-fit"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back
        </Link>
      </div>

      <h1 className="font-display-xl text-display-xl text-on-surface mb-4">{item.title}</h1>

      <div className="w-full h-64 rounded-xl bg-surface-container-high mb-6 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-primary/20 via-tertiary/10 to-secondary/20" />
      </div>

      {/* Flags */}
      <div className="flex flex-wrap gap-3 mb-6">
        <FlagButton
          active={!!itemFlags.isTried}
          icon="check_circle"
          label={itemFlags.isTried ? 'Tried' : 'Mark as tried'}
          onClick={() => toggleFlag(item.id, 'isTried')}
        />
        <FlagButton
          active={!!itemFlags.isSaved}
          icon="bookmark"
          label={itemFlags.isSaved ? 'Saved' : 'Save'}
          onClick={() => toggleFlag(item.id, 'isSaved')}
        />
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-10">
        {item.tags.map(tag => (
          <span
            key={tag}
            className="px-3 py-1 rounded-full bg-surface-container-high border border-white/10 font-label-sm text-label-sm text-on-surface-variant"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Related items */}
      {relatedItems.length > 0 && (
        <section>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-4">Related</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {relatedItems.map(rel => (
              <RelatedCard key={rel.id} item={rel} onClick={() => handleRelatedClick(rel)} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
