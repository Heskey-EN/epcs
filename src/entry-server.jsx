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
import { primeBlog } from './lib/blog.js'

// Every post, loaded synchronously: renderToString cannot wait for the lazy
// chunks the browser uses. This eager glob exists only in the SSR bundle.
const postModules = import.meta.glob('./generated/posts/*.json', { eager: true, import: 'default' })
const BLOG_POSTS = Object.values(postModules).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
import BLOG_INDEX from './generated/blog-index.json'
primeBlog(BLOG_INDEX, BLOG_POSTS)

/** Full post objects, newest first — prerender.mjs writes pages, the sitemap and RSS from these. */
export { BLOG_POSTS }

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
