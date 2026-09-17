// Blog data access, shared by the client and the build-time renderer.
//
// Nothing about the blog is in the main bundle. The booking page is the Google
// Ads landing page and must stay light, so the post index and every post body
// are split into their own chunks and fetched only when someone opens /blog.
//
//   · In the browser, main.jsx calls preloadForPath() BEFORE mounting, so a
//     visitor who lands on /blog/<slug> renders the same markup the crawler
//     was served, with no loading flash.
//   · At build time, src/entry-server.jsx primes the cache with every post
//     synchronously, because renderToString cannot wait for a fetch.
//
// Source of truth: content/blog/*.md, compiled by scripts/build-blog.mjs.

const postLoaders = import.meta.glob('../generated/posts/*.json', { import: 'default' })
const loadIndexModule = () => import('../generated/blog-index.json').then((m) => m.default)

let indexCache = null
const postCache = new Map()

export const BLOG_PATH = '/blog'
export const postPath = (slug) => `${BLOG_PATH}/${slug}`

/** /blog/<slug> → slug, anything else → null. */
export const slugFromPath = (pathname) => {
  const m = /^\/blog\/([a-z0-9-]+)\/?$/.exec(pathname || '')
  return m ? m[1] : null
}

export const getCachedIndex = () => indexCache
export const getCachedPost = (slug) => postCache.get(slug) || null

export async function loadIndex() {
  if (!indexCache) indexCache = await loadIndexModule()
  return indexCache
}

export async function loadPost(slug) {
  if (postCache.has(slug)) return postCache.get(slug)
  const loader = postLoaders[`../generated/posts/${slug}.json`]
  if (!loader) return null
  const post = await loader()
  postCache.set(slug, post)
  return post
}

/** Build-time only: fill the caches so renderToString has everything. */
export function primeBlog(index, posts) {
  indexCache = index
  for (const p of posts) postCache.set(p.slug, p)
}

/** Fetch whatever the page at `pathname` needs before React mounts. */
export async function preloadForPath(pathname) {
  if (!pathname || !pathname.startsWith(BLOG_PATH)) return
  const slug = slugFromPath(pathname)
  await Promise.all([loadIndex(), slug ? loadPost(slug) : null])
}

/** "2026-09-17" → "17 September 2026", fixed to UK time on server and client. */
export const formatDate = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/London',
  })

/** Title/description for a blog URL, or null if it is not a known blog page. */
export function blogMetaFor(pathname) {
  if (pathname === BLOG_PATH || pathname === BLOG_PATH + '/') {
    return {
      title: 'EPC News for Landlords, Sellers & Homeowners | Eco Futures',
      description:
        'EPC rules, landlord deadlines and energy grant news explained by an accredited Domestic Energy Assessor covering Preston, Blackpool and the North West.',
    }
  }
  const slug = slugFromPath(pathname)
  if (!slug) return null
  const meta = (indexCache || []).find((p) => p.slug === slug)
  if (!meta) return null
  const base = meta.seoTitle || meta.title
  const title = base.length <= 50 ? `${base} | Eco Futures` : base
  return { title, description: meta.description }
}
