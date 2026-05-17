import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { OnboardingHint } from '../components/OnboardingHint'
import { buildArchiveEvolution } from '../utils/buildArchiveEvolution'

function sparklineSentence(weeklyGrowth) {
  if (weeklyGrowth.length < 8) return null
  const first4 = weeklyGrowth.slice(0, 4).reduce((s, w) => s + w.count, 0)
  const last4 = weeklyGrowth.slice(-4).reduce((s, w) => s + w.count, 0)
  if (last4 > first4) return 'Saving most in the last four weeks.'
  if (first4 > last4) return 'Activity was highest earlier in the period.'
  return 'Your saving rhythm has been steady.'
}

export default function Archive() {
  const { items, memoryStats, memoryInsights } = useApp()
  const { total, journals, collections, topSource, topTag, weeklyGrowth } = memoryStats
  const archiveEvolution = useMemo(() => buildArchiveEvolution(items), [items])

  const counts = weeklyGrowth.map(w => w.count)
  const maxCount = Math.max(...counts, 1)
  const allZero = counts.every(c => c === 0)
  const points = counts.map((c, i) => {
    const x = counts.length > 1 ? (i / (counts.length - 1)) * 280 : 140
    const y = 24 - (c / maxCount) * 24
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  const sentence = sparklineSentence(weeklyGrowth)

  if (total === 0) {
    return (
      <div className="m-archive">
        <span className="m-eyebrow" style={{ color: 'var(--mora-ochre)', marginBottom: 16 }}>Your Memory</span>
        <p className="m-archive-stat" style={{ fontStyle: 'italic', color: 'var(--mora-ink-3)' }}>
          Nothing to reflect on yet. Save things that interest you, and Mora will begin to see patterns.
        </p>
      </div>
    )
  }

  return (
    <div className="m-archive">
      <OnboardingHint hintKey="archive">
        Your archive grows richer over time. The patterns Mora notices here are personal to you.
      </OnboardingHint>

      <span className="m-eyebrow" style={{ color: 'var(--mora-ochre)', marginBottom: 16 }}>Your Memory</span>

      <p className="m-archive-stat">
        {total} memories
        {' · '}{journals} journals
        {' · '}{collections} collections
        {topSource ? ` · Top source: ${topSource.source}` : null}
        {topTag ? ` · Top theme: ${topTag.tag}` : null}
      </p>

      <div className="m-rule">
        <span className="m-rule-line" />
        <span className="m-rule-orn">✦</span>
        <span className="m-rule-line" />
      </div>

      <div className="m-archive-activity">
        <span className="m-eyebrow" style={{ color: 'var(--mora-ochre)', marginBottom: 4 }}>Activity</span>
        {!allZero && (
          <svg className="m-archive-sparkline" viewBox="0 0 280 28" preserveAspectRatio="none">
            <polyline points={points} stroke="var(--mora-ochre)" strokeWidth="1.5" fill="none" />
          </svg>
        )}
        {sentence && <p className="m-archive-stat" style={{ marginTop: 8 }}>{sentence}</p>}
      </div>

      <div className="m-rule">
        <span className="m-rule-line" />
        <span className="m-rule-orn">✦</span>
        <span className="m-rule-line" />
      </div>

      <div className="m-archive-insights">
        <span className="m-eyebrow" style={{ color: 'var(--mora-ochre)', marginBottom: 20 }}>What Your Archive Says</span>
        {memoryInsights.map((insight, i) => (
          <p key={i} className="m-archive-insight">{insight}</p>
        ))}
      </div>

      {archiveEvolution.shifts.length > 0 && (
        <>
          <div className="m-rule">
            <span className="m-rule-line" />
            <span className="m-rule-orn">✦</span>
            <span className="m-rule-line" />
          </div>
          <div className="m-archive-insights">
            <span className="m-eyebrow" style={{ color: 'var(--mora-ochre)', marginBottom: 20 }}>Archive Evolution</span>
            {archiveEvolution.shifts.map((shift, i) => (
              <p key={i} className="m-archive-insight">{shift}</p>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
