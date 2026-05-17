import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { MemoryCard, mapItemToMemory } from '../components/MoraUI'
import { buildMemoryTimeline } from '../utils/buildMemoryTimeline'

export default function Timeline() {
  const navigate = useNavigate()
  const { items, flags, setSelectedItemId } = useApp()

  const timeline = useMemo(() => buildMemoryTimeline(items), [items])

  const openItem = (id) => {
    setSelectedItemId(id)
    navigate('/item')
  }

  if (items.length === 0) {
    return (
      <div className="m-timeline">
        <span className="m-eyebrow" style={{ color: 'var(--mora-ochre)', marginBottom: 16 }}>Timeline</span>
        <p className="m-timeline-empty">
          Nothing here yet. Save a few things and your timeline will begin to take shape.
        </p>
      </div>
    )
  }

  return (
    <div className="m-timeline">
      <span className="m-eyebrow" style={{ color: 'var(--mora-ochre)', marginBottom: 8 }}>Timeline</span>
      <p className="m-timeline-sub">What you've collected, month by month.</p>

      {timeline.map(period => {
        const memories = period.items.map(item => mapItemToMemory(item, flags))
        const metaParts = [`${period.count} ${period.count === 1 ? 'memory' : 'memories'}`]
        if (period.dominantTag) metaParts.push(`mostly ${period.dominantTag}`)
        else if (period.dominantSource) metaParts.push(`mostly ${period.dominantSource}`)

        return (
          <section key={period.periodLabel} className="m-timeline-period">
            <div className="m-timeline-header">
              <h2 className="m-timeline-month">{period.periodLabel}</h2>
              <p className="m-timeline-meta">{metaParts.join(' · ')}</p>
              {period.insight && (
                <p className="m-timeline-insight">{period.insight}</p>
              )}
            </div>
            <div className="m-rule" role="separator">
              <span className="m-rule-line" />
              <span className="m-rule-orn">˖</span>
              <span className="m-rule-line" />
            </div>
            <div className="m-grid">
              {memories.slice(0, 6).map(memory => (
                <MemoryCard key={memory.id} memory={memory} onOpen={openItem} />
              ))}
            </div>
            {period.count > 6 && (
              <p className="m-timeline-more">+{period.count - 6} more from this month</p>
            )}
          </section>
        )
      })}
    </div>
  )
}
