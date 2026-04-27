import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Constellations() {
  const { items, setSelectedItemId } = useApp()
  const navigate = useNavigate()

  const groups = items.reduce((acc, item) => {
    const tag = item.tags[0] ?? 'uncategorized'
    if (!acc[tag]) acc[tag] = []
    acc[tag].push(item)
    return acc
  }, {})

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

      <div className="flex flex-col gap-10">
        {Object.entries(groups).map(([tag, groupItems]) => (
          <section key={tag}>
            <h2 className="font-display-sm text-display-sm text-on-surface mb-4 capitalize border-b border-white/5 pb-2">
              #{tag}
            </h2>
            <div className="flex flex-col gap-3">
              {groupItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className="w-full text-left bg-surface-container rounded-xl px-5 py-4 hover:bg-surface-container-high transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
                        {item.badge}
                      </span>
                      <p className="font-body-lg text-body-lg text-on-surface mt-1">{item.title}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end shrink-0">
                      {item.tags.map(t => (
                        <span key={t} className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
