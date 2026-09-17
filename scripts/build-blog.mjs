// Build step 0: compile the blog from content/blog/*.md into JSON the app
// imports. Runs before `vite build` so both the client and the SSR bundle see
// the same posts.
//
//   content/blog/<slug>.md            one post: YAML front matter + Markdown
//   src/generated/blog-index.json     metadata for every post, newest first
//   src/generated/posts/<slug>.json   one post, body already rendered to HTML
//
// src/generated/ is gitignored — the Markdown is the source of truth.
//
// The checks below FAIL THE BUILD rather than publish a weak or broken post.
// Posts are published unattended, so this file is the editor: a post with no
// source, a description Google will truncate, or a date in the future never
// reaches the live site. The rules are documented in docs/blog/PLAYBOOK.md.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { marked } from 'marked'

const root = resolve(process.cwd())
const contentDir = join(root, 'content', 'blog')
const outDir = join(root, 'src', 'generated')
const postsOut = join(outDir, 'posts')

export const CATEGORIES = {
  landlords: 'Landlords & lettings',
  grants: 'Grants & funding',
  'buying-selling': 'Buying & selling',
  guides: 'EPC guides',
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

// Today in the UK, as YYYY-MM-DD. Vercel builds in UTC; a post dated today
// must not be rejected as "future" in the hour after UK midnight.
const ukToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date())

/** "2026-09-17" → "2026-09-17T07:00:00+01:00" (the UK offset on that day). */
const ukTimestamp = (date) => {
  const probe = new Date(`${date}T12:00:00Z`)
  const name = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', timeZoneName: 'longOffset' })
    .formatToParts(probe)
    .find((p) => p.type === 'timeZoneName').value // "GMT+01:00" or "GMT"
  const offset = name === 'GMT' ? '+00:00' : name.replace('GMT', '')
  return `${date}T07:00:00${offset}`
}

const toDateString = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? '').trim())

const wordsIn = (s) => (s.replace(/<[^>]+>/g, ' ').match(/[A-Za-z0-9£%'’-]+/g) || []).length

const errors = []
const fail = (file, msg) => errors.push(`${file}: ${msg}`)

const files = existsSync(contentDir)
  ? readdirSync(contentDir).filter((f) => f.endsWith('.md') && !f.startsWith('_'))
  : []

const posts = []

for (const file of files) {
  const slug = file.replace(/\.md$/, '')
  const raw = readFileSync(join(contentDir, file), 'utf8').replace(/\r\n/g, '\n')
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!m) {
    fail(file, 'no YAML front matter (--- … ---) at the top')
    continue
  }

  let fm
  try {
    fm = parseYaml(m[1]) || {}
  } catch (e) {
    fail(file, `front matter is not valid YAML: ${e.message}`)
    continue
  }
  const body = m[2].trim()

  if (!SLUG.test(slug)) fail(file, 'file name must be lowercase-words-with-hyphens.md')

  // `title` is the H1 on the page. `seoTitle` is the <title> Google shows, and
  // is required whenever the H1 is too long to survive in a results page.
  const title = String(fm.title ?? '').trim()
  if (title.length < 20 || title.length > 110) fail(file, `title must be 20–110 characters (is ${title.length})`)
  const seoTitle = String(fm.seoTitle ?? '').trim() || null
  if (seoTitle && (seoTitle.length < 20 || seoTitle.length > 60))
    fail(file, `seoTitle must be 20–60 characters (is ${seoTitle.length})`)
  if (!seoTitle && title.length > 60) fail(file, `title is ${title.length} characters — add a seoTitle of 60 or fewer`)

  const description = String(fm.description ?? '').trim()
  if (description.length < 70 || description.length > 160)
    fail(file, `description must be 70–160 characters (is ${description.length})`)

  const date = toDateString(fm.date)
  if (!ISO_DATE.test(date)) fail(file, 'date must be YYYY-MM-DD')
  else if (date > ukToday) fail(file, `date ${date} is in the future (UK today is ${ukToday})`)

  const updated = fm.updated ? toDateString(fm.updated) : null
  if (updated && (!ISO_DATE.test(updated) || updated < date)) fail(file, 'updated must be YYYY-MM-DD and not before date')

  if (!CATEGORIES[fm.category]) fail(file, `category must be one of: ${Object.keys(CATEGORIES).join(', ')}`)

  const summary = Array.isArray(fm.summary) ? fm.summary.map((s) => String(s).trim()).filter(Boolean) : []
  if (summary.length < 2 || summary.length > 5) fail(file, 'summary must list 2–5 key points')

  const keywords = Array.isArray(fm.keywords) ? fm.keywords.map((k) => String(k).trim()).filter(Boolean) : []

  // Every post credits where its facts came from. No source, no post.
  const sources = Array.isArray(fm.sources) ? fm.sources : []
  if (sources.length === 0) fail(file, 'at least one source is required')
  const cleanSources = sources.map((s, i) => {
    const src = {
      title: String(s?.title ?? '').trim(),
      publisher: String(s?.publisher ?? '').trim(),
      url: String(s?.url ?? '').trim(),
      date: s?.date ? toDateString(s.date) : null,
    }
    if (!src.title || !src.publisher) fail(file, `source ${i + 1} needs a title and a publisher`)
    if (!/^https:\/\/[^\s]+$/.test(src.url)) fail(file, `source ${i + 1} needs an https:// url`)
    return src
  })

  // The body is our own writing. Anything that could run code or embed a third
  // party's page is refused outright.
  if (/<\s*(script|iframe|object|embed|form|style)\b/i.test(body)) fail(file, 'body contains a disallowed HTML tag')
  if (/^#\s/m.test(body)) fail(file, 'body must not contain an H1 (#) — the title is the H1; start sections at ##')

  const words = wordsIn(body)
  if (words < 400) fail(file, `body is ${words} words — minimum is 400`)

  let html = marked.parse(body, { gfm: true, breaks: false })
  // Outbound links open in a new tab; the reader keeps their place here.
  html = html.replace(/<a href="(https?:\/\/[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener"')

  posts.push({
    slug,
    path: `/blog/${slug}`,
    title,
    seoTitle: seoTitle || title,
    description,
    date,
    updated,
    publishedAt: ISO_DATE.test(date) ? ukTimestamp(date) : null,
    modifiedAt: updated ? ukTimestamp(updated) : ISO_DATE.test(date) ? ukTimestamp(date) : null,
    category: fm.category,
    categoryLabel: CATEGORIES[fm.category] || '',
    keywords,
    summary,
    readingMinutes: Math.max(1, Math.round(words / 220)),
    words,
    sources: cleanSources,
    html,
  })
}

if (errors.length) {
  console.error(`\nblog: ${errors.length} problem(s) — failing the build:\n`)
  for (const e of errors) console.error('  · ' + e)
  console.error('')
  process.exit(1)
}

posts.sort((a, b) => (a.date === b.date ? a.title.localeCompare(b.title) : a.date < b.date ? 1 : -1))

rmSync(outDir, { recursive: true, force: true })
mkdirSync(postsOut, { recursive: true })

const index = posts.map(({ html, sources, summary, words, ...meta }) => meta)
writeFileSync(join(outDir, 'blog-index.json'), JSON.stringify(index))
for (const p of posts) writeFileSync(join(postsOut, `${p.slug}.json`), JSON.stringify(p))

console.log(`blog:      ${posts.length} post(s) compiled · UK today ${ukToday}`)
