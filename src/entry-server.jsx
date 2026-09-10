// Server entry used ONLY at build time by scripts/prerender.mjs.
//
// It renders each marketing route to static HTML so the file Vercel serves
// already contains the page's real text. Without this the crawler received an
// empty <div id="root"> and had to run JavaScript to see anything — see the
// note in src/data/routeMeta.js for why that got the ads disapproved.
//
// This is NOT hydration-mismatch-sensitive: main.jsx uses createRoot().render(),
// which discards whatever is in #root and mounts fresh. The pre-rendered markup
// is a faithful copy of what React produces for that route, so the crawler and
// the visitor see the same page — which is the whole point.
import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import App from './App.jsx'

/** Render one route to an HTML string. */
export function render(url) {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>,
  )
}

export { ROUTE_META, DEFAULT_META, metaFor } from './data/routeMeta.js'
