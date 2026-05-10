import { Link } from 'react-router-dom'

export default function EmptyState() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ maxWidth: 520, width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 48 }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h1 style={{ fontFamily: 'var(--mora-font-serif)', fontSize: 40, fontWeight: 500, color: 'var(--mora-ink)', lineHeight: 1.15, margin: 0, letterSpacing: '-0.02em' }}>
            Your creative archive starts here.
          </h1>
          <p style={{ fontFamily: 'var(--mora-font-serif)', fontStyle: 'italic', fontSize: 18, color: 'var(--mora-ink-2)', lineHeight: 1.45, margin: 0 }}>
            Connect sources or manually add content to begin weaving your digital tapestry.
          </p>
        </div>

        <div className="m-rule" style={{ width: '100%' }}>
          <span className="m-rule-line" />
          <span className="m-rule-orn">˖</span>
          <span className="m-rule-line" />
        </div>

        <div style={{ display: 'flex', gap: 16, width: '100%' }}>
          <Link
            to="/add"
            className="m-btn m-btn-primary"
            style={{ flex: 1, justifyContent: 'center', padding: '16px 20px', fontSize: 15 }}
          >
            <i className="ph ph-plus" /> Add Content
          </Link>
          <Link
            to="/sources"
            className="m-btn m-btn-ghost"
            style={{ flex: 1, justifyContent: 'center', padding: '16px 20px', fontSize: 15, border: '1px solid var(--mora-rule-soft)' }}
          >
            <i className="ph ph-plugs" /> Connect Sources
          </Link>
        </div>
        
      </div>
    </div>
  )
}
