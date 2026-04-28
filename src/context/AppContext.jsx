import { createContext, useContext, useState, useEffect } from 'react'
import { items as initialItems } from '../data/items'
import { sources as initialSources } from '../data/sources'
import { migrateItem } from '../utils/migrateItem'

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

  return (
    <AppContext.Provider value={{ items, setItems, sources, setSources, selectedItemId, setSelectedItemId, toggleSource, flags, setFlags, toggleFlag, updateItem, deleteItem }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
