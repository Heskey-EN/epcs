// Checks the BUILT site against Google Ads' landing-page requirements.
//
// This exists because the business was flagged for "Compromised Site" and
// "Circumventing systems" on its main domain, and this deployment must not
// repeat whatever caused that. Run it before every deploy:
//
//     npm run build && node scripts/ads-audit.mjs
//
// It reads dist/ — the actual files Vercel will serve — rather than the source,
// because every fault that caused the original problem was a build or hosting
// behaviour, not a line of JSX.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const dist = join(process.cwd(), 'dist')
const results = []
const check = (name, pass, detail, policy) => results.push({ name, pass, detail, policy })

const read = (p) => (existsSync(join(dist, p)) ? readFileSync(join(dist, p), 'utf8') : null)
const textOf = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const home = read('index.html')
if (!home) {
  console.error('No dist/index.html — run `npm run build` first.')
  process.exit(1)
}
const homeText = textOf(home)

/* 1. Destination works — every route we claim has a real file behind it. */
const routes = ['/', '/booked', '/cancellation-form', '/privacy', '/cookies', '/terms']
const missing = routes.filter((r) => !read(r === '/' ? 'index.html' : `${r}/index.html`))
check(
  'Every route has a real page',
  missing.length === 0,
  missing.length ? `missing: ${missing.join(', ')}` : `${routes.length} routes present`,
  'Destination requirements — destination not working',
)

/* 2. A real 404 exists, so unknown URLs cannot answer 200 with a full page.
   This is the exact fault that made the main site look compromised: the
   catch-all rewrite served the homepage at /wp-login.php, /shell.php, /.env. */
const notFound = read('404.html')
check(
  'A real 404 document exists',
  !!notFound,
  notFound ? 'dist/404.html present — Vercel serves it with a 404 status' : 'MISSING',
  'Compromised Site / soft 404',
)

/* 3. No catch-all rewrite in vercel.json. Adding one silently reintroduces
   the soft-404 behaviour above. */
const vercelJson = existsSync('vercel.json') ? readFileSync('vercel.json', 'utf8') : '{}'
const hasRewrite = /"rewrites"|"routes"/.test(vercelJson)
check(
  'No catch-all rewrite',
  !hasRewrite,
  hasRewrite ? 'vercel.json declares rewrites/routes — CHECK THIS' : 'vercel.json has no rewrites',
  'Compromised Site / soft 404',
)

/* 4. AdsBot can crawl. Google must fetch the landing page to check it matches
   the ad; an uncrawlable destination is a disapproval. AdsBot ignores the
   wildcard, so what matters is that it is not explicitly disallowed. */
const robots = read('robots.txt') || ''
const adsbotBlocked = /User-agent:\s*AdsBot[^\n]*\n(?:[^\n]*\n)*?Disallow:\s*\/\s*$/im.test(robots)
const adsbotNamed = /User-agent:\s*AdsBot-Google\b/i.test(robots)
check(
  'AdsBot is allowed to crawl',
  adsbotNamed && !adsbotBlocked,
  adsbotBlocked
    ? 'AdsBot is DISALLOWED — ads will be disapproved as uncrawlable'
    : adsbotNamed
      ? 'AdsBot-Google and AdsBot-Google-Mobile explicitly allowed'
      : 'AdsBot not named (it ignores the wildcard, so it still crawls — but be explicit)',
  'Destination requirements — crawlability',
)

/* 5. No cloaking. The pre-rendered HTML a crawler reads must be the same page
   a visitor sees. Pre-rendering guarantees this by construction — the check is
   that the crawler is not being handed an empty shell. */
const emptyShell = /<div id="root">\s*<\/div>/.test(home)
check(
  'Crawler sees the real page, not a shell',
  !emptyShell && homeText.length > 2000,
  emptyShell ? 'EMPTY #root — crawler gets a blank page' : `${homeText.split(' ').length} words rendered in the HTML`,
  'Circumventing systems — cloaking',
)

/* 6. Substantive original content. */
const words = homeText.split(' ').length
check(
  'Substantive content on the landing page',
  words >= 500,
  `${words} words`,
  'Destination requirements — insufficient original content',
)

/* 7. Business identity. A previously flagged advertiser needs to be obviously,
   verifiably real: legal entity, company number, a geographic address, a phone
   number and an email, all on the landing page itself. */
const identity = {
  'legal entity name': /ECOFUTURESGB LTD/i,
  'company number': /15782816/,
  'registered office': /49 Whitegate Drive/i,
  'phone number': /07359\s?069886/,
  'email address': /info@ecofutures\.uk/i,
}
for (const [label, re] of Object.entries(identity)) {
  check(`Identity: ${label}`, re.test(homeText), re.test(homeText) ? 'on the landing page' : 'NOT FOUND', 'Misrepresentation — business identity')
}

