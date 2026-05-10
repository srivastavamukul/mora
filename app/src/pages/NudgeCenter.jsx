import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

import { getContext } from '../utils/getContext'
import { scoreItems } from '../utils/scoreItems'
import { selectNudges } from '../utils/selectNudges'

/* ─── Source chip ─── */

const SOURCE_COLOR = {
  spotify: 'moss', pinterest: 'ember', youtube: 'ochre',
  'mora · journal': 'indigo', manual: 'ink', web: 'ink',
  mora: 'indigo', google: 'ink',
}

function SourceChip({ source }) {
  const c = SOURCE_COLOR[(source || '').toLowerCase()] || 'ink'
  return (
    <span className={'m-source m-source-' + c}>
      <span className="m-source-dot" />
      {source}
    </span>
  )
}

/* ─── Helpers ─── */

function relativeTime(ts) {
  if (!ts) return ''
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(diff / 86400000)
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

function todayParts() {
  const d = new Date()
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  return {
    day: days[d.getDay()],
    num: d.getDate(),
    month: months[d.getMonth()] + ' ' + d.getFullYear(),
  }
}

function greetingLine(count) {
  const h = new Date().getHours()
  const time = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
  if (count === 0) return `Good ${time}. Nothing to revisit right now — that's okay.`
  if (count === 1) return `Good ${time}. One thing you might be ready to revisit.`
  return `Good ${time}. ${count} things you might be ready to revisit.`
}

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

  const { day, num, month } = todayParts()
  const featured = nudges[0] || null
  const secondaries = nudges.slice(1, 4)
  const remaining = nudges.slice(4)

  return (
    <div className="m-wall">

      {/* ── Date ── */}
      <div className="m-wall-date">
        <span className="m-wall-day">{day}</span>
        <span className="m-wall-date-num">{num}</span>
        <span className="m-wall-month">{month}</span>
      </div>

      {/* ── Greeting ── */}
      <h1 className="m-wall-greeting">
        {greetingLine(nudges.length)}
      </h1>

      {nudges.length === 0 ? (
        <div className="m-empty">
          <i className="ph ph-wind" />
          <p>It's quiet here. Save some memories, and they will surface when the time feels right.</p>
        </div>
      ) : (
        <>
          {/* ── Featured card ── */}
          {featured && (
            <article 
              className="m-wall-feature" 
              onClick={() => handleClick(featured.item.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), handleClick(featured.item.id))}
            >
              <span className="m-eyebrow">
                <span className="m-eyebrow-dot" style={{ background: 'var(--mora-ochre)' }} />
                {featured.reasons?.[0]?.toUpperCase() || 'FROM YOUR ARCHIVE'}
              </span>
              <blockquote>"{featured.item.title || 'Saved Link'}"</blockquote>
              {featured.item.body && <p>{featured.item.body}</p>}
              {featured.item.description && !featured.item.body && (
                <p>{featured.item.description}</p>
              )}
              <div className="m-wall-feature-foot">
                <SourceChip source={featured.item.source || 'web'} />
                <span className="m-wall-when">{relativeTime(featured.item.createdAt)}</span>
              </div>
            </article>
          )}

          {/* ── Rule ── */}
          {secondaries.length > 0 && (
            <div className="m-rule" style={{ margin: '24px 0' }}>
              <span className="m-rule-line" />
              <span className="m-rule-orn">˖</span>
              <span className="m-rule-line" />
            </div>
          )}

          {/* ── Secondaries ── */}
          {secondaries.length > 0 && (
            <div className="m-wall-secondaries">
              {secondaries.map(({ item, reasons }) => (
                <article 
                  key={item.id} 
                  className="m-wall-second" 
                  onClick={() => handleClick(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), handleClick(item.id))}
                >
                  <span className="m-eyebrow">{(item.source || 'web').toUpperCase()}</span>
                  <h3>{item.title || 'Saved Link'}</h3>
                  {(item.body || item.description) && (
                    <p>{item.body || item.description}</p>
                  )}
                  <span className="m-wall-when">{relativeTime(item.createdAt)}</span>
                  {reasons?.[0] && (
                    <span className="m-nudge-reason">{reasons[0]}</span>
                  )}
                </article>
              ))}
            </div>
          )}

          {/* ── Remaining nudges ── */}
          {remaining.length > 0 && (
            <section style={{ marginTop: 32 }}>
              <span className="m-eyebrow" style={{ marginBottom: 12, display: 'block' }}>
                <span className="m-eyebrow-dot" style={{ background: 'var(--mora-moss)' }} />
                MORE TO REVISIT
              </span>
              <div className="m-nudge-list">
                {remaining.map(({ item, reasons }) => (
                  <button
                    key={item.id}
                    onClick={() => handleClick(item.id)}
                    className="m-nudge-card"
                  >
                    <span className="m-nudge-source">{item.source || 'web'}</span>
                    <span className="m-nudge-title">{item.title || 'Saved Link'}</span>
                    {reasons?.[0] && (
                      <span className="m-nudge-reason">{reasons[0]}</span>
                    )}
                    {reasons?.[1] && (
                      <span className="m-nudge-sub">{reasons[1]}</span>
                    )}
                    {item.body && (
                      <span className="m-nudge-body">{item.body}</span>
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}