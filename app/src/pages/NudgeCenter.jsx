import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { getContext } from '../utils/getContext'
import { scoreItems } from '../utils/scoreItems'
import { selectNudges } from '../utils/selectNudges'
import { Eyebrow, Rule, SourceChip, formatRelativeTime, mapItemToMemory } from '../components/MoraUI'
import { buildDisplayMemory } from '../utils/buildDisplayMemory'
import { OnboardingHint } from '../components/OnboardingHint'

function todayParts() {
  const date = new Date()
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  return {
    day: days[date.getDay()],
    num: date.getDate(),
    month: `${months[date.getMonth()]} ${date.getFullYear()}`,
  }
}

function greetingLine() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 11) return 'Good morning. One thing you might be ready to revisit.'
  if (hour >= 11 && hour < 17) return 'An afternoon thought, surfaced gently.'
  if (hour >= 17 && hour < 22) return 'Evening. Something to sit with.'
  return "Late. Here's something quiet."
}

function featuredLabel(reasons = []) {
  return (reasons[0] || 'Recently opened').toUpperCase()
}

export default function NudgeCenter() {
  const { items, flags, setSelectedItemId } = useApp()
  const navigate = useNavigate()

  const nudges = useMemo(() => {
    const scored = scoreItems(items, flags, getContext())
    return selectNudges(scored).map(({ item, reasons }) => ({
      ...mapItemToMemory(item, flags),
      reasons,
    }))
  }, [items, flags])

  const { day, num, month } = todayParts()
  const featured = nudges[0] || null
  const secondary = nudges.slice(1, 3)

  const openItem = (id) => {
    setSelectedItemId(id)
    navigate('/item')
  }

  return (
    <div className="m-wall">
      <div className="m-wall-date">
        <span className="m-wall-day">{day}</span>
        <span className="m-wall-num">{num}</span>
        <span className="m-wall-month">{month}</span>
      </div>

      {featured ? (
        <p className="m-wall-blurb">{greetingLine()}</p>
      ) : items.length === 0 ? (
        <p className="m-wall-empty">Add something to your archive and Mora will begin surfacing memories in its own time.</p>
      ) : (
        <p className="m-wall-empty">Quiet day. Nothing to bring up — yet.</p>
      )}

      {items.length > 0 && (
        <OnboardingHint hintKey="journal">
          You can write directly in Mora. Use the compose button to capture a thought before it fades.
        </OnboardingHint>
      )}

      {featured ? (
        <>
          {(() => {
            const { displayTitle: ft, displayDescription: fd } = buildDisplayMemory(featured.raw)
            return (
              <article
                className="m-wall-card"
                onClick={() => openItem(featured.id)}
                role="button"
                tabIndex={0}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    openItem(featured.id)
                  }
                }}
              >
                <Eyebrow color="var(--mora-ember)">{featuredLabel(featured.reasons)}</Eyebrow>
                <h2 className="m-wall-card-title">”{ft}”</h2>
                {fd ? <p className="m-wall-card-body">{fd}</p> : null}
                <div className="m-wall-card-foot">
                  <SourceChip source={featured.source} />
                  <span className="m-wall-when">{featured.time || formatRelativeTime(featured.raw.createdAt)}</span>
                </div>
              </article>
            )
          })()}

          {secondary.length > 0 ? <Rule ornament className="m-wall-rule" /> : null}

          {secondary.length > 0 ? (
            <div className="m-wall-followups">
              {secondary.map(memory => {
                const { displayTitle: mt, displayDescription: md } = buildDisplayMemory(memory.raw)
                return (
                  <article
                    key={memory.id}
                    className="m-wall-secondary"
                    onClick={() => openItem(memory.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        openItem(memory.id)
                      }
                    }}
                  >
                    <Eyebrow dot={false}>{featuredLabel(memory.reasons)}</Eyebrow>
                    <h3 className="m-wall-secondary-title">{mt}</h3>
                    {md ? <p className="m-wall-secondary-body">{md}</p> : null}
                    <div className="m-wall-secondary-foot">
                      <SourceChip source={memory.source} />
                      <span className="m-wall-when">{memory.time || formatRelativeTime(memory.raw.createdAt)}</span>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
