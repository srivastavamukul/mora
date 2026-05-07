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

        alert('Backup restored successfully!')
      } catch (error) {
        alert('Invalid backup file')
      }
    }
    reader.readAsText(file)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="pt-8 pb-24 px-6 lg:px-12 min-h-screen relative w-full">
      <h1 className="font-display-xl text-display-xl text-on-surface mb-2">Preferences</h1>
      <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-8">
        Calibrate your digital sentiment engine.
      </p>

      {/* Data Management Section */}
      <section className="mb-12">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-6">Data Management</h2>
        <div className="flex flex-col gap-4 max-w-md">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg hover:shadow-[0_0_15px_#ff479c] transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            Export Backup
          </button>

          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              aria-label="Import backup file"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-container border border-white/10 text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high hover:border-white/30 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">upload</span>
              Import Backup
            </button>
          </div>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-4">
          Export your items, sources, and preferences as a JSON file. Import to restore from backup.
        </p>
      </section>

      {/* Memory Signals Section */}
      {behaviorSignals && items.length > 0 && (
        <section className="mb-12">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-1">Memory Signals</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">Derived from your saves. No tracking.</p>
          <div className="flex flex-col gap-3 max-w-md">
            {behaviorSignals.topSources[0] && (
              <div className="px-4 py-3 rounded-xl bg-surface-container border border-white/10">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">Most Active Source</span>
                <p className="font-body-md text-body-md text-on-surface mt-0.5 capitalize">{behaviorSignals.topSources[0].source}</p>
              </div>
            )}
            {behaviorSignals.topTags[0] && (
              <div className="px-4 py-3 rounded-xl bg-surface-container border border-white/10">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">You Save a Lot of</span>
                <p className="font-body-md text-body-md text-on-surface mt-0.5">
                  {behaviorSignals.topTags.slice(0, 3).map(t => t.tag).join(', ')}
                </p>
              </div>
            )}
            {behaviorSignals.dominantType && (
              <div className="px-4 py-3 rounded-xl bg-surface-container border border-white/10">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">Dominant Type</span>
                <p className="font-body-md text-body-md text-on-surface mt-0.5 capitalize">{behaviorSignals.dominantType}</p>
              </div>
            )}
            <div className="px-4 py-3 rounded-xl bg-surface-container border border-white/10">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">Save Frequency</span>
              <p className="font-body-md text-body-md text-on-surface mt-0.5 capitalize">{behaviorSignals.saveFrequency}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
