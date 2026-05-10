import { useApp } from '../context/AppContext'

function StatusBadge({ status }) {
  if (status === 'connected') return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--mora-paper-deep)', padding: '4px 10px', borderRadius: 20, border: '1px solid var(--mora-rule-soft)' }}>
      <i className="ph-fill ph-check-circle" style={{ color: 'var(--mora-moss)', fontSize: 14 }} />
      <span style={{ fontFamily: 'var(--mora-font-sans)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mora-ink-2)' }}>Connected</span>
    </div>
  )
  if (status === 'error') return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--mora-paper-deep)', padding: '4px 10px', borderRadius: 20, border: '1px solid var(--mora-rule-soft)' }}>
      <i className="ph-fill ph-warning-circle" style={{ color: 'var(--mora-ember)', fontSize: 14 }} />
      <span style={{ fontFamily: 'var(--mora-font-sans)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mora-ink-2)' }}>Auth Expired</span>
    </div>
  )
  return null
}

function ActionButton({ sourceId, status, onToggle }) {
  if (status === 'connected') return (
    <button
      onClick={() => onToggle(sourceId)}
      className="m-btn m-btn-ghost"
      style={{ width: '100%', justifyContent: 'center' }}
    >
      Disconnect
    </button>
  )
  if (status === 'error') return (
    <button
      onClick={() => onToggle(sourceId)}
      className="m-btn m-btn-ghost"
      style={{ width: '100%', justifyContent: 'center', color: 'var(--mora-ember)', borderColor: 'var(--mora-ember)' }}
    >
      Reconnect
    </button>
  )
  return (
    <button
      onClick={() => onToggle(sourceId)}
      className="m-btn m-btn-ghost"
      style={{ width: '100%', justifyContent: 'center', border: '1px solid var(--mora-rule)' }}
    >
      Connect Account
    </button>
  )
}

