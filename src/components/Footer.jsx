import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, ArrowUpRight } from 'lucide-react'
import Logo from './Logo.jsx'
import { COMPANY, isPlaceholder } from '../data/company.js'
import { IMAGES } from '../data/images.js'
import { heldAccreditations } from '../data/accreditations.js'
import { COOKIE_SETTINGS_EVENT } from './CookieBanner.jsx'

const GOV_EPC_SEARCH =
  'https://find-energy-certificate.service.gov.uk/find-a-certificate/search-by-postcode?lang=en&property_type=domestic'
const GOV_ADVICE = 'https://www.gov.uk/improve-energy-efficiency'

// Outbound only. There is no site map to print here — this deployment is the
// booking page plus the documents the law requires beside it, and those are in
// the legal strip below.
const usefulLinks = [
  { label: 'Find an existing EPC', href: GOV_EPC_SEARCH },
  { label: 'Government energy advice', href: GOV_ADVICE },
  { label: 'Elmhurst Energy', href: 'https://www.elmhurstenergy.co.uk/' },
  { label: 'TrustMark', href: 'https://www.trustmark.org.uk/' },
]

/**
 * The footer uses the same treatment as the page header — a photograph under a
 * deep navy wash — with the brand green for headings and icons, so it reads as
 * part of the same page rather than a block bolted on the end.
 *
 * It also carries the trading disclosures the Companies (Trading Disclosures)
 * Regulations 2015 require on a business website: legal name, registered
 * number, place of registration and registered office.
 */
export default function Footer() {
  const openCookieSettings = () => window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))
  const held = heldAccreditations()

  return (
    <footer className="relative overflow-hidden bg-navy text-white">
      <img
        src={IMAGES.footer.src}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-navy/[0.88]" />
      <div className="absolute inset-x-0 top-0 h-px bg-green-400/60" />

      <div className="container-site relative">
        {/* Contact row */}
        <div className="flex flex-col gap-6 border-b border-white/10 py-12 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-medium leading-snug md:text-3xl">
              Rather book over the phone?
            </h2>
            <p className="mt-2 text-white/70">Accredited assessors covering {COMPANY.area}.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={`tel:${COMPANY.phoneHref}`} className="btn-primary">
              <Phone size={17} /> {COMPANY.phone}
            </a>
            <a href={`mailto:${COMPANY.email}`} className="btn-ghost-light">
              <Mail size={16} /> Email us
            </a>
          </div>
        </div>

        {/* Columns */}
        <div className="grid gap-12 py-14 md:grid-cols-[1.6fr_1fr] lg:gap-16">
          <div>
            <Logo variant="dark" className="h-16" />
            <p className="mt-6 max-w-sm text-[0.95rem] leading-relaxed text-white/75">
              Accredited domestic energy assessments across {COMPANY.area}. Certificates lodged on
              the national register and the link emailed to you.
            </p>
            {held.length > 0 && (
              <p className="mt-4 text-sm text-green-400">
                {held.map((a) => a.name).join(' · ')}
                {COMPANY.assessorNumber && ` · Assessor ${COMPANY.assessorNumber}`}
              </p>
            )}
            <ul className="mt-6 space-y-2.5 text-[0.95rem] text-white/85">
              <li>
                <a
                  className="inline-flex items-center gap-2.5 transition-colors hover:text-white"
                  href={`tel:${COMPANY.phoneHref}`}
                >
                  <Phone size={15} className="text-green-400" /> {COMPANY.phone}
                </a>
              </li>
              <li>
                <a
                  className="inline-flex items-center gap-2.5 transition-colors hover:text-white"
                  href={`mailto:${COMPANY.email}`}
                >
                  <Mail size={15} className="text-green-400" /> {COMPANY.email}
                </a>
              </li>
              <li className="inline-flex items-start gap-2.5">
                <MapPin size={15} className="mt-1 shrink-0 text-green-400" />
                <span>{COMPANY.area}</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-green-400">Useful links</h3>
            <ul className="mt-5 space-y-3 text-[0.95rem] text-white/75">
              {usefulLinks.map((l) => (
                <li key={l.label}>
                  <a
                    className="inline-flex items-center gap-1 transition-colors hover:text-white"
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {l.label} <ArrowUpRight size={13} className="opacity-60" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Legal strip */}
      <div className="relative border-t border-white/10 bg-navy/60">
        <div className="container-site py-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xl space-y-1 text-[0.8rem] leading-relaxed text-white/55">
              {/* Unfilled details are omitted rather than printed as a
                  placeholder. Fill them in src/data/company.js. */}
              <p className="font-semibold text-white/70">
                {COMPANY.tradingName} is a trading name of {COMPANY.legalName}
              </p>
              {COMPANY.isLtd && !isPlaceholder(COMPANY.companyNumber) && (
                <p>
                  Registered in {COMPANY.placeOfRegistration} · Company no. {COMPANY.companyNumber}
                </p>
              )}
              {!isPlaceholder(COMPANY.registeredOffice) && (
                <p>
                  {COMPANY.isLtd ? 'Registered office' : 'Business address'}:{' '}
                  {COMPANY.registeredOffice}
                </p>
              )}
              {COMPANY.vatNumber && <p>VAT no. {COMPANY.vatNumber}</p>}
            </div>
            <nav className="flex flex-wrap gap-x-5 gap-y-2 text-[0.8rem] font-medium text-white/65">
              <Link to="/privacy" className="transition-colors hover:text-white">
                Privacy Policy
              </Link>
              <Link to="/cookies" className="transition-colors hover:text-white">
                Cookie Policy
              </Link>
              <Link to="/terms" className="transition-colors hover:text-white">
                Terms of Use
              </Link>
              <Link to="/cancellation-form" className="transition-colors hover:text-white">
                Cancellation form
              </Link>
              <button
                type="button"
                onClick={openCookieSettings}
                className="transition-colors hover:text-white"
              >
                Cookie settings
              </button>
            </nav>
          </div>
          <p className="mt-5 text-[0.8rem] text-white/50">
            © {new Date().getFullYear()} {COMPANY.legalName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
