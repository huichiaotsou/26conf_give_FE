import { createRoot } from 'react-dom/client'
import AppRouter from './Router'
import "./common/scss/reset.scss";

// Keep legacy conference-giving links working, including their path, query, and hash.
if (window.location.hostname === 'confgive.thehope.co') {
  window.location.replace(
    `https://giving.thehope.co${window.location.pathname}${window.location.search}${window.location.hash}`,
  )
}

createRoot(document.getElementById('root')!).render(
  <AppRouter />
)
