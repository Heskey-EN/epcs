/**
 * The EPC band ladder: the A–G scale as it appears on a certificate, with the
 * band most older homes sit at (D) and the band the service exists to reach
 * (C) marked.
 *
 * Colours are the conventional EPC scale (A green → G red). That is a
 * deliberate exception to the site palette: people recognise it from their
 * own certificate, and inventing our own colours for a regulated rating would
 * be confusing at best.
 */

// SAP point ranges as published on an EPC.
const BANDS = [
  { band: 'A', range: '92–100', width: 100, bg: '#008054', text: '#fff' },
  { band: 'B', range: '81–91', width: 92, bg: '#19b459', text: '#fff' },
  { band: 'C', range: '69–80', width: 84, bg: '#8dce46', text: '#14200f' },
  { band: 'D', range: '55–68', width: 74, bg: '#ffd500', text: '#241a05' },
  { band: 'E', range: '39–54', width: 64, bg: '#fcaa65', text: '#241a05' },
  { band: 'F', range: '21–38', width: 54, bg: '#ef8023', text: '#fff' },
  { band: 'G', range: '1–20', width: 44, bg: '#e9153b', text: '#fff' },
]

export default function EpcBandLadder({ className = '' }) {
  return (
    <figure
      className={`rounded-2xl border border-line bg-white p-6 text-ink shadow-lift ${className}`}
      aria-labelledby="ladder-caption"
    >
      <figcaption id="ladder-caption" className="mb-5 flex items-baseline justify-between">
        <span className="font-display text-lg font-medium">Energy rating</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
          SAP score
        </span>
      </figcaption>

      <div className="flex flex-col gap-2">
        {BANDS.map((b) => {
          const isTarget = b.band === 'C'
          const isTypical = b.band === 'D'
          return (
            <div key={b.band} className="flex items-center gap-3">
              <div
                className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold ${
                  isTarget ? 'ring-2 ring-navy ring-offset-2 ring-offset-white' : ''
                }`}
                style={{
                  width: `${b.width}%`,
                  backgroundColor: b.bg,
                  color: b.text,
                  opacity: isTarget || isTypical ? 1 : 0.6,
                }}
              >
                <span>
                  {b.band} <span className="font-normal opacity-80">{b.range}</span>
                </span>
              </div>

              {isTarget && (
                <span className="shrink-0 whitespace-nowrap text-xs font-bold uppercase tracking-wider text-navy">
                  Target
                </span>
              )}
              {isTypical && (
                <span className="shrink-0 whitespace-nowrap text-xs font-medium text-ink-faint">
                  Typical older home
                </span>
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-5 border-t border-line pt-4 text-sm leading-relaxed text-ink-soft">
        Most homes built before 1990 sit at D or below. Moving up to C is usually a fabric-first
        job: insulation and draught-proofing before new heating.
      </p>
    </figure>
  )
}
