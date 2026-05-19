import { useMemo, useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { OnboardingHint } from '../components/OnboardingHint'
import { MemoryCard, mapItemToMemory } from '../components/MoraUI'
import { buildArchiveEvolution } from '../utils/buildArchiveEvolution'
import { buildMemoryEvolution } from '../utils/buildMemoryEvolution'
import { buildMemoryReview } from '../utils/buildMemoryReview'
import { buildMonthlyMemoryReview } from '../utils/buildMonthlyMemoryReview'
import { buildMemoryContext } from '../utils/buildMemoryContext'
import { buildCompanionIntelligence } from '../utils/buildCompanionIntelligence'
import { buildResurfacingSignals } from '../utils/buildResurfacingSignals'
import { useCompanionSession } from '../hooks/useCompanionSession'

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
  const navigate = useNavigate()
  const [queryInput, setQueryInput] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const debounceTimer = useRef(null)
  const { resolveQuery, commitQuery, isReference } = useCompanionSession()

  function handleQueryChange(e) {
    const val = e.target.value
    setQueryInput(val)
    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => setDebouncedQuery(val.trim()), 250)
  }

  function openItem(id) { navigate(`/item/${id}`) }

  const archiveEvolution = useMemo(() => buildArchiveEvolution(items), [items])
  const memoryEvolution = useMemo(() => buildMemoryEvolution(items), [items])
  const resurfacingSignals = useMemo(() => buildResurfacingSignals(items), [items])
  const memoryReview = useMemo(() => buildMemoryReview(items), [items])
  const monthlyReview = useMemo(() => buildMonthlyMemoryReview(items), [items])
  const resolvedQuery = useMemo(() => resolveQuery(debouncedQuery), [debouncedQuery, resolveQuery])
  const queryContext = useMemo(
    () => resolvedQuery ? buildMemoryContext(resolvedQuery, items) : null,
    [resolvedQuery, items]
  )
  const companionInsight = useMemo(
    () => resolvedQuery && queryContext
      ? buildCompanionIntelligence(resolvedQuery, queryContext, memoryReview, monthlyReview, memoryEvolution, resurfacingSignals)
      : null,
    [resolvedQuery, queryContext, memoryReview, monthlyReview, memoryEvolution, resurfacingSignals]
  )
  const queryMemories = useMemo(
    () => queryContext ? queryContext.relevantMemories.slice(0, 5).map(item => mapItemToMemory(item)) : [],
    [queryContext]
  )

  useEffect(() => {
    if (debouncedQuery && queryContext && !isReference(debouncedQuery)) {
      commitQuery(debouncedQuery, queryContext)
    }
  }, [debouncedQuery, queryContext, isReference, commitQuery])

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

  const rule = (
    <div className="m-rule">
      <span className="m-rule-line" />
      <span className="m-rule-orn">✦</span>
      <span className="m-rule-line" />
    </div>
  )

  return (
    <div className="m-archive">
      <OnboardingHint hintKey="archive">
        Your reflections grow richer over time. The patterns Mora notices here are personal to you.
      </OnboardingHint>

      <span className="m-eyebrow" style={{ color: 'var(--mora-ochre)', marginBottom: 16 }}>Your Memory</span>

      <p className="m-archive-stat">
        {total} memories
        {' · '}{journals} journals
        {' · '}{collections} collections
        {topSource ? ` · Top source: ${topSource.source}` : null}
        {topTag ? ` · Top theme: ${topTag.tag}` : null}
      </p>

      {rule}

      <div className="m-archive-activity">
        <span className="m-eyebrow" style={{ color: 'var(--mora-ochre)', marginBottom: 4 }}>Activity</span>
        {!allZero && (
          <svg className="m-archive-sparkline" viewBox="0 0 280 28" preserveAspectRatio="none">
            <polyline points={points} stroke="var(--mora-ochre)" strokeWidth="1.5" fill="none" />
          </svg>
        )}
        {sentence && <p className="m-archive-stat" style={{ marginTop: 8 }}>{sentence}</p>}
      </div>

      {rule}

      <div className="m-archive-insights">
        <span className="m-eyebrow" style={{ color: 'var(--mora-ochre)', marginBottom: 20 }}>Mora Companion</span>
        {!debouncedQuery && (
          <div style={{ marginBottom: 16 }}>
            <p className="m-archive-insight" style={{ fontStyle: 'italic', color: 'var(--mora-ink-3)', marginBottom: 4 }}>What have I been thinking about lately?</p>
            <p className="m-archive-insight" style={{ fontStyle: 'italic', color: 'var(--mora-ink-3)', marginBottom: 4 }}>Show startup memories</p>
            <p className="m-archive-insight" style={{ fontStyle: 'italic', color: 'var(--mora-ink-3)' }}>What else related to that?</p>
          </div>
        )}
        <div className="m-search" style={{ width: '100%', maxWidth: 400, boxSizing: 'border-box' }}>
          <i className="ph ph-magnifying-glass" />
          <input
            type="text"
            value={queryInput}
            onChange={handleQueryChange}
            placeholder="Ask your reflections..."
          />
        </div>
        {debouncedQuery && companionInsight && (
          <div style={{ marginTop: 24 }}>
            <span className="m-eyebrow" style={{ color: 'var(--mora-ochre)', marginBottom: 12, display: 'block' }}>Mora Noticed</span>
            {companionInsight.response && (
              <p className="m-archive-insight">{companionInsight.response}</p>
            )}
            {queryMemories.length > 0 && (
              <>
                <span className="m-eyebrow" style={{ color: 'var(--mora-ochre)', marginTop: 20, marginBottom: 16, display: 'block' }}>Related Memories</span>
                <div className="m-grid">
                  {queryMemories.map(memory => (
                    <MemoryCard key={memory.id} memory={memory} onOpen={openItem} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {memoryReview.observations.length > 0 && (
        <>
          {rule}
          <div className="m-archive-insights">
            <span className="m-eyebrow" style={{ color: 'var(--mora-ochre)', marginBottom: 20 }}>This Week in Your Mind</span>
            {memoryReview.observations.map((obs, i) => (
              <p key={i} className="m-archive-insight">{obs}</p>
            ))}
          </div>
        </>
      )}

      {monthlyReview.observations.length > 0 && (
        <>
          {rule}
          <div className="m-archive-insights">
            <span className="m-eyebrow" style={{ color: 'var(--mora-ochre)', marginBottom: 8 }}>This Month in Your Mind</span>
            {monthlyReview.month && (
              <p className="m-archive-stat" style={{ fontStyle: 'italic', color: 'var(--mora-ink-3)', marginBottom: 16 }}>{monthlyReview.month}</p>
            )}
            {monthlyReview.observations.map((obs, i) => (
              <p key={i} className="m-archive-insight">{obs}</p>
            ))}
          </div>
        </>
      )}

      {memoryEvolution.periods.length > 0 && (
        <>
          {rule}
          <div className="m-archive-insights">
            <span className="m-eyebrow" style={{ color: 'var(--mora-ochre)', marginBottom: 20 }}>Evolution of your mind</span>
            {memoryEvolution.periods.map((p, i) => (
              <div key={i} style={{ marginBottom: 20 }}>
                <p className="m-archive-stat" style={{ fontStyle: 'italic', color: 'var(--mora-ink-3)', marginBottom: 6 }}>{p.period}</p>
                {p.changeSignals.map((sig, j) => (
                  <p key={j} className="m-archive-insight">{sig}</p>
                ))}
                {p.changeSignals.length === 0 && p.dominantThemes.length > 0 && (
                  <p className="m-archive-insight">{p.dominantThemes.slice(0, 2).join(' and ')} were on your mind.</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {rule}

      <div className="m-archive-insights">
        <span className="m-eyebrow" style={{ color: 'var(--mora-ochre)', marginBottom: 20 }}>What Your Reflections Say</span>
        {memoryInsights.map((insight, i) => (
          <p key={i} className="m-archive-insight">{insight}</p>
        ))}
      </div>

      {archiveEvolution.shifts.length > 0 && (
        <>
          {rule}
          <div className="m-archive-insights">
            <span className="m-eyebrow" style={{ color: 'var(--mora-ochre)', marginBottom: 20 }}>Reflections Evolution</span>
            {archiveEvolution.shifts.map((shift, i) => (
              <p key={i} className="m-archive-insight">{shift}</p>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
