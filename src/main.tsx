import { createRoot } from 'react-dom/client'
import AppRouter from './Router'
import { initializeGA } from './analytics/ga'
import "./common/scss/reset.scss";

initializeGA()

createRoot(document.getElementById('root')!).render(
  <AppRouter />
)
