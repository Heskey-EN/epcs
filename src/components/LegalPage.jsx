import PageHeader from './PageHeader.jsx'
import { COMPANY } from '../data/company.js'

// Shared shell for the legal pages: page header + prose body (styled by
// the .prose-legal rules in index.css).
export default function LegalPage({
  kicker = 'Legal',
  title,
  intro,
  updated = COMPANY.lastUpdated,
  children,
}) {
  return (
    <>
      <PageHeader
        compact
        kicker={kicker}
        title={title}
        intro={intro}
        crumbs={[{ name: 'Home', path: '/' }, { name: title }]}
      >
        <p className="text-sm text-white/60">Last updated: {updated}</p>
      </PageHeader>

      <section className="container-site py-14 md:py-20">
        <div className="prose-legal max-w-prose">{children}</div>
      </section>
    </>
  )
}
