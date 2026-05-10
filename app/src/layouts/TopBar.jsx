import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

const routeMeta = {
  '/moodboard':      { eyebrow: 'YOUR LIBRARY',                title: 'Things you\'ve kept' },
  '/constellations':  { eyebrow: 'THREADS YOU\'VE KEPT',        title: 'Constellations' },
  '/nudge':           { eyebrow: 'TODAY\'S WALL',               title: 'A little from before' },
  '/sources':         { eyebrow: 'WHERE YOUR MEMORIES COME FROM', title: 'Sources' },
  '/settings':        { eyebrow: 'A QUIET PLACE',               title: 'Settings' },
  '/item':            { eyebrow: null,                           title: 'Reading' },
  '/add':             { eyebrow: null,                           title: 'Capture' },
}

export default function TopBar() {
  const location = useLocation()
  const [query, setQuery] = useState('')

  const meta = routeMeta[location.pathname] || { eyebrow: null, title: 'Mora' }

  return (
    <>
      {/* Mobile top bar */}
      <header className="m-topbar" style={{ display: 'none' }}>
        {/* shown via CSS @media */}
      </header>

      {/* Desktop + tablet topbar */}
      <header className="m-topbar">
        <div className="m-topbar-left">
          {meta.eyebrow && (
            <span className="m-eyebrow">
              <span className="m-eyebrow-dot" style={{ background: 'var(--mora-ember)' }} />
              {meta.eyebrow}
            </span>
          )}
          <h1 className="m-page-title">{meta.title}</h1>
        </div>
        <div className="m-topbar-right">
          <div className="m-search">
            <i className="ph ph-magnifying-glass" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Find a memory…"
            />
          </div>
          <Link to="/settings" className="m-avatar" title="You" />
        </div>
      </header>
    </>
  )
}
