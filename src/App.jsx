import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import AppLayout from './layouts/AppLayout'
import Landing from './pages/Landing'
import Moodboard from './pages/Moodboard'
import Constellations from './pages/Constellations'
import Sources from './pages/Sources'
import NudgeCenter from './pages/NudgeCenter'
import ItemDetail from './pages/ItemDetail'
import Settings from './pages/Settings'
import EmptyState from './pages/EmptyState'

export default function App() {
  return (
    <AppProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<AppLayout />}>
          <Route path="/moodboard" element={<Moodboard />} />
          <Route path="/constellations" element={<Constellations />} />
          <Route path="/sources" element={<Sources />} />
          <Route path="/nudge" element={<NudgeCenter />} />
          <Route path="/item" element={<ItemDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/empty" element={<EmptyState />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </AppProvider>
  )
}
