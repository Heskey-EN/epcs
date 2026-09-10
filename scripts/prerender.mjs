// Build step 3: turn the client bundle into real, crawlable HTML per route.
//
// Runs after `vite build` (client) and `vite build --ssr` (server bundle):
//   dist/index.html          the client shell, with an empty #root
//   dist-ssr/entry-server.js the same App, renderable in Node
//
// For each route we render the App to a string, drop it into #root, and swap in
// that route's own <title> and <meta description>. The result is written to
// dist/<route>/index.html, which Vercel serves directly for /<route>.
//
// Visitors still get the full React app — createRoot() replaces #root on mount.
// Crawlers, which may never run JavaScript, get the same words a visitor reads
// instead of a blank page. That matters here beyond SEO: Google Ads' own
// landing-page review fetches the destination URL without running JavaScript,
// and an ad pointing at an empty shell is a disapproval waiting to happen.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = resolve(process.cwd())
const dist = join(root, 'dist')
const ssrEntry = join(root, 'dist-ssr', 'entry-server.js')

if (!existsSync(ssrEntry)) {
  console.error('prerender: missing ' + ssrEntry + ' — run `vite build --ssr src/entry-server.jsx --outDir dist-ssr` first.')
  process.exit(1)
}

// The deployment's own origin. Resolved exactly as vite.config.js resolves it
// for the browser bundle, so the canonical tags, the sitemap and the JSON-LD
// @ids can never disagree about which host this is.
const SITE = (() => {
  const explicit = process.env.SITE_URL
  if (explicit) return explicit.replace(/\/+$/, '')
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`
  return 'http://localhost:5173'
})()

// Whether search engines may index this deployment. Default NO — see
// src/data/site.js for the reasoning. In short: this is a second copy of the
// booking page that already exists at ecofutures.uk/epcs, and letting the two
// compete in organic search costs the established domain for nothing.
const INDEXABLE = String(process.env.INDEXABLE || '') === 'true'

const { render, ROUTE_META, metaFor } = await import(pathToFileURL(ssrEntry).href)

const template = readFileSync(join(dist, 'index.html'), 'utf8')

const routes = Object.keys(ROUTE_META)

// Pages that must never be indexed even when the site as a whole is: /booked
// carries a Stripe session id in its URL, which unlocks the payer's name,
// email, phone and address (api/booking.js).
const NOINDEX = new Set(['/booked'])

const escapeAttr = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const url = (path) => `${SITE}${path === '/' ? '/' : path}`

let ok = 0
const failures = []

for (const route of routes) {
  try {
    const appHtml = render(route)
    const { title, description } = metaFor(route)

    let html = template
      // Content into the shell.
      .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
      // Per-route title + description, replacing the generic site-wide ones.
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeAttr(title)}</title>`)
      .replace(
        /<meta\s+name="description"[\s\S]*?\/>/,
        `<meta name="description" content="${escapeAttr(description)}" />`,
      )
      .replace(
        /<meta\s+property="og:title"[\s\S]*?\/>/,
        `<meta property="og:title" content="${escapeAttr(title)}" />`,
      )
      .replace(
        /<meta\s+property="og:description"[\s\S]*?\/>/,
        `<meta property="og:description" content="${escapeAttr(description)}" />`,
      )

    html = html.replace('</head>', `  <link rel="canonical" href="${url(route)}" />\n  </head>`)

    if (!INDEXABLE || NOINDEX.has(route)) {
      html = html.replace('</head>', '  <meta name="robots" content="noindex, nofollow" />\n  </head>')
    }

    if (!html.includes(`<div id="root">${appHtml.slice(0, 40)}`)) {
      throw new Error('content was not injected — did the #root placeholder change?')
    }

    const outFile = route === '/' ? join(dist, 'index.html') : join(dist, route, 'index.html')
    mkdirSync(dirname(outFile), { recursive: true })
    writeFileSync(outFile, html)
    ok++
    console.log(`  prerendered ${route.padEnd(20)} ${appHtml.length.toLocaleString()} chars`)
  } catch (e) {
    failures.push({ url: route, message: e?.message || String(e) })
    console.error(`  FAILED ${route}: ${e?.message || e}`)
  }
}

