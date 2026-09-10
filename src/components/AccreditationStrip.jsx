import { useState } from 'react'
import { heldAccreditations } from '../data/accreditations.js'

/**
 * The row of scheme logos ("accredited by…").
 *
 * Renders ONLY schemes flagged `held: true` in src/data/accreditations.js, and
 * renders nothing at all if none are. An empty or half-true trust strip is
 * worse than no trust strip, particularly on a site under Google Ads review.
 *
 * Logos are the schemes' own artwork from public/accreditations/. If a file
 * is missing the entry falls back to a typeset wordmark rather than a broken
 * image, so the strip always looks deliberate.
 */

function Badge({ item }) {
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = item.logo && !imgFailed

  const inner = showImage ? (
    <img
      src={item.logo}
      alt={item.alt || item.name}
      loading="lazy"
      onError={() => setImgFailed(true)}
      className="h-12 w-auto max-w-[170px] object-contain sm:h-14"
    />
  ) : (
    <span className="flex flex-col items-center text-center">
      <span className="font-display text-lg font-medium text-ink">{item.name}</span>
      {item.detail && <span className="mt-0.5 text-xs text-ink-faint">{item.detail}</span>}
    </span>
  )

  if (!item.url) return <div className="flex items-center justify-center">{inner}</div>

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      title={`${item.name} — ${item.detail || 'accreditation'}`}
      className="flex items-center justify-center rounded-lg opacity-90 transition-opacity hover:opacity-100"
    >
      {inner}
    </a>
  )
}

export default function AccreditationStrip({
  heading = 'Accredited, registered and regulated',
  className = '',
}) {
  const items = heldAccreditations()
  if (!items.length) return null

  return (
    <section className={`border-b border-line bg-white ${className}`} aria-label={heading}>
      <div className="container-site flex flex-col items-center gap-6 py-9 md:flex-row md:justify-between md:gap-10 md:py-8">
        <p className="text-center text-sm font-semibold text-ink-soft md:text-left">{heading}</p>
        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 md:gap-x-14">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-center">
              <Badge item={item} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
