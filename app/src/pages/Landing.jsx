import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden' }}>
      
      {/* Header */}
      <header style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px', width: '100%' }}>
        <span style={{ fontFamily: 'var(--mora-font-serif)', fontSize: 24, fontWeight: 500, color: 'var(--mora-ink)', letterSpacing: '-0.02em' }}>Mora<span style={{ color: 'var(--mora-ember)' }}>.</span></span>
        <Link to="/empty" style={{ fontFamily: 'var(--mora-font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--mora-ink-3)', textDecoration: 'none' }}>
          LOG IN
        </Link>
      </header>

      {/* Hero */}
      <main style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 640 }}>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--mora-moss)' }} />
            <span style={{ fontFamily: 'var(--mora-font-sans)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mora-ink-3)' }}>Archive active</span>
          </div>

          <h1 style={{ fontFamily: 'var(--mora-font-serif)', fontSize: 56, fontWeight: 400, color: 'var(--mora-ink)', marginBottom: 24, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            Your saved world,<br />alive again.
          </h1>
          
          <p style={{ fontFamily: 'var(--mora-font-serif)', fontStyle: 'italic', fontSize: 20, color: 'var(--mora-ink-2)', marginBottom: 48, maxWidth: 520, lineHeight: 1.5 }}>
            Turning digital fragments into a living memory system. Stop hoarding links and start building your personal intelligence constellation.
          </p>

          <div style={{ display: 'flex', gap: 16, width: '100%', justifyContent: 'center' }}>
            <Link
              to="/sources"
              className="m-btn m-btn-primary"
              style={{ padding: '16px 24px', fontSize: 15 }}
            >
              Connect your sources
              <i className="ph ph-arrow-right" style={{ marginLeft: 4 }} />
            </Link>
            <Link
              to="/moodboard"
              className="m-btn m-btn-ghost"
              style={{ padding: '16px 24px', fontSize: 15, border: '1px solid var(--mora-rule-soft)' }}
            >
              Try manual capture
            </Link>
          </div>
          
        </div>
      </main>
      
      {/* Decorative calm background elements */}
      <div style={{ position: 'absolute', top: '10%', right: '10%', width: 300, height: 400, background: 'var(--mora-vellum)', borderRadius: 20, border: '1px solid var(--mora-rule-soft)', zIndex: 0, opacity: 0.5, transform: 'rotate(4deg)' }} />
      <div style={{ position: 'absolute', bottom: '5%', left: '15%', width: 250, height: 200, background: 'var(--mora-paper-deep)', borderRadius: 16, border: '1px solid var(--mora-rule-soft)', zIndex: 0, opacity: 0.6, transform: 'rotate(-3deg)' }} />

    </div>
  )
}
