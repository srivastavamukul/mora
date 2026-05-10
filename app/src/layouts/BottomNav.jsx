import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/moodboard', icon: 'stack', label: 'Library' },
  { to: '/nudge', icon: 'hourglass-medium', label: 'Wall' },
  { to: '/constellations', icon: 'graph', label: 'Constellations' },
  { to: '/sources', icon: 'link-simple', label: 'Sources' },
  { to: '/settings', icon: 'gear-six', label: 'Settings' },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="m-bottomnav" aria-label="Bottom navigation">
      {navItems.map(({ to, icon, label }) => {
        const active = location.pathname === to
        return (
          <Link
            key={to}
            to={to}
            className={'m-bottomnav-item ' + (active ? 'is-active' : '')}
            aria-current={active ? 'page' : undefined}
          >
            <i className={'ph ph-' + icon} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
