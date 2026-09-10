import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Phone, Mail } from 'lucide-react'
import Logo from './Logo.jsx'
import { COMPANY } from '../data/company.js'

/**
 * A one-page site does not need navigation.
 *
 * Every link in a header is a way out of the sale, and this deployment sells
 * exactly one thing. So the header carries the two things a visitor actually
 * uses — the phone number, and a way back to the order form — and nothing else.
 * On the booking page the button scrolls to the form; on the legal pages it
 * returns to it.
 */
export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const onBookingPage = pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const cta = 'btn-primary px-5 py-2.5 text-sm'

  return (
    <header className="sticky top-0 z-50">
      {/* Utility bar — how to reach a human, on every page. */}
      <div className="bg-navy text-[0.82rem] text-white/80">
        <div className="container-site flex h-9 items-center gap-5">
          <a
            href={`tel:${COMPANY.phoneHref}`}
            className="inline-flex items-center gap-1.5 font-medium text-white transition-colors hover:text-green-400"
          >
            <Phone size={13} className="text-green-400" /> {COMPANY.phone}
          </a>
          <a
            href={`mailto:${COMPANY.email}`}
            className="hidden items-center gap-1.5 transition-colors hover:text-white sm:inline-flex"
          >
            <Mail size={13} className="text-green-400" /> {COMPANY.email}
          </a>
        </div>
      </div>

      <div
        className={`border-b bg-white transition-shadow duration-300 ${
          scrolled ? 'border-transparent shadow-header' : 'border-line'
        }`}
      >
        <div className="container-site flex h-[4.75rem] items-center justify-between gap-4 md:h-[5.25rem]">
          <Logo />

          <div className="flex items-center gap-4">
            <a
              href={`tel:${COMPANY.phoneHref}`}
              className="hidden items-center gap-2 text-[0.95rem] font-medium text-ink-soft transition-colors hover:text-ink sm:inline-flex md:hidden lg:inline-flex"
            >
              <Phone size={16} className="text-green-700" /> {COMPANY.phone}
            </a>
            {onBookingPage ? (
              <a href="#order" className={cta}>
                Book an EPC
              </a>
            ) : (
              <Link to="/" className={cta}>
                Book an EPC
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
