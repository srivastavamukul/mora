import { Link, useLocation } from 'react-router-dom'

export default function TopBar() {
  const location = useLocation()

  const navLink = (to, label) => {
    const active = location.pathname === to
    return (
      <Link
        to={to}
        className={`font-label-sm text-label-sm font-medium tracking-widest hover:bg-white/5 transition-all duration-300 px-3 py-2 rounded ${
          active ? 'text-[#FF2E97] font-bold border-b-2 border-[#FF2E97] pb-1' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile top bar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.4)] md:hidden">
        <div className="text-2xl font-black tracking-tighter text-[#FF2E97] drop-shadow-[0_0_8px_rgba(255,46,151,0.5)] font-['Space_Grotesk']">MORA</div>
        <div className="flex items-center gap-4">
          <button className="hover:bg-white/5 transition-all duration-300 p-2 rounded-full group">
            <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-200">notifications</span>
          </button>
          <button className="hover:bg-white/5 transition-all duration-300 p-2 rounded-full group">
            <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-200">auto_awesome</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden border border-white/10 ml-2">
            <div className="w-full h-full bg-gradient-to-br from-primary/40 to-tertiary/40" />
          </div>
        </div>
      </header>

      {/* Desktop top bar */}
      <header className="hidden md:flex fixed top-0 w-full z-50 justify-between items-center px-6 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        <Link to="/" className="text-2xl font-black tracking-tighter text-[#FF2E97] drop-shadow-[0_0_8px_rgba(255,46,151,0.5)] font-['Space_Grotesk']">
          MORA
        </Link>
        <nav className="flex items-center gap-6">
          {navLink('/moodboard', 'Home')}
          {navLink('/constellations', 'Constellations')}
          {navLink('/nudge', 'Memory Wall')}
          {navLink('/sources', 'Sources')}
        </nav>
        <div className="flex items-center gap-4">
          <button className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">auto_awesome</span>
          </button>
          <Link to="/settings" className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant overflow-hidden block">
            <div className="w-full h-full bg-gradient-to-br from-primary/40 to-tertiary/40" />
          </Link>
        </div>
      </header>
    </>
  )
}
