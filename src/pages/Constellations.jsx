import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { mapItemToUI } from '../utils/mapItemToUI'
import { groupItemsByTags } from '../utils/groupItems'

export default function Constellations() {
  const { items, flags, setSelectedItemId } = useApp()
  const navigate = useNavigate()

  const groups = groupItemsByTags(items, flags)

  const handleItemClick = (id) => {
    setSelectedItemId(id)
    navigate('/item')
  }

  return (
    <div className="pt-8 pb-24 px-6 lg:px-12 min-h-screen relative w-full">
      <div className="mb-12">
        <h1 className="font-display-xl text-display-xl text-on-background mb-2">Semantic Constellations</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          An intelligent map of your clustered interests.
        </p>
      </div>

      {Object.keys(groups).length === 0 ? (
        <p className="text-on-surface-variant font-body-md text-body-md mt-8">
          No clusters yet. Add items with tags to build constellations.
        </p>
      ) : (
        <div className="flex flex-col gap-10">
          {Object.entries(groups).map(([tag, groupItems]) => (
            <section key={tag}>
              <h2 className="font-display-sm text-display-sm text-on-surface mb-4 capitalize border-b border-white/5 pb-2">
                #{tag}
              </h2>
              <div className="flex flex-col gap-3">
                {groupItems.map(item => {
                  const { badge } = mapItemToUI(item)
                  const tags = Array.isArray(item.tags) ? item.tags : []
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className="w-full text-left bg-surface-container rounded-xl px-5 py-4 hover:bg-surface-container-high transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
                            {badge}
                          </span>
                          <p className="font-body-lg text-body-lg text-on-surface mt-1">{item.title || 'Saved Link'}</p>
                        </div>
                        {tags.length > 0 && (
                          <div className="flex gap-2 flex-wrap justify-end shrink-0">
                            {tags.map(t => (
                              <span key={t} className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
