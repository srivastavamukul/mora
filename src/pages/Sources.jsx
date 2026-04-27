import { useApp } from '../context/AppContext'

function StatusBadge({ status }) {
  if (status === 'connected') return (
    <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1 rounded-full border border-primary/30">
      <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
      <span className="font-label-sm text-xs text-primary font-bold">Connected</span>
    </div>
  )
  if (status === 'error') return (
    <div className="flex items-center gap-1 bg-surface-container-lowest px-2 py-1 rounded border border-tertiary-container/30">
      <span className="material-symbols-outlined text-tertiary text-xs">warning</span>
      <span className="font-label-sm text-[10px] text-tertiary uppercase">Auth Expired</span>
    </div>
  )
  return null
}

function ActionButton({ sourceId, status, onToggle }) {
  if (status === 'connected') return (
    <button
      onClick={() => onToggle(sourceId)}
      className="w-full py-2 px-4 rounded border border-outline-variant text-on-surface-variant font-label-sm text-sm hover:bg-surface-container-high hover:text-on-surface transition-all"
    >
      Disconnect
    </button>
  )
  if (status === 'error') return (
    <button
      onClick={() => onToggle(sourceId)}
      className="w-full py-2 px-4 rounded bg-tertiary-container/10 border border-tertiary-container text-tertiary font-label-sm text-sm hover:bg-tertiary-container/20 transition-all"
    >
      Reconnect
    </button>
  )
  return (
    <button
      onClick={() => onToggle(sourceId)}
      className="w-full py-2 px-4 rounded border border-outline-variant text-on-surface font-label-sm text-sm hover:bg-surface-container-high hover:border-on-surface transition-all"
    >
      Connect Account
    </button>
  )
}

