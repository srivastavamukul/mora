import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { items as initialItems } from '../data/items'
import { sources as initialSources } from '../data/sources'
import { migrateItem } from '../utils/migrateItem'
import { initBridge } from '../utils/moraBridge'
import { buildInterestClusters } from '../utils/buildInterestClusters'
import { buildTimelineGroups } from '../utils/buildTimelineGroups'
import { buildBehaviorSignals } from '../utils/buildBehaviorSignals'
import { getRecentlyRelevantItems } from '../utils/getRecentlyRelevantItems'
import { buildResurfacedItems } from '../utils/buildResurfacedItems'
import { buildResurfacingSignals } from '../utils/buildResurfacingSignals'
import { buildMemoryInsights } from '../utils/buildMemoryInsights'
import { getUpcomingMemoryEvents } from '../utils/getUpcomingMemoryEvents'
import { getRecentReflections } from '../utils/getRecentReflections'
import { buildFamiliarMemorySignals } from '../utils/buildFamiliarMemorySignals'
import { buildPersonalRecallMoments } from '../utils/buildPersonalRecallMoments'
import { buildMemoryStats } from '../utils/buildMemoryStats'
import { deduplicateCapture } from '../utils/deduplicateCapture'

const AppContext = createContext(null)

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // QuotaExceededError or SecurityError — data survives in memory for the session
  }
}

export function AppProvider({ children }) {
  const [items, setItems] = useState(() => {
    const loaded = load('mora_items', initialItems)
    const arr = Array.isArray(loaded) ? loaded : initialItems
    return arr.map(migrateItem).filter(Boolean)
  })
  const [sources, setSources] = useState(() => {
    const loaded = load('mora_sources', initialSources)
    return Array.isArray(loaded) ? loaded : initialSources
  })
  const [selectedItemId, setSelectedItemId] = useState(() => load('mora_selectedItemId', null))
  const [flags, setFlags] = useState(() => {
    const loaded = load('mora_flags', {})
    return loaded && typeof loaded === 'object' && !Array.isArray(loaded) ? loaded : {}
  })

  useEffect(() => initBridge(setItems), [])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.__moraNativeAndroid) return

    function onMobileShareItem(moraItem) {
      // TRACE-8: final item arriving at AppContext — this is what gets persisted
      console.log('[MoraTrace][Stage8-Persist] moraItem:', JSON.stringify({ id: moraItem?.id, url: moraItem?.url, title: moraItem?.title, description: moraItem?.description, thumbnail: moraItem?.thumbnail, source: moraItem?.source, type: moraItem?.type }))
      try {
        let existing = []
        try {
          const raw = localStorage.getItem('mora_items')
          const parsed = JSON.parse(raw ?? 'null')
          if (Array.isArray(parsed)) existing = parsed
        } catch {}
        const { isDuplicate } = deduplicateCapture(existing, moraItem)
        if (isDuplicate) {
          console.log('[MoraTrace][Stage8-Persist] REJECTED as duplicate')
          return { status: 'duplicate' }
        }
        setItems(prev => {
          const { isDuplicate: stillDupe } = deduplicateCapture(prev, moraItem)
          if (stillDupe) console.log('[MoraTrace][Stage8-Persist] REJECTED as duplicate (race check)')
          return stillDupe ? prev : [...prev, moraItem]
        })
        return { status: 'saved' }
      } catch {
        return { status: 'failed' }
      }
    }

    import('../../../mobile/src/services/capacitorShareBridge.js')
      .then(({ initCapacitorBridge, exposeNativeBridge }) => {
        exposeNativeBridge()
        initCapacitorBridge(onMobileShareItem)
      })
      .catch(() => {})
  }, [])
  useEffect(() => { save('mora_items', items) }, [items])
  useEffect(() => { save('mora_sources', sources) }, [sources])
  useEffect(() => { save('mora_selectedItemId', selectedItemId) }, [selectedItemId])
  useEffect(() => { save('mora_flags', flags) }, [flags])

  const toggleSource = (id) => {
    setSources(prev => prev.map(s =>
      s.id === id
        ? { ...s, status: s.status === 'connected' ? 'disconnected' : 'connected' }
        : s
    ))
  }

  const toggleFlag = (id, key) => {
    setFlags(prev => ({
      ...prev,
      [id]: { ...prev[id], [key]: !prev[id]?.[key] }
    }))
  }

  const updateItem = (id, data) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...data } : item
    ))
  }

  const deleteItem = (id) => {
    setItems(prev => {
      const toDelete = prev.find(item => item.id === id)
      if (toDelete?.url) {
        // Signal extension to remove this URL from the capture queue (Bug 3)
        window.postMessage({ source: 'mora-app', type: 'ITEM_DELETED', url: toDelete.url }, window.location.origin)
      }
      return prev.filter(item => item.id !== id)
    })
  }

  const interestClusters = useMemo(() => buildInterestClusters(items), [items])
  const timelineGroups = useMemo(() => buildTimelineGroups(items), [items])
  const behaviorSignals = useMemo(() => buildBehaviorSignals(items), [items])
  const recentlyRelevant = useMemo(() => getRecentlyRelevantItems(items), [items])
  const resurfacingSignals = useMemo(() => buildResurfacingSignals(items), [items])
  const resurfacedItems = useMemo(() => {
    const candidates = resurfacingSignals.revisitCandidates
    return candidates.length > 0 ? candidates : buildResurfacedItems(items, behaviorSignals)
  }, [items, behaviorSignals, resurfacingSignals])
  const memoryStats = useMemo(() => buildMemoryStats(items), [items])
  const memoryInsights = useMemo(
    () => buildMemoryInsights(items, behaviorSignals, interestClusters, flags),
    [items, behaviorSignals, interestClusters, flags]
  )
  const upcomingMemoryEvents = useMemo(() => getUpcomingMemoryEvents(items), [items])
  const recentReflections = useMemo(() => getRecentReflections(items), [items])
  const familiarMemorySignals = useMemo(
    () => buildFamiliarMemorySignals(items, behaviorSignals, recentReflections),
    [items, behaviorSignals, recentReflections]
  )
  const personalRecallMoments = useMemo(
    () => buildPersonalRecallMoments(items),
    [items]
  )

  return (
    <AppContext.Provider value={{ items, setItems, sources, setSources, selectedItemId, setSelectedItemId, toggleSource, flags, setFlags, toggleFlag, updateItem, deleteItem, interestClusters, timelineGroups, behaviorSignals, recentlyRelevant, resurfacedItems, resurfacingSignals, memoryStats, memoryInsights, upcomingMemoryEvents, recentReflections, familiarMemorySignals, personalRecallMoments }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
