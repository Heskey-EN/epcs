import { Link } from 'react-router-dom'
import { Phone } from 'lucide-react'
import { COMPANY } from '../data/company.js'

/**
 * The one call to action at the foot of every blog page. No price is quoted
 * here on purpose: the price lives on the booking page and in api/checkout.js,
 * and a figure copied into a blog component is a figure that goes stale.
 */
export default function BlogCta() {
  return (
    <aside className="bg-brand-panel mt-14 rounded-2xl px-6 py-9 text-white md:px-10">
      <p className="kicker text-green-400">Need an EPC?</p>
      <h2 className="mt-3 font-display text-2xl font-medium leading-snug md:text-3xl">
        Book an accredited EPC online
      </h2>
      <p className="mt-3 max-w-xl text-white/80">
        Fixed price, paid upfront, lodged on the national register. We cover homes within 40 miles of
        Preston, including Blackpool, Lancaster, Wigan, Bolton and Manchester.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/" className="btn-light">
          See prices and book
        </Link>
        <a href={`tel:${COMPANY.phoneHref}`} className="btn-ghost-light">
          <Phone size={16} /> {COMPANY.phone}
        </a>
      </div>
    </aside>
  )
}
