import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { preloadForPath } from './lib/blog.js'

// Blog pages need their post before the first render, so the page React
// mounts is the same page that was pre-rendered (no "Loading…" flash over real
// content). Every other route mounts immediately — preloadForPath is a no-op.
const mount = () =>
  ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

preloadForPath(window.location.pathname).catch(() => {}).finally(mount)
