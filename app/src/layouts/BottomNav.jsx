import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/moodboard',      icon: 'stack',           label: 'Library'     },
  { to: '/archive',        icon: 'archive',          label: 'Reflections' },
  { to: '/constellations', icon: 'graph',            label: 'Patterns'    },
  { to: '/timeline',       icon: 'calendar-blank',   label: 'Timeline'    },
  { to: '/settings',       icon: 'gear-six',         label: 'Settings'    },
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