export default function Sources() {
  const { sources, toggleSource: toggle } = useApp()
  const statuses = Object.fromEntries(sources.map(s => [s.id, s.status]))

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', paddingTop: 32, paddingBottom: 96, paddingLeft: 24, paddingRight: 24 }}>

      {/* Header */}
      <header style={{ marginBottom: 48 }}>
        <h2 className="m-compose-page-title">Connect Sources</h2>
        <p className="m-compose-page-sub">
          Weave your digital footprints into Mora. We only extract the vibe, never the private details.
        </p>

        {/* Filter chips — live counts */}
        <div style={{ display: 'flex', gap: 12, marginTop: 24, overflowX: 'auto', paddingBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--mora-paper-deep)', padding: '6px 14px', borderRadius: 20, border: '1px solid var(--mora-rule-soft)', whiteSpace: 'nowrap' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--mora-moss)' }} />
            <span style={{ fontFamily: 'var(--mora-font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mora-ink)' }}>
              Active Streams
              <span style={{ marginLeft: 8, color: 'var(--mora-ink-2)' }}>
                {Object.values(statuses).filter(s => s === 'connected').length}
              </span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--mora-paper-deep)', padding: '6px 14px', borderRadius: 20, border: '1px solid var(--mora-rule-soft)', whiteSpace: 'nowrap', opacity: 0.6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--mora-ink-4)' }} />
            <span style={{ fontFamily: 'var(--mora-font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mora-ink)' }}>
              Paused
              <span style={{ marginLeft: 8, color: 'var(--mora-ink-3)' }}>
                {Object.values(statuses).filter(s => s !== 'connected').length}
              </span>
            </span>
          </div>
        </div>
      </header>

      <div className="m-rule" style={{ marginBottom: 48 }}>
        <span className="m-rule-line" />
        <span className="m-rule-line" />
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>

        {/* Instagram */}
        <div className={`m-source-card ${statuses.instagram === 'connected' ? '' : 'disabled'}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ph ph-instagram-logo" style={{ color: 'white', fontSize: 24 }} />
            </div>
            <StatusBadge status={statuses.instagram} />
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--mora-font-serif)', fontSize: 22, fontWeight: 500, color: 'var(--mora-ink)', margin: '0 0 8px' }}>Instagram</h3>
            <p style={{ fontFamily: 'var(--mora-font-serif)', fontSize: 14, lineHeight: 1.5, color: 'var(--mora-ink-2)', margin: 0, minHeight: 42 }}>
              Importing saved posts, tagged locations, and visual aesthetics.
            </p>
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--mora-rule-soft)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontFamily: 'var(--mora-font-sans)', fontSize: 11, fontWeight: 500, color: 'var(--mora-ink-3)', textAlign: 'center' }}>
              {statuses.instagram === 'connected' ? 'Last sync: 2h ago' : 'Not connected'}
            </span>
            <ActionButton sourceId="instagram" status={statuses.instagram} onToggle={toggle} />
          </div>
        </div>

        {/* Spotify */}
        <div className={`m-source-card ${statuses.spotify === 'connected' ? '' : 'disabled'}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#1DB954', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ph-fill ph-spotify-logo" style={{ color: 'white', fontSize: 28 }} />
            </div>
            <StatusBadge status={statuses.spotify} />
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--mora-font-serif)', fontSize: 22, fontWeight: 500, color: 'var(--mora-ink)', margin: '0 0 8px' }}>Spotify</h3>
            <p style={{ fontFamily: 'var(--mora-font-serif)', fontSize: 14, lineHeight: 1.5, color: 'var(--mora-ink-2)', margin: 0, minHeight: 42 }}>
              Extracting tempo, genre moods, and lyrical sentiment.
            </p>
          </div>
          {statuses.spotify === 'connected' && (
            <div style={{ background: 'var(--mora-vellum)', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--mora-rule-soft)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--mora-font-sans)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mora-ink-3)', marginBottom: 2 }}>Currently defining vibe:</div>
                <div style={{ fontFamily: 'var(--mora-font-serif)', fontSize: 14, color: 'var(--mora-ink)' }}>Synthwave & Midnight Drives</div>
              </div>
              <i className="ph ph-wave-sawtooth" style={{ color: 'var(--mora-moss)', fontSize: 18 }} />
            </div>
          )}
          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--mora-rule-soft)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ActionButton sourceId="spotify" status={statuses.spotify} onToggle={toggle} />
          </div>
        </div>

        {/* Pinterest */}
        <div className={`m-source-card ${statuses.pinterest === 'connected' ? '' : 'disabled'}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#E60023', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
              <i className="ph-fill ph-pinterest-logo" style={{ color: 'white', fontSize: 24 }} />
            </div>
            <StatusBadge status={statuses.pinterest} />
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--mora-font-serif)', fontSize: 22, fontWeight: 500, color: 'var(--mora-ink)', margin: '0 0 8px' }}>Pinterest</h3>
            <p style={{ fontFamily: 'var(--mora-font-serif)', fontSize: 14, lineHeight: 1.5, color: 'var(--mora-ink-2)', margin: 0, minHeight: 42 }}>
              Connect boards to seed visual inspiration clusters.
            </p>
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--mora-rule-soft)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ActionButton sourceId="pinterest" status={statuses.pinterest} onToggle={toggle} />
          </div>
        </div>

        {/* YouTube */}
        <div className={`m-source-card ${statuses.youtube === 'connected' ? '' : 'disabled'}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FF0000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ph-fill ph-youtube-logo" style={{ color: 'white', fontSize: 24 }} />
            </div>
            <StatusBadge status={statuses.youtube} />
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--mora-font-serif)', fontSize: 22, fontWeight: 500, color: 'var(--mora-ink)', margin: '0 0 8px' }}>YouTube</h3>
            <p style={{ fontFamily: 'var(--mora-font-serif)', fontSize: 14, lineHeight: 1.5, color: 'var(--mora-ink-2)', margin: 0, minHeight: 42 }}>
              {statuses.youtube === 'connected'
                ? 'Parsing watch history themes and extracting content vibes.'
                : 'We lost connection. Reconnect to keep parsing watch history themes.'}
            </p>
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--mora-rule-soft)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ActionButton sourceId="youtube" status={statuses.youtube} onToggle={toggle} />
          </div>
        </div>

        {/* Manual Import */}
        <div style={{ background: 'var(--mora-paper-deep)', border: '1px dashed var(--mora-rule)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 240, transition: 'all 200ms cubic-bezier(.32,.72,.28,1)', cursor: 'pointer' }}>
          <div style={{ width: 48, height: 48, borderRadius: 24, background: 'var(--mora-vellum)', border: '1px solid var(--mora-rule-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <i className="ph ph-upload-simple" style={{ color: 'var(--mora-ink-3)', fontSize: 20 }} />
          </div>
          <h3 style={{ fontFamily: 'var(--mora-font-serif)', fontSize: 20, fontWeight: 500, color: 'var(--mora-ink)', margin: '0 0 8px' }}>Manual Import</h3>
          <p style={{ fontFamily: 'var(--mora-font-serif)', fontSize: 14, lineHeight: 1.5, color: 'var(--mora-ink-2)', margin: '0 0 16px', maxWidth: 200 }}>
            Upload ZIP archives from Notion, Evernote, or Apple Notes.
          </p>
          <span style={{ fontFamily: 'var(--mora-font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mora-ink-3)' }}>
            Browse Files
          </span>
        </div>

      </div>

      {/* Footer note */}
      <div style={{ marginTop: 64, textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--mora-font-serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--mora-ink-4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <i className="ph ph-lock-key" />
          All connections are processed locally. No personal identifiers are stored.
        </p>
      </div>

    </div>
  )
}
