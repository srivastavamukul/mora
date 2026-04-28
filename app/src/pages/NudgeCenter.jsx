import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

import { getContext } from '../utils/getContext'
import { scoreItems } from '../utils/scoreItems'
import { selectNudges } from '../utils/selectNudges'

export default function NudgeCenter() {
  const { items, flags, setSelectedItemId } = useApp()
  const navigate = useNavigate()

  // ✅ Correct pipeline
  const context = getContext()
  const scored = scoreItems(items, flags, context)
  const nudges = selectNudges(scored)

  const handleClick = (id) => {
    setSelectedItemId(id)
    navigate('/item')
  }

  return (
    <div className="pt-8 pb-24 px-6 lg:px-12 min-h-screen relative w-full">
      <header className="mb-10 border-b border-white/5 pb-6">
        <h2 className="font-display-xl text-display-xl text-on-surface mb-2">
          Nudge Center
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Personalized items for you, curated by relevance.
        </p>
      </header>

      {nudges.length === 0 ? (
        <p className="text-on-surface-variant font-body-md text-body-md mt-8">
          No items to nudge right now. Create or save some items to get started.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {nudges.map(({ item, reasons }) => (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className="w-full text-left bg-surface-container rounded-xl px-5 py-4 hover:bg-surface-container-high transition-colors"
            >
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
                {item.source || 'web'}
              </span>

              <p className="font-body-lg text-body-lg text-on-surface mt-1">
                {item.title || 'Saved Link'}
              </p>

              {reasons?.[0] && (
                <p className="font-body-sm text-body-sm text-primary mt-1">
                  {reasons[0]}
                </p>
              )}

              {reasons?.[1] && (
                <p className="font-label-sm text-label-sm text-on-surface-variant opacity-60 mt-0.5">
                  {reasons[1]}
                </p>
              )}

              {item.body && (
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  {item.body}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}