import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/moodboard', icon: 'grid_view', label: 'Home' },
  { to: '/constellations', icon: 'grain', label: 'Constellations' },
  { to: '/nudge', icon: 'auto_stories', label: 'Memory Wall' },
  { to: '/sources', icon: 'hub', label: 'Sources' },
  { to: '/settings', icon: 'settings', label: 'Settings' },
]

export default function SideNav() {
  const location = useLocation()

  return (
    <nav className="hidden md:flex fixed left-0 top-0 h-full flex-col py-8 z-40 bg-slate-900/40 backdrop-blur-2xl w-64 border-r border-white/10 shadow-[10px_0_30px_rgba(255,46,151,0.05)] pt-24">
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-surface-container-high border border-outline overflow-hidden flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-lg">memory</span>
        </div>
        <div>
          <h2 className="text-pink-500 font-bold text-lg font-['Space_Grotesk']">Mora AI</h2>
          <p className="text-on-surface-variant text-xs uppercase tracking-widest font-['Space_Grotesk']">Vibe: Neon Retro</p>
        </div>
      </div>

      <button className="mx-4 mb-8 bg-primary text-on-primary-fixed py-3 px-4 rounded-lg font-bold hover:bg-primary-container hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(255,46,151,0.3)] transition-all relative group text-xs uppercase tracking-widest font-['Space_Grotesk']">
        <div className="absolute inset-0 border-2 border-primary rounded-lg translate-x-1 translate-y-1 opacity-0 group-hover:opacity-50 transition-opacity -z-10" />
        <span className="flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-sm">sync</span>
          Sync New Items
        </span>
      </button>

      <div className="flex-1 flex flex-col gap-1 px-2">
        {navItems.map(({ to, icon, label }) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-3 m-2 rounded-lg hover:bg-white/5 hover:translate-x-1 transition-all text-sm font-medium uppercase tracking-widest font-['Space_Grotesk'] ${
                active
                  ? 'bg-[#FF2E97]/10 text-[#FF2E97] border-r-4 border-[#FF2E97] shadow-[0_0_15px_rgba(255,46,151,0.2)]'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="material-symbols-outlined">{icon}</span>
              {label}
            </Link>
          )
        })}
      </div>

      <div className="px-2 pb-4 border-t border-white/10 pt-4">
        <a
          href="#"
          className="text-slate-500 flex items-center gap-3 px-4 py-3 m-2 hover:text-slate-300 hover:bg-white/5 hover:translate-x-1 transition-all rounded-lg text-sm font-medium uppercase tracking-widest font-['Space_Grotesk']"
        >
          <span className="material-symbols-outlined">help_outline</span> Help
        </a>
        <Link
          to="/"
          className="text-slate-500 flex items-center gap-3 px-4 py-3 m-2 hover:text-slate-300 hover:bg-white/5 hover:translate-x-1 transition-all rounded-lg text-sm font-medium uppercase tracking-widest font-['Space_Grotesk']"
        >
          <span className="material-symbols-outlined">logout</span> Logout
        </Link>
      </div>
    </nav>
  )
}
