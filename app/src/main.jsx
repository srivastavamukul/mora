import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/mora-design.css'
import './styles/shell-migration.css'
import './styles/moodboard-migration.css'
import './styles/itemdetail-migration.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
