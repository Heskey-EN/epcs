import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import JsonLd from '../components/JsonLd.jsx'
import BlogCta from '../components/BlogCta.jsx'
import NotFound from './NotFound.jsx'
import { COMPANY } from '../data/company.js'
import { graph, baseNodes, webPageNode, breadcrumbNode, blogNode, blogPostingNode } from '../data/schema.js'
import { formatDate, getCachedIndex, getCachedPost, loadIndex, loadPost, postPath } from '../lib/blog.js'

export default function BlogPost() {
  const { slug } = useParams()
  const [post, setPost] = useState(() => getCachedPost(slug))
  const [index, setIndex] = useState(getCachedIndex())
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    let live = true
    setMissing(false)
    setPost(getCachedPost(slug))
    loadPost(slug)
      .then((p) => {
        if (!live) return
        if (p) setPost(p)
        else setMissing(true)
      })
      .catch(() => live && setMissing(true))
    if (!getCachedIndex()) loadIndex().then((i) => live && setIndex(i)).catch(() => {})
    return () => {
      live = false
    }
  }, [slug])

  // Titles are set by the Layout from metaFor(); once a post arrives after a
  // client-side navigation, set them here as well.
  useEffect(() => {
    if (!post || typeof document === 'undefined') return
    const base = post.seoTitle || post.title
    document.title = base.length <= 50 ? `${base} | ${COMPANY.tradingName}` : base
    const tag = document.querySelector('meta[name="description"]')
    if (tag) tag.setAttribute('content', post.description)
  }, [post])

  if (missing) return <NotFound />
  if (!post) {
    return (
      <section className="container-site min-h-[50vh] py-24">
        <p className="text-ink-soft">Loading article…</p>
      </section>
    )
  }

  const related = (index || [])
    .filter((p) => p.slug !== post.slug)
    .sort((a, b) => (a.category === post.category) === (b.category === post.category) ? 0 : a.category === post.category ? -1 : 1)
    .slice(0, 3)

  const jsonLd = graph(
    baseNodes(),
    webPageNode({ path: post.path, title: post.title, description: post.description }),
    breadcrumbNode({
      path: post.path,
      trail: [
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
        { name: post.title, path: post.path },
      ],
    }),
    blogNode(),
    blogPostingNode(post),
  )

  return (
    <>
      <PageHeader
        compact
        kicker={post.categoryLabel}
        title={post.title}
        titleClassName="font-display text-3xl font-medium leading-[1.12] tracking-tight text-white md:text-4xl lg:text-[2.75rem]"
        crumbs={[{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }, { name: post.title }]}
      >
        <p className="text-sm text-white/70">
          By {COMPANY.tradingName} · <time dateTime={post.publishedAt}>{formatDate(post.date)}</time>
          {post.updated && (
            <>
              {' '}
              · Updated <time dateTime={post.modifiedAt}>{formatDate(post.updated)}</time>
            </>
          )}{' '}
          · {post.readingMinutes} min read
        </p>
      </PageHeader>

      <article className="container-site py-12 md:py-16">
        <div className="max-w-prose">
          <div className="rounded-xl border border-green-200 bg-green-50 px-6 py-5">
            <h2 className="font-display text-lg font-medium text-ink">In short</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[0.98rem] leading-relaxed text-ink-soft">
              {post.summary.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>

          <div className="prose-blog mt-10" dangerouslySetInnerHTML={{ __html: post.html }} />

          <section aria-labelledby="sources" className="mt-12 border-t border-line pt-8">
            <h2 id="sources" className="font-display text-xl font-medium text-ink">
              Sources
            </h2>
            <ol className="mt-4 list-decimal space-y-2.5 pl-5 text-[0.95rem] leading-relaxed text-ink-soft">
              {post.sources.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-baseline gap-1 font-medium text-green-700 underline underline-offset-2 hover:text-green-800"
                  >
                    {s.title} <ExternalLink size={12} className="self-center" />
                  </a>
                  <span>
                    {' '}
                    — {s.publisher}
                    {s.date ? `, ${formatDate(s.date)}` : ''}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-sm leading-relaxed text-ink-faint">
              This article summarises the sources above in our own words and explains what they mean
              for property owners in the North West. It was researched and drafted with the help of AI
              tools and checked against the original sources. It is general information, not legal or
              financial advice — check official guidance before acting. {COMPANY.tradingName} is the
              trading name of {COMPANY.legalName}; our assessor is accredited with{' '}
              {COMPANY.accreditationScheme} ({COMPANY.assessorNumber}).
            </p>
          </section>

          {related.length > 0 && (
            <section aria-labelledby="related" className="mt-12">
              <h2 id="related" className="font-display text-xl font-medium text-ink">
                More from the blog
              </h2>
              <ul className="mt-4 space-y-3">
                {related.map((p) => (
                  <li key={p.slug}>
                    <Link to={postPath(p.slug)} className="font-medium text-green-700 hover:text-green-800">
                      {p.title}
                    </Link>
                    <span className="text-sm text-ink-faint"> · {formatDate(p.date)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5">
                <Link to="/blog" className="link-arrow">
                  All articles
                </Link>
              </p>
            </section>
          )}

          <BlogCta />
        </div>
      </article>

      <JsonLd data={jsonLd} />
    </>
  )
}
