import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import SideNav from './SideNav'
import TopBar from './TopBar'
import BottomNav from './BottomNav'
import JournalComposeModal from '../components/JournalComposeModal'
import FloatingCompanion from '../components/FloatingCompanion'
import { useApp } from '../context/AppContext'

export default function AppLayout() {
  const { setItems } = useApp()
  const [query, setQuery] = useState('')
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [captureAck, setCaptureAck] = useState(false)

  const openCompose = () => setIsComposeOpen(true)
  const closeCompose = () => setIsComposeOpen(false)

  const handleComposeSave = (entry) => {
    setItems(prev => [entry, ...prev])
    setIsComposeOpen(false)
    setCaptureAck(true)
    window.setTimeout(() => setCaptureAck(false), 1500)
  }

  return (
    <div className="m-shell mora">
      <SideNav onCapture={openCompose} captureAck={captureAck} />
      <main className="m-main">
        <TopBar query={query} onQueryChange={setQuery} />
        <div className="m-content">
          <Outlet context={{ query, setQuery, openCompose }} />
        </div>
      </main>
      <BottomNav />
      {isComposeOpen ? <JournalComposeModal onClose={closeCompose} onSave={handleComposeSave} /> : null}
      <FloatingCompanion />
    </div>
  )
}
