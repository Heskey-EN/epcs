import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Cookie } from 'lucide-react'
import { getConsent, setConsent } from '../lib/analytics.js'

// Fire this event anywhere to reopen the banner (e.g. the footer "Cookie
// settings" button): window.dispatchEvent(new Event('cookie:settings'))
export const COOKIE_SETTINGS_EVENT = 'cookie:settings'

export default function CookieBanner() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Show on first visit (no choice recorded yet).
    if (getConsent() === null) setOpen(true)
    const reopen = () => setOpen(true)
    window.addEventListener(COOKIE_SETTINGS_EVENT, reopen)
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, reopen)
  }, [])

  if (!open) return null

  const choose = (value) => {
    setConsent(value)
    setOpen(false)
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl rounded-2xl border border-line bg-white p-4 text-ink shadow-lift sm:inset-x-auto sm:left-5 sm:right-auto sm:p-6"
    >
      {/* On a phone this banner sits on top of the order form — the postcode
          field, the bedroom picker and the pay button all end up behind it.
          That is both a conversion problem and, to a landing-page reviewer,
          a page that is frustrating to navigate. So the long explanation is
          desktop-only: mobile gets one sentence and the two buttons, with the
          detail one tap away in the Cookie Policy. The choice offered is
          identical on both, which is what consent actually requires. */}
      <div className="flex items-start gap-3.5">
        <span className="mt-0.5 hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700 sm:flex">
          <Cookie size={18} />
        </span>
        <div>
          <h2 id="cookie-title" className="font-display text-base font-medium sm:text-lg">
            We value your privacy
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            <span className="sm:hidden">
              We use essential cookies to make the site work, and — only if you agree — Google
              Analytics and Ads measurement.{' '}
            </span>
            <span className="hidden sm:inline">
              We use essential cookies to make the site work. With your consent we would also like
              to use Google Analytics to understand how the site is used, and Google Ads measurement
              to see whether our adverts lead to bookings. You can change this at any time.{' '}
            </span>
            See our{' '}
            <Link to="/cookies" className="font-medium text-green-700 underline underline-offset-2">
              Cookie Policy
            </Link>
            .
          </p>
          {/* Equal-prominence choices (ICO: reject must be as easy as accept) */}
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:mt-4">
            <button
              type="button"
              onClick={() => choose('granted')}
              className="btn-primary px-4 py-2.5 text-sm"
            >
              Accept all
            </button>
            <button
              type="button"
              onClick={() => choose('denied')}
              className="btn-outline px-4 py-2.5 text-sm"
            >
              Reject non-essential
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
