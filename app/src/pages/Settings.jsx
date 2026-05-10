import { useRef } from 'react'
import { useApp } from '../context/AppContext'
import { migrateItem } from '../utils/migrateItem'

export default function Settings() {
  const fileInputRef = useRef(null)
  const { items, sources, flags, setItems, setSources, setFlags, setSelectedItemId, behaviorSignals } = useApp()
  const handleExport = () => {
    const backup = {
      schemaVersion: 1,
      items,
      sources,
      flags,
    }

    const json = JSON.stringify(backup, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'mora_backup.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result
        if (typeof content !== 'string') throw new Error('Invalid file')

        const data = JSON.parse(content)

        // Validation
        if (!Array.isArray(data.items)) throw new Error('items must be an array')
        if (!Array.isArray(data.sources)) throw new Error('sources must be an array')
        if (typeof data.flags !== 'object' || data.flags === null) throw new Error('flags must be an object')

        // Migrate items to ensure compatibility
        const migratedItems = data.items.map(migrateItem).filter(Boolean)

        // Update state (triggers localStorage via useEffect)
        setItems(migratedItems)
        setSources(data.sources)
        setFlags(data.flags)
        setSelectedItemId(null)

        alert('Backup restored.')
      } catch {
        alert("That backup didn't land.")
      }
    }
    reader.readAsText(file)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="m-compose-page">
      <h1 className="m-compose-page-title" style={{ marginTop: 24 }}>Preferences</h1>
      <p className="m-compose-page-sub">
        Calibrate your digital sentiment engine.
      </p>

      {/* Data Management Section */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontFamily: 'var(--mora-font-serif)', fontSize: 20, color: 'var(--mora-ink)', marginBottom: 24, fontWeight: 400 }}>
          Data Management
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
          <button
            onClick={handleExport}
            className="m-btn m-btn-primary"
            style={{ justifyContent: 'center', padding: '12px 16px' }}
          >
            <i className="ph ph-download-simple" />
            Export Backup
          </button>

          <div style={{ position: 'relative' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
              aria-label="Import backup file"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="m-btn m-btn-ghost"
              style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', border: '1px solid var(--mora-rule-soft)' }}
            >
              <i className="ph ph-upload-simple" />
              Import Backup
            </button>
          </div>
        </div>
        <p className="m-form-hint" style={{ marginTop: 16 }}>
          Export your items, sources, and preferences as a JSON file. Import to restore from backup.
        </p>
      </section>

      {/* Memory Signals Section */}
      {behaviorSignals && items.length > 0 && (
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'var(--mora-font-serif)', fontSize: 20, color: 'var(--mora-ink)', marginBottom: 8, fontWeight: 400 }}>
            Memory Signals
          </h2>
          <p className="m-form-hint" style={{ marginBottom: 24 }}>Derived from your saves. No tracking.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
            {behaviorSignals.topSources[0] && (
              <div style={{ background: 'var(--mora-paper-deep)', padding: '16px 20px', borderRadius: 10, border: '1px solid var(--mora-rule-soft)' }}>
                <span className="m-nudge-source">Most Active Source</span>
                <p className="m-nudge-title" style={{ marginTop: 4, textTransform: 'capitalize' }}>{behaviorSignals.topSources[0].source}</p>
              </div>
            )}
            {behaviorSignals.topTags[0] && (
              <div style={{ background: 'var(--mora-paper-deep)', padding: '16px 20px', borderRadius: 10, border: '1px solid var(--mora-rule-soft)' }}>
                <span className="m-nudge-source">You Save a Lot of</span>
                <p className="m-nudge-title" style={{ marginTop: 4 }}>
                  {behaviorSignals.topTags.slice(0, 3).map(t => t.tag).join(', ')}
                </p>
              </div>
            )}
            {behaviorSignals.dominantType && (
              <div style={{ background: 'var(--mora-paper-deep)', padding: '16px 20px', borderRadius: 10, border: '1px solid var(--mora-rule-soft)' }}>
                <span className="m-nudge-source">Dominant Type</span>
                <p className="m-nudge-title" style={{ marginTop: 4, textTransform: 'capitalize' }}>{behaviorSignals.dominantType}</p>
              </div>
            )}
            <div style={{ background: 'var(--mora-paper-deep)', padding: '16px 20px', borderRadius: 10, border: '1px solid var(--mora-rule-soft)' }}>
              <span className="m-nudge-source">Save Frequency</span>
              <p className="m-nudge-title" style={{ marginTop: 4, textTransform: 'capitalize' }}>{behaviorSignals.saveFrequency}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
