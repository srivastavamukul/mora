import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/moodboard', icon: 'grid_view' },
  { to: '/constellations', icon: 'grain' },
  { to: '/nudge', icon: 'auto_stories' },
  { to: '/sources', icon: 'hub' },
  { to: '/settings', icon: 'settings' },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 w-full z-50 bg-slate-950/90 backdrop-blur-xl border-t border-white/10 h-16 flex justify-around items-center px-4">
      {navItems.map(({ to, icon }) => {
        const active = location.pathname === to
        return (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center justify-center w-16 ${active ? 'text-[#FF2E97]' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <span className="material-symbols-outlined">{icon}</span>
          </Link>
        )
      })}
    </nav>
  )
}
