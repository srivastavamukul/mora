import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { groupItemsByTags } from '../utils/groupItems'

function relativeTimeShort(ts) {
  if (!ts) return ''
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(diff / 86400000)
  return `${days}d`
}

export default function Constellations() {
  const { items, flags, setSelectedItemId } = useApp()
  const navigate = useNavigate()

  const groups = groupItemsByTags(items, flags)
  const groupEntries = Object.entries(groups).sort((a, b) => b[1].length - a[1].length)

  const handleItemClick = (id) => {
    setSelectedItemId(id)
    navigate('/item')
  }

  return (
    <div className="m-constellations">
      <p className="m-constellations-intro">
        Threads that have run through your saving — tags that show up enough to feel like a chapter.
        Quiet collections, not algorithms.
      </p>

      <div className="m-rule" style={{ marginBottom: 40 }}>
        <span className="m-rule-line" />
        <span className="m-rule-orn">˖</span>
        <span className="m-rule-line" />
      </div>

      {groupEntries.length === 0 ? (
        <div className="m-empty">
          <p>No clusters yet. Add items with tags to build constellations.</p>
        </div>
      ) : (
        groupEntries.map(([tag, groupItems]) => (
          <section key={tag} className="m-constellation">
            <header className="m-constellation-head">
              <h2 className="m-constellation-name">#{tag}</h2>
              <span className="m-constellation-count">{groupItems.length} memories</span>
            </header>
            
            <ul className="m-constellation-list">
              {groupItems.map(item => (
                <li key={item.id} onClick={() => handleItemClick(item.id)}>
                  <span className="m-cl-time">{relativeTimeShort(item.createdAt)}</span>
                  <span className="m-cl-title">{item.title || 'Saved Link'}</span>
                  <span className="m-cl-source">{item.source || 'web'}</span>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
