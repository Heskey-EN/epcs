import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import JsonLd from '../components/JsonLd.jsx'
import BlogCta from '../components/BlogCta.jsx'
import { graph, baseNodes, webPageNode, breadcrumbNode, blogNode } from '../data/schema.js'
import { blogMetaFor, formatDate, getCachedIndex, loadIndex, postPath } from '../lib/blog.js'

// The latest posts get full cards; everything older is still linked from the
// archive list below them, so every post stays one click from /blog.
const FEATURED = 24

export default function BlogIndex() {
  const [posts, setPosts] = useState(getCachedIndex())

  useEffect(() => {
    if (!posts) loadIndex().then(setPosts).catch(() => setPosts([]))
  }, [posts])

  const meta = blogMetaFor('/blog')
  const jsonLd = graph(
    baseNodes(),
    webPageNode({ path: '/blog', title: meta.title, description: meta.description }),
    breadcrumbNode({
      path: '/blog',
      trail: [
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
      ],
    }),
    blogNode(),
  )

  const featured = (posts || []).slice(0, FEATURED)
  const archive = (posts || []).slice(FEATURED)

  return (
    <>
      <PageHeader
        compact
        kicker="Eco Futures blog"
        title="EPC news for landlords, sellers and homeowners"
        intro="The rule changes, deadlines and grants that affect your EPC, explained in plain English by an accredited Domestic Energy Assessor based in Lancashire."
        crumbs={[{ name: 'Home', path: '/' }, { name: 'Blog' }]}
      />

      <section className="container-site py-14 md:py-20">
        {!posts && <p className="text-ink-soft">Loading articles…</p>}
        {posts && posts.length === 0 && <p className="text-ink-soft">The first articles are on their way.</p>}

        {featured.length > 0 && (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <li key={p.slug} className="card card-hover flex flex-col p-6">
                <p className="kicker">{p.categoryLabel}</p>
                <h2 className="mt-3 font-display text-xl font-medium leading-snug text-ink">
                  <Link to={postPath(p.slug)} className="hover:text-green-700">
                    {p.title}
                  </Link>
                </h2>
                <p className="mt-3 flex-1 text-[0.95rem] leading-relaxed text-ink-soft">{p.description}</p>
                <div className="mt-5 flex items-center justify-between text-sm text-ink-faint">
                  <time dateTime={p.date}>{formatDate(p.date)}</time>
                  <Link to={postPath(p.slug)} className="link-arrow text-sm" aria-label={`Read: ${p.title}`}>
                    Read <ArrowRight size={14} />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}

        {archive.length > 0 && (
          <div className="mt-16">
            <h2 className="h-section">Earlier articles</h2>
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {archive.map((p) => (
                <li key={p.slug} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-6">
                  <time dateTime={p.date} className="w-40 shrink-0 text-sm text-ink-faint">
                    {formatDate(p.date)}
                  </time>
                  <Link to={postPath(p.slug)} className="font-medium text-ink hover:text-green-700">
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <BlogCta />
      </section>

      <JsonLd data={jsonLd} />
    </>
  )
}