export default function Sources() {
  const { sources, toggleSource: toggle } = useApp()
  const statuses = Object.fromEntries(sources.map(s => [s.id, s.status]))

  return (
    <div className="pt-8 pb-24 px-6 md:px-xl max-w-7xl mx-auto relative w-full min-h-screen">

      {/* Header */}
      <header className="mb-12 md:mb-16 relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
        <h2 className="font-display-xl text-display-xl text-on-surface mb-4 relative z-10">Connect Sources</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl relative z-10">
          Weave your digital footprints into Mora. We only extract the vibe, never the private details.
        </p>

        {/* Filter chips — live counts */}
        <div className="mt-8 flex gap-4 overflow-x-auto pb-4">
          <div className="flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-full border border-white/5 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-secondary-fixed shadow-[0_0_8px_rgba(125,244,255,0.8)]" />
            <span className="font-label-sm text-label-sm text-on-surface">
              Active Streams
              <span className="ml-2 text-secondary-fixed font-bold">
                {Object.values(statuses).filter(s => s === 'connected').length}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-full border border-white/5 whitespace-nowrap opacity-60">
            <span className="w-2 h-2 rounded-full bg-surface-variant" />
            <span className="font-label-sm text-label-sm text-on-surface">
              Paused
              <span className="ml-2">
                {Object.values(statuses).filter(s => s !== 'connected').length}
              </span>
            </span>
          </div>
        </div>
      </header>

      <div className="pixel-divider mb-12" />

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-gutter">

        {/* Instagram */}
        <div className={`glass-card rounded-xl p-6 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 border-t border-l border-white/20 ${statuses.instagram === 'connected' ? 'hover:shadow-[0_10px_40px_rgba(255,46,151,0.1)]' : 'opacity-70 hover:opacity-100'}`}>
          <div className="absolute top-0 right-0 p-2 opacity-50 font-label-sm text-xs text-on-surface-variant tracking-widest">IMG_STREAM</div>
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
            </div>
            <StatusBadge status={statuses.instagram} />
          </div>
          <div className="relative z-10">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Instagram</h3>
            <p className="font-body-md text-body-md text-on-surface-variant text-sm mb-6">
              Importing saved posts, tagged locations, and visual aesthetics.
            </p>
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <span className="font-label-sm text-xs text-on-surface-variant">
                {statuses.instagram === 'connected' ? 'Last sync: 2h ago' : 'Not connected'}
              </span>
              <ActionButton sourceId="instagram" status={statuses.instagram} onToggle={toggle} />
            </div>
          </div>
        </div>

        {/* Spotify — 2-col span */}
        <div className={`glass-card rounded-xl p-6 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 border-t border-l border-white/20 lg:col-span-2 ${statuses.spotify === 'connected' ? 'hover:shadow-[0_10px_40px_rgba(0,238,252,0.1)]' : 'opacity-70 hover:opacity-100'}`}>
          <div className="absolute top-0 right-0 p-2 opacity-50 font-label-sm text-xs text-on-surface-variant tracking-widest">AUDIO_NODE</div>
          <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-secondary/10 rounded-full blur-3xl group-hover:bg-secondary/20 transition-colors" />
          <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-[#1DB954] flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-black text-2xl">headphones</span>
              </div>
            </div>
            <div className="flex-1 w-full flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <h3 className="font-headline-md text-headline-md text-on-surface">Spotify</h3>
                <StatusBadge status={statuses.spotify} />
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant text-sm max-w-md">
                Extracting tempo, genre moods, and lyrical sentiment to build your daily soundscapes.
              </p>
              {statuses.spotify === 'connected' && (
                <div className="bg-surface-container-low rounded-lg p-3 flex items-center gap-4 border border-white/5">
                  <div className="w-10 h-10 rounded bg-surface-container-highest overflow-hidden flex-shrink-0">
                    <div className="w-full h-full bg-gradient-to-br from-pink-500/40 to-green-500/40" />
                  </div>
                  <div className="flex-1">
                    <div className="font-label-sm text-sm text-on-surface">Currently defining vibe:</div>
                    <div className="font-body-md text-xs text-secondary">Synthwave &amp; Midnight Drives</div>
                  </div>
                  <span className="material-symbols-outlined text-secondary opacity-50 animate-pulse">graphic_eq</span>
                </div>
              )}
              <ActionButton sourceId="spotify" status={statuses.spotify} onToggle={toggle} />
            </div>
          </div>
        </div>

        {/* Pinterest */}
        <div className={`glass-card rounded-xl p-6 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 ${statuses.pinterest === 'connected' ? '' : 'opacity-80 hover:opacity-100 hover:border-primary/50'}`}>
          <div className="absolute top-0 right-0 p-2 opacity-30 font-label-sm text-xs text-on-surface-variant tracking-widest">BOARD_SYNC</div>
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div className={`w-12 h-12 rounded-lg bg-surface-container-highest border border-outline-variant flex items-center justify-center transition-all ${statuses.pinterest !== 'connected' ? 'grayscale group-hover:grayscale-0' : ''}`}>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-[#E60023] text-2xl transition-colors">push_pin</span>
            </div>
            <StatusBadge status={statuses.pinterest} />
          </div>
          <div className="relative z-10">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Pinterest</h3>
            <p className="font-body-md text-body-md text-on-surface-variant text-sm mb-6">
              Connect boards to seed visual inspiration clusters.
            </p>
            <ActionButton sourceId="pinterest" status={statuses.pinterest} onToggle={toggle} />
          </div>
        </div>

        {/* YouTube */}
        <div className="glass-card rounded-xl p-6 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 border-l-2 border-l-tertiary-container">
          <div className="absolute top-0 right-0 p-2 opacity-50 font-label-sm text-xs text-on-surface-variant tracking-widest">VID_LOG</div>
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div className="w-12 h-12 rounded-lg bg-surface-container-highest border border-outline-variant flex items-center justify-center">
              <span className="material-symbols-outlined text-[#FF0000] text-2xl">smart_display</span>
            </div>
            <StatusBadge status={statuses.youtube} />
          </div>
          <div className="relative z-10">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-2">YouTube</h3>
            <p className="font-body-md text-body-md text-on-surface-variant text-sm mb-6">
              {statuses.youtube === 'connected'
                ? 'Parsing watch history themes and extracting content vibes.'
                : 'We lost connection. Reconnect to keep parsing watch history themes.'}
            </p>
            <ActionButton sourceId="youtube" status={statuses.youtube} onToggle={toggle} />
          </div>
        </div>

        {/* Manual Import */}
        <div className="glass-card rounded-xl p-6 relative overflow-hidden group border border-dashed border-outline-variant hover:border-primary/50 transition-all duration-300 flex flex-col items-center justify-center text-center min-h-[250px]">
          <div className="w-16 h-16 rounded-full bg-surface-container-high border border-outline/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-3xl">upload_file</span>
          </div>
          <h3 className="font-headline-md text-headline-md text-on-surface mb-2 text-lg">Manual Import</h3>
          <p className="font-body-md text-body-md text-on-surface-variant text-sm mb-6 max-w-[200px]">
            Upload ZIP archives from Notion, Evernote, or Apple Notes.
          </p>
          <span className="font-label-sm text-primary text-xs uppercase tracking-widest group-hover:underline cursor-pointer">
            Browse Files
          </span>
        </div>

      </div>

      {/* Footer note */}
      <div className="mt-16 text-center opacity-50">
        <p className="font-label-sm text-xs text-on-surface-variant flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-sm">lock</span>
          All connections are processed locally. No personal identifiers are stored.
        </p>
      </div>

    </div>
  )
}
