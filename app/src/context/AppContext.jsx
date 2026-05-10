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
import { buildMemoryInsights } from '../utils/buildMemoryInsights'
import { getUpcomingMemoryEvents } from '../utils/getUpcomingMemoryEvents'
import { getRecentReflections } from '../utils/getRecentReflections'
import { buildFamiliarMemorySignals } from '../utils/buildFamiliarMemorySignals'
import { buildPersonalRecallMoments } from '../utils/buildPersonalRecallMoments'

const AppContext = createContext(null)

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function AppProvider({ children }) {
  const [items, setItems] = useState(() =>
    load('mora_items', initialItems)
    .map(migrateItem)
    .filter(Boolean)
  )
  const [sources, setSources] = useState(() => load('mora_sources', initialSources))
  const [selectedItemId, setSelectedItemId] = useState(() => load('mora_selectedItemId', null))
  const [flags, setFlags] = useState(() => load('mora_flags', {}))

  useEffect(() => initBridge(setItems), [])
  useEffect(() => { localStorage.setItem('mora_items', JSON.stringify(items)) }, [items])
  useEffect(() => { localStorage.setItem('mora_sources', JSON.stringify(sources)) }, [sources])
  useEffect(() => { localStorage.setItem('mora_selectedItemId', JSON.stringify(selectedItemId)) }, [selectedItemId])
  useEffect(() => { localStorage.setItem('mora_flags', JSON.stringify(flags)) }, [flags])

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
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const interestClusters = useMemo(() => buildInterestClusters(items), [items])
  const timelineGroups = useMemo(() => buildTimelineGroups(items), [items])
  const behaviorSignals = useMemo(() => buildBehaviorSignals(items), [items])
  const recentlyRelevant = useMemo(() => getRecentlyRelevantItems(items), [items])
  const resurfacedItems = useMemo(() => buildResurfacedItems(items, behaviorSignals), [items, behaviorSignals])
  const memoryInsights = useMemo(() => buildMemoryInsights(items, behaviorSignals, interestClusters), [items, behaviorSignals, interestClusters])
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
    <AppContext.Provider value={{ items, setItems, sources, setSources, selectedItemId, setSelectedItemId, toggleSource, flags, setFlags, toggleFlag, updateItem, deleteItem, interestClusters, timelineGroups, behaviorSignals, recentlyRelevant, resurfacedItems, memoryInsights, upcomingMemoryEvents, recentReflections, familiarMemorySignals, personalRecallMoments }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
