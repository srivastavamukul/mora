import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const routeMeta = {
  '/moodboard': { eyebrow: 'YOUR LIBRARY', title: "Things you've kept" },
  '/constellations': { eyebrow: "THREADS YOU'VE KEPT", title: 'Constellations' },
  '/nudge': { eyebrow: "TODAY'S WALL", title: 'A little from before' },
  '/sources': { eyebrow: 'WHERE YOUR MEMORIES COME FROM', title: 'Sources' },
  '/settings': { eyebrow: 'A QUIET PLACE', title: 'Settings' },
  '/item': { eyebrow: null, title: 'Reading' },
  '/add': { eyebrow: 'A THOUGHT', title: 'Capture a thought' },
}

export default function TopBar({ query, onQueryChange }) {
  const location = useLocation()
  const { items } = useApp()

  const meta = routeMeta[location.pathname] || { eyebrow: null, title: 'Mora' }
  const count = location.pathname === '/moodboard' ? items.length : null

  return (
    <header className="m-topbar">
      <div className="m-topbar-left">
        {meta.eyebrow && (
          <span className="m-eyebrow">
            <span className="m-eyebrow-dot" style={{ background: 'var(--mora-ember)' }} />
            {meta.eyebrow}
          </span>
        )}
        <h1 className="m-page-title">{meta.title}</h1>
        {typeof count === 'number' ? <span className="m-count">{count} kept</span> : null}
      </div>
      <div className="m-topbar-right">
        <div className="m-search" role="search">
          <i className="ph ph-magnifying-glass" />
          <input
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            placeholder="Find a memory…"
            aria-label="Search memories"
          />
        </div>
        <Link to="/settings" className="m-avatar" title="Settings" aria-label="Open settings" />
      </div>
    </header>
  )
}
