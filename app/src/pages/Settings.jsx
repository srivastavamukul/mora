import { useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { exportMoraData } from '../utils/exportMoraData'
import { importMoraData } from '../utils/importMoraData'

export default function Settings() {
  const fileInputRef = useRef(null)
  const { items, sources, flags, setItems, setSources, setFlags, setSelectedItemId, behaviorSignals } = useApp()

  const [importStatus, setImportStatus] = useState(null)
  const [importPreview, setImportPreview] = useState(null)
  const [importError, setImportError] = useState(null)

  const handleExport = () => {
    const json = exportMoraData({ items, sources, flags })
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

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportStatus(null)
    setImportError(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result
      if (typeof content !== 'string') {
        setImportStatus('error')
        setImportError('Could not read file.')
        return
      }

      const result = importMoraData(content)
      if (!result.ok) {
        setImportStatus('error')
        setImportError(result.error)
      } else {
        setImportPreview(result.data)
        setImportStatus('previewing')
      }
    }
    reader.onerror = () => {
      setImportStatus('error')
      setImportError('Could not read file.')
    }
    reader.readAsText(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleConfirmImport = () => {
    if (!importPreview) return
    setItems(importPreview.items)
    setSources(importPreview.sources)
    setFlags(importPreview.flags)
    setSelectedItemId(null)
    setImportPreview(null)
    setImportStatus('success')
  }

  const handleCancelImport = () => {
    setImportPreview(null)
    setImportStatus(null)
    setImportError(null)
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
            Export Archive
          </button>

          <div style={{ position: 'relative' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              aria-label="Import backup file"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="m-btn m-btn-ghost"
              style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', border: '1px solid var(--mora-rule-soft)' }}
            >
              <i className="ph ph-upload-simple" />
              Import Archive
            </button>
          </div>

          {/* Import preview / confirm */}
          {importStatus === 'previewing' && importPreview && (
            <div style={{
              background: 'var(--mora-paper-deep)',
              border: '1px solid var(--mora-rule-soft)',
              borderRadius: 10,
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}>
              <div>
                <span className="m-nudge-source">Archive contains</span>
                <p className="m-nudge-title" style={{ marginTop: 4 }}>
                  {importPreview.items.length} {importPreview.items.length === 1 ? 'item' : 'items'}
                  {importPreview.sources.length > 0 && `, ${importPreview.sources.length} sources`}
                </p>
              </div>
              <p className="m-form-hint" style={{ margin: 0, color: 'var(--mora-ink-muted)' }}>
                This will replace your current archive. Cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleConfirmImport}
                  className="m-btn m-btn-primary"
                  style={{ flex: 1, justifyContent: 'center', padding: '10px 12px', fontSize: 14 }}
                >
                  Replace archive
                </button>
                <button
                  onClick={handleCancelImport}
                  className="m-btn m-btn-ghost"
                  style={{ flex: 1, justifyContent: 'center', padding: '10px 12px', fontSize: 14, border: '1px solid var(--mora-rule-soft)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Success message */}
          {importStatus === 'success' && (
            <p className="m-form-hint" style={{ margin: 0, color: 'var(--mora-accent, #5a7a5a)' }}>
              Archive restored.
            </p>
          )}

          {/* Error message */}
          {importStatus === 'error' && (
            <p className="m-form-hint" style={{ margin: 0, color: 'var(--mora-error, #a05050)' }}>
              {importError || 'That backup did not land.'}
            </p>
          )}
        </div>

        <p className="m-form-hint" style={{ marginTop: 16 }}>
          Export your items, sources, and notes as a JSON file. Import to restore from backup.
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
