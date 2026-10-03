import { createRoot } from 'react-dom/client'
import AppRouter from './Router'
import "./common/scss/reset.scss";

createRoot(document.getElementById('root')!).render(
  <AppRouter />
)
