import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="bg-background text-on-surface min-h-screen relative overflow-x-hidden antialiased">
      <div className="noise-overlay" />

      {/* Ambient glows */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary-container/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-secondary-container/10 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center px-lg py-md w-full">
        <span className="font-display-xl text-headline-md text-primary tracking-tighter drop-shadow-[0_0_8px_rgba(255,46,151,0.5)]">MORA</span>
        <Link to="/empty" className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300">
          LOG IN
        </Link>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center px-lg lg:px-xl gap-xl max-w-7xl mx-auto w-full py-xl">
        <div className="flex-1 flex flex-col items-start max-w-xl z-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high border border-white/10 mb-8 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-secondary-fixed shadow-[0_0_8px_rgba(125,244,255,0.8)]" />
            <span className="font-label-sm text-label-sm text-on-surface tracking-widest uppercase">System Initialization</span>
          </div>
          <h1 className="font-display-xl text-display-xl text-on-surface mb-6 glow-text">
            Your saved world,<br />alive again.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-lg leading-relaxed">
            Turning digital fragments into a living memory system. Stop hoarding links and start building your personal intelligence constellation.
          </p>
          <div className="flex flex-col sm:flex-row gap-md w-full sm:w-auto">
            <Link
              to="/sources"
              className="group relative px-8 py-4 bg-primary text-on-primary-fixed font-label-sm text-label-sm font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-3 hover:bg-primary-fixed transition-all duration-300 shadow-[0_0_20px_rgba(255,176,203,0.3)] hover:shadow-[0_0_30px_rgba(255,176,203,0.5)]"
            >
              Connect your sources
              <span className="material-symbols-outlined text-xl transition-transform group-hover:translate-x-1">cable</span>
            </Link>
            <Link
              to="/moodboard"
              className="group px-8 py-4 bg-surface-container border border-white/10 text-on-surface font-label-sm text-label-sm font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-3 hover:bg-surface-container-high transition-all duration-300 backdrop-blur-md"
            >
              Try manual capture
              <span className="material-symbols-outlined text-xl text-on-surface-variant group-hover:text-primary transition-colors">edit_note</span>
            </Link>
          </div>
        </div>

        {/* Decorative card stack */}
        <div className="flex-1 w-full h-[400px] relative z-10 lg:pl-12 hidden md:block">
          <div className="absolute top-[10%] right-[10%] w-64 h-72 bg-surface-container/60 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden z-10 transform rotate-6 p-4 flex flex-col justify-end">
            <div className="w-full h-40 bg-gradient-to-br from-primary/20 to-tertiary/20 absolute top-0 left-0" />
            <h3 className="font-headline-md text-body-lg text-on-surface mb-1 relative z-10">Neon Typography Study</h3>
            <p className="font-label-sm text-label-sm text-on-surface-variant relative z-10">Pinterest · 3d ago</p>
          </div>
          <div className="absolute bottom-[15%] left-[5%] w-56 h-44 bg-surface-container/60 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg z-20 transform -rotate-3 p-5 flex flex-col justify-between">
            <span className="material-symbols-outlined text-secondary text-2xl">music_note</span>
            <div>
              <p className="font-body-md text-sm text-on-surface mb-1">Midnight City Synthesis</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Spotify · High resonance</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
