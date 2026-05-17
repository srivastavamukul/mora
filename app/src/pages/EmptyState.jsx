import { Link } from 'react-router-dom'

export default function EmptyState() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h1 style={{ fontFamily: 'var(--mora-font-serif)', fontSize: 36, fontWeight: 500, color: 'var(--mora-ink)', lineHeight: 1.2, margin: 0, letterSpacing: '-0.02em' }}>
            Save things that matter to you.
          </h1>
          <p style={{ fontFamily: 'var(--mora-font-serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--mora-ink-2)', lineHeight: 1.55, margin: 0 }}>
            Mora remembers what you keep — songs, articles, notes, and ideas worth returning to.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', textAlign: 'left' }}>
          {[
            'Start with a thought, article, or piece of music.',
            'No organisation needed — Mora finds the patterns.',
            'What you save shapes what Mora brings back to you.',
          ].map(line => (
            <p key={line} style={{ margin: 0, fontFamily: 'var(--mora-font-sans)', fontSize: 13, color: 'var(--mora-ink-3)', lineHeight: 1.5, paddingLeft: 12, borderLeft: '2px solid var(--mora-rule-soft)' }}>
              {line}
            </p>
          ))}
        </div>

        <div className="m-rule" style={{ width: '100%' }}>
          <span className="m-rule-line" />
          <span className="m-rule-orn">˖</span>
          <span className="m-rule-line" />
        </div>

        <div style={{ display: 'flex', gap: 12, width: '100%' }}>
          <Link
            to="/add"
            className="m-btn m-btn-primary"
            style={{ flex: 1, justifyContent: 'center', padding: '14px 20px', fontSize: 14 }}
          >
            <i className="ph ph-plus" /> Add something
          </Link>
          <Link
            to="/sources"
            className="m-btn m-btn-ghost"
            style={{ flex: 1, justifyContent: 'center', padding: '14px 20px', fontSize: 14, border: '1px solid var(--mora-rule-soft)' }}
          >
            <i className="ph ph-plugs" /> Connect sources
          </Link>
        </div>

      </div>
    </div>
  )
}
