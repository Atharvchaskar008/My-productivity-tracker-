import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const VERCEL_TOOLBAR_SELECTORS = [
  'vercel-live-feedback',
  '#vercel-live-feedback',
  '[data-vercel-toolbar]',
  'iframe[src*="vercel.live"]',
  'script[src*="vercel.live"]',
  '[class*="vercel-toolbar"]',
  '[id*="vercel-toolbar"]',
].join(', ')

const hideVercelToolbar = () => {
  document.querySelectorAll(VERCEL_TOOLBAR_SELECTORS).forEach((el) => el.remove())
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
