import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/moodboard',      icon: 'stack',            label: 'Library' },
  { to: '/nudge',           icon: 'hourglass-medium', label: 'Memory Wall' },
  { to: '/constellations',  icon: 'graph',            label: 'Constellations' },
  { to: '/sources',         icon: 'link-simple',      label: 'Sources' },
  { to: '/settings',        icon: 'gear-six',         label: 'Settings' },
]

export default function SideNav() {
  const location = useLocation()

  return (
    <aside className="m-sidebar">
      <Link to="/" className="m-brand">
        <span className="m-brand-word">Mora</span>
        <span className="m-brand-dot" />
      </Link>

      <Link to="/add" className="m-capture-cta">
        <i className="ph ph-feather" />
        Capture a thought
      </Link>

      <nav className="m-nav">
        {navItems.map(({ to, icon, label }) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={'m-nav-item ' + (active ? 'is-active' : '')}
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
        <div className="m-sidebar-meta">— from your archive</div>
      </div>
    </aside>
  )
}
