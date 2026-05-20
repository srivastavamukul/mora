import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useApp } from '../context/AppContext'

const routeMeta = {
  '/moodboard':      { eyebrow: 'YOUR LIBRARY',                   title: "Things you've kept"   },
  '/constellations': { eyebrow: "THREADS YOU'VE KEPT",            title: 'Constellations'       },
  '/nudge':          { eyebrow: "TODAY'S WALL",                   title: 'A little from before' },
  '/archive':        { eyebrow: 'REFLECTIONS',                    title: 'A look back'          },
  '/timeline':       { eyebrow: 'YOUR TIMELINE',                  title: 'Month by month'       },
  '/sources':        { eyebrow: 'WHERE YOUR MEMORIES COME FROM',  title: 'Sources'              },
  '/settings':       { eyebrow: 'A QUIET PLACE',                  title: 'Settings'             },
  '/item':           { eyebrow: null,                             title: 'Reading'              },
  '/add':            { eyebrow: 'A THOUGHT',                      title: 'Capture a thought'    },
}

const overflowItems = [
  { to: '/sources',  icon: 'link-simple', label: 'Sources'  },
  { to: '/settings', icon: 'gear-six',    label: 'Settings' },
]

export default function TopBar({ query, onQueryChange }) {
  const location = useLocation()
  const { items } = useApp()
  const [overflowOpen, setOverflowOpen] = useState(false)

  const meta = routeMeta[location.pathname] || { eyebrow: null, title: 'Mora' }
  const count = location.pathname === '/moodboard' ? items.length : null

  function closeOverflow() { setOverflowOpen(false) }

  return (
    <header className="m-topbar">
      {/* title-row: display:contents on desktop, flex row on mobile */}
      <div className="m-topbar-title-row">
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

        {/* overflow menu — hidden on desktop, visible on mobile */}
        <div className="m-topbar-overflow">
          <button
            type="button"
            className={'m-topbar-overflow-btn' + (overflowOpen ? ' is-active' : '')}
            onClick={() => setOverflowOpen(v => !v)}
            aria-label="More options"
            aria-expanded={overflowOpen}
            aria-haspopup="menu"
          >
            <i className="ph ph-dots-three" />
          </button>
          {overflowOpen && (
            <>
              <div
                className="m-topbar-overflow-scrim"
                onClick={closeOverflow}
                aria-hidden="true"
              />
              <div className="m-topbar-overflow-menu" role="menu">
                {overflowItems.map(({ to, icon, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className="m-topbar-overflow-item"
                    role="menuitem"
                    onClick={closeOverflow}
                  >
                    <i className={'ph ph-' + icon} />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
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
