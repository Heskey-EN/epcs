import { Link } from 'react-router-dom'

/**
 * The band at the top of every inner page: title, short intro, optional
 * breadcrumb and call-to-action, on the brand gradient. Pass `image` (a URL)
 * and the gradient becomes a darkened photograph instead.
 *
 * `aside` renders a second column on the right (e.g. the EPC order card).
 */
export default function PageHeader({
  crumbs,
  kicker,
  title,
  intro,
  children,
  aside,
  image,
  compact = false,
}) {
  return (
    <section
      className={`relative overflow-hidden text-white ${image ? '' : 'bg-brand-panel'}`}
      aria-labelledby="page-title"
    >
      {image && (
        <>
          <img
            src={image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
          <div className="bg-photo-overlay absolute inset-0" />
        </>
      )}

      <div
        className={`container-site relative ${
          aside ? 'grid items-start gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16' : ''
        } ${compact ? 'py-12 md:py-16' : 'py-16 md:py-24'}`}
      >
        <div className="max-w-2xl">
          {crumbs && (
            <nav aria-label="Breadcrumb" className="mb-5 text-sm text-white/60">
              {crumbs.map((c, i) => (
                <span key={c.path || c.name}>
                  {i > 0 && <span className="mx-2">/</span>}
                  {c.path && i < crumbs.length - 1 ? (
                    <Link to={c.path} className="hover:text-white">
                      {c.name}
                    </Link>
                  ) : (
                    <span className="text-white/85">{c.name}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          {kicker && <p className="kicker mb-4 text-green-400">{kicker}</p>}
          <h1 id="page-title" className="h-page">
            {title}
          </h1>
          {intro && (
            <div className="mt-5 space-y-3 text-lg leading-relaxed text-white/80">
              {Array.isArray(intro) ? intro.map((p, i) => <p key={i}>{p}</p>) : <p>{intro}</p>}
            </div>
          )}
          {children && <div className="mt-8">{children}</div>}
        </div>
        {aside}
      </div>
    </section>
  )
}
