import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const hideVercelToolbar = () => {
  document
    .querySelectorAll(
      'vercel-live-feedback, #vercel-live-feedback, [data-vercel-toolbar], iframe[src*="vercel.live"]'
    )
    .forEach((el) => el.remove())
}

hideVercelToolbar()
new MutationObserver(hideVercelToolbar).observe(document.documentElement, {
  childList: true,
  subtree: true,
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
