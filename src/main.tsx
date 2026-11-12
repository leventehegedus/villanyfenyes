import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { applyTheme, loadPrefs } from './hooks/prefs'
import './index.css'

// Apply saved theme and language before the first paint.
const prefs = loadPrefs()
applyTheme(prefs.theme)
document.documentElement.lang = prefs.locale

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