/* 8. Price transparency. The full cost rule must be on the page, not just a
   "from" figure — Google disapproves landing pages that hide part of the cost,
   and it was one of the things we fixed on the main site. */
const priceBits = {
  'base price': /£65/,
  'per-extra-bedroom rule': /£5 (?:for|per) each extra bedroom|£5 per extra bedroom|£5 for each extra bedroom/i,
  'no hidden cost statement': /no deposit and nothing to pay afterwards/i,
  'refund promise': /refund/i,
}
for (const [label, re] of Object.entries(priceBits)) {
  check(`Pricing: ${label}`, re.test(homeText), re.test(homeText) ? 'stated' : 'NOT FOUND', 'Misrepresentation — unclear pricing')
}

/* 9. Substantiated claims. Accreditation is asserted, so the scheme and the
   assessor number must both be visible for anyone to check. */
check(
  'Accreditation claim is checkable',
  /Elmhurst/i.test(homeText) && /EES\/035222/.test(homeText),
  'scheme and assessor number both shown',
  'Misrepresentation — unsubstantiated claims',
)

/* 10. The legal documents a page taking money must carry, and links to them. */
for (const [label, path] of [
  ['Privacy Policy', '/privacy'],
  ['Cookie Policy', '/cookies'],
  ['Terms', '/terms'],
  ['Cancellation form', '/cancellation-form'],
]) {
  const linked = new RegExp(`href="${path}"`).test(home)
  check(`Linked from the landing page: ${label}`, linked, linked ? path : `no link to ${path}`, 'Data collection / consumer law')
}

/* 11. Nothing that auto-downloads or hijacks the visitor. */
const nasties = {
  'auto-download link': /<a[^>]+download[^>]*>/i,
  'window.open popup': /window\.open\s*\(/,
  'meta refresh redirect': /<meta[^>]+http-equiv=["']refresh/i,
}
for (const [label, re] of Object.entries(nasties)) {
  check(`No ${label}`, !re.test(home), re.test(home) ? 'FOUND — remove it' : 'clean', 'Destination requirements — abusive experience')
}

/* 12. No hardcoded foreign host. Every URL in the output should be this
   deployment's own origin; a stray ecofutures.uk canonical would point the ad's
   destination at the flagged domain. */
const foreignHost = (homeText.match(/ecofutures\.uk/g) || []).length
const canonical = (home.match(/<link rel="canonical" href="([^"]+)"/) || [])[1] || ''
check(
  'Canonical points at this deployment',
  !!canonical && !/ecofutures\.uk/.test(canonical),
  `canonical = ${canonical || 'MISSING'}${foreignHost ? ` · ${foreignHost} textual mention(s) of ecofutures.uk (the email address is fine)` : ''}`,
  'Destination requirements — URL mismatch',
)

/* 13. Every route carries a title and description a reviewer can read. */
const thinMeta = routes.filter((r) => {
  const html = read(r === '/' ? 'index.html' : `${r}/index.html`) || ''
  return !/<title>[^<]{10,}<\/title>/.test(html) || !/<meta name="description" content="[^"]{30,}"/.test(html)
})
check('Every route has a real title and description', thinMeta.length === 0, thinMeta.length ? `thin: ${thinMeta.join(', ')}` : 'all routes', 'Destination requirements')

/* 14. Nothing enormous that would make the page feel broken on mobile data. */
const bytes = (d) =>
  readdirSync(d, { withFileTypes: true }).reduce(
    (n, e) => n + (e.isDirectory() ? bytes(join(d, e.name)) : statSync(join(d, e.name)).size),
    0,
  )
const assetKb = Math.round(bytes(join(dist, 'assets')) / 1024)
check('Bundle is a sensible size', assetKb < 1024, `${assetKb} KB of JS and CSS`, 'Destination requirements — user experience')

/* ── report ─────────────────────────────────────────────────────────────── */
const failed = results.filter((r) => !r.pass)
const pad = Math.max(...results.map((r) => r.name.length))
console.log('\nGoogle Ads landing-page audit\n' + '─'.repeat(pad + 34))
for (const r of results) {
  console.log(`${r.pass ? ' PASS' : ' FAIL'}  ${r.name.padEnd(pad)}  ${r.detail}`)
}
console.log('─'.repeat(pad + 34))
if (failed.length) {
  console.log(`\n${failed.length} FAILED:\n`)
  for (const f of failed) console.log(`  · ${f.name}\n      ${f.detail}\n      policy: ${f.policy}\n`)
  process.exit(1)
}
console.log(`\nAll ${results.length} checks passed.\n`)