// A real 404 document. Vercel serves this, with a 404 status, for any path that
// is not a file — provided vercel.json has no catch-all rewrite. The parent
// site did have one, so /wp-login.php, /shell.php and /.env all answered 200
// with a full page of content: a soft 404 to a search engine, and the exact
// fingerprint of a compromised site to an automated classifier. Do not add a
// rewrite back.
try {
  const notFoundHtml = render('/__not-found__')
  const html = template
    .replace('<div id="root"></div>', `<div id="root">${notFoundHtml}</div>`)
    .replace(/<title>[\s\S]*?<\/title>/, '<title>Page not found | Eco Futures</title>')
    .replace(
      /<meta\s+name="description"[\s\S]*?\/>/,
      '<meta name="description" content="That page does not exist." />',
    )
    .replace('</head>', '  <meta name="robots" content="noindex, nofollow" />\n  </head>')
  writeFileSync(join(dist, '404.html'), html)
  console.log('  wrote      404.html')
} catch (e) {
  failures.push({ url: '404.html', message: e?.message || String(e) })
  console.error(`  FAILED 404.html: ${e?.message || e}`)
}

console.log(`prerender: ${ok}/${routes.length} routes · site ${SITE} · ${INDEXABLE ? 'indexable' : 'noindex'}`)

// A silently-unprerendered landing page is the exact fault this build step
// exists to prevent, so fail the build rather than deploy a blank shell.
if (failures.length) {
  console.error('prerender: failing the build — ' + failures.map((f) => f.url).join(', '))
  process.exit(1)
}

// ── robots.txt ─────────────────────────────────────────────────────────────
// Written here rather than kept in public/, because what it should say depends
// on INDEXABLE and the host, and a stale hand-edited copy is how a site ends up
// quietly blocking or quietly exposing itself.
//
// THE ADSBOT BLOCK IS NOT OPTIONAL. This site's whole purpose is to receive
// Google Ads traffic, and Google must be able to fetch the landing page to
// check the ad matches it — an uncrawlable destination is a disapproval.
//
// AdsBot deliberately ignores the wildcard `User-agent: *`, so `Disallow: /`
// there does not actually block it. But relying on that is a trap: it means
// the file SAYS "disallow everything" while the ads crawler quietly proceeds,
// and anyone reading it later (including a reviewer looking at why an account
// was flagged) sees a site that appears to be hiding itself. Naming AdsBot and
// allowing it explicitly makes the intent legible and survives someone
// tightening the wildcard rule later.
//
// Tokens per Google's crawler documentation: AdsBot-Google (desktop) and
// AdsBot-Google-Mobile. AdsBot-Google-Mobile-Apps is retired.
const ADSBOT = [
  '# Google Ads checks the landing page before it will run an ad against it.',
  '# AdsBot ignores the wildcard above, but this states the intent plainly:',
  '# the ads crawler is welcome everywhere on this site.',
  'User-agent: AdsBot-Google',
  'Allow: /',
  '',
  'User-agent: AdsBot-Google-Mobile',
  'Allow: /',
  '',
].join('\n')

const robots = INDEXABLE
  ? `User-agent: *\nAllow: /\nDisallow: /booked\n\n${ADSBOT}\nSitemap: ${SITE}/sitemap.xml\n`
  : `# This deployment is a second copy of the booking page published at\n# ecofutures.uk/epcs. It exists to take PAID traffic, which does not need\n# indexing, and two indexable copies of the same content compete with each\n# other in organic search. Set INDEXABLE=true in the environment to open it\n# up. Note this blocks the SEARCH crawler only — see the AdsBot block below.\nUser-agent: *\nDisallow: /\n\n${ADSBOT}`
writeFileSync(join(dist, 'robots.txt'), robots)
console.log(`robots:    ${INDEXABLE ? 'Allow: /' : 'Disallow: / (search)'} · AdsBot allowed`)

// ── sitemap.xml ────────────────────────────────────────────────────────────
// Generated from the same route table that drives pre-rendering, so a new page
// can never be missing from it. Only written when the site is indexable —
// publishing a sitemap for a site that says Disallow is a contradiction.
if (INDEXABLE) {
  const EXCLUDE = new Set(['/booked'])
  const priorityFor = (u) => (u === '/' ? '1.0' : '0.4')
  const today = new Date().toISOString().slice(0, 10)
  const sitemapUrls = routes.filter((u) => !EXCLUDE.has(u))

  const sitemap =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    sitemapUrls
      .map(
        (u) =>
          '  <url>\n' +
          `    <loc>${url(u)}</loc>\n` +
          `    <lastmod>${today}</lastmod>\n` +
          `    <priority>${priorityFor(u)}</priority>\n` +
          '  </url>\n',
      )
      .join('') +
    '</urlset>\n'

  writeFileSync(join(dist, 'sitemap.xml'), sitemap)
  console.log(`sitemap:   ${sitemapUrls.length} urls`)
}
