import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/moodboard',     icon: 'stack',            label: 'Library' },
  { to: '/nudge',          icon: 'hourglass-medium', label: 'Wall' },
  { to: '/constellations', icon: 'graph',            label: 'Threads' },
  { to: '/sources',        icon: 'link-simple',      label: 'Sources' },
  { to: '/settings',       icon: 'gear-six',         label: 'Settings' },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="m-bottomnav">
      {navItems.map(({ to, icon, label }) => {
        const active = location.pathname === to
        return (
          <Link
            key={to}
            to={to}
            className={'m-bottomnav-item ' + (active ? 'is-active' : '')}
          >
            <i className={'ph ph-' + icon} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
