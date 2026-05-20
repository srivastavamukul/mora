import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/moodboard',      icon: 'stack',           label: 'Library'       },
  { to: '/nudge',          icon: 'hourglass-medium', label: 'Memory Wall'   },
  { to: '/constellations', icon: 'graph',            label: 'Constellations' },
  { to: '/archive',        icon: 'archive',          label: 'Reflections'   },
  { to: '/timeline',       icon: 'calendar-blank',   label: 'Timeline'      },
  { to: '/sources',        icon: 'link-simple',      label: 'Sources'       },
  { to: '/settings',       icon: 'gear-six',         label: 'Settings'      },
]

export default function SideNav({ onCapture, captureAck = false }) {
  const location = useLocation()

  return (
    <aside className="m-sidebar" aria-label="Primary navigation">
      <Link to="/moodboard" className="m-brand" title="Mora home">
        <span className="m-brand-word">Mora</span>
        <span className="m-brand-dot" />
      </Link>

      <button
        type="button"
        className="m-capture-cta"
        aria-label="Capture a thought"
        title="Capture a thought"
        onClick={onCapture}
      >
        <i className="ph ph-feather" />
        <span className="m-capture-cta-label">Capture a thought</span>
      </button>
      {captureAck ? <span className="m-capture-ack">Kept.</span> : null}

      <nav className="m-nav" aria-label="Sections">
        {navItems.map(({ to, icon, label }) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              title={label}
              className={'m-nav-item ' + (active ? 'is-active' : '')}
              aria-current={active ? 'page' : undefined}
            >
              <i className={'ph ph-' + icon} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="m-sidebar-foot">
        <div className="m-sidebar-quote">
          "A memory is a place you visit with footnotes."
        </div>
        <div className="m-sidebar-meta">from your archive, page 17</div>
      </div>
    </aside>
  )
}
