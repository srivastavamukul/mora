import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import ErrorBoundary from './components/ErrorBoundary'
import AppLayout from './layouts/AppLayout'
import Landing from './pages/Landing'
import Moodboard from './pages/Moodboard'
import Constellations from './pages/Constellations'
import Archive from './pages/Archive'
import Sources from './pages/Sources'
import NudgeCenter from './pages/NudgeCenter'
import ItemDetail from './pages/ItemDetail'
import AddItem from './pages/AddItem'
import Settings from './pages/Settings'
import EmptyState from './pages/EmptyState'
import Timeline from './pages/Timeline'

export default function App() {
  return (
    <ErrorBoundary>
    <AppProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<AppLayout />}>
          <Route path="/moodboard" element={<ErrorBoundary><Moodboard /></ErrorBoundary>} />
          <Route path="/constellations" element={<ErrorBoundary><Constellations /></ErrorBoundary>} />
          <Route path="/archive" element={<ErrorBoundary><Archive /></ErrorBoundary>} />
          <Route path="/timeline" element={<ErrorBoundary><Timeline /></ErrorBoundary>} />
          <Route path="/sources" element={<ErrorBoundary><Sources /></ErrorBoundary>} />
          <Route path="/nudge" element={<ErrorBoundary><NudgeCenter /></ErrorBoundary>} />
          <Route path="/item" element={<ErrorBoundary><ItemDetail /></ErrorBoundary>} />
          <Route path="/add" element={<ErrorBoundary><AddItem /></ErrorBoundary>} />
          <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
          <Route path="/empty" element={<ErrorBoundary><EmptyState /></ErrorBoundary>} />
        </Route>
      </Routes>
    </BrowserRouter>
    </AppProvider>
    </ErrorBoundary>
  )
}
