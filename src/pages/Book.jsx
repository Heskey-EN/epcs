import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  FileCheck2,
  Scale,
  CalendarClock,
  Ruler,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  MapPin,
  Minus,
  Plus,
} from 'lucide-react'
import { COMPANY } from '../data/company.js'
import {
  COVERAGE,
  coverageLabel,
  coverageTowns,
  outcodeOf,
  fallbackCoverage,
  describeCoverage,
  validHouse,
  HOUSE_MAX,
} from '../data/coverage.js'
import { trackEvent } from '../lib/analytics.js'
import { IMAGES } from '../data/images.js'
import PageHeader from '../components/PageHeader.jsx'
import AccreditationStrip from '../components/AccreditationStrip.jsx'
import EpcBandLadder from '../components/EpcBandLadder.jsx'
import JsonLd from '../components/JsonLd.jsx'
import { graph, baseNodes, webPageNode, breadcrumbNode, serviceNode } from '../data/schema.js'
import { SITE } from '../data/site.js'
import { metaFor } from '../data/routeMeta.js'

/**
 * / — the paid-traffic landing page for "buy an EPC", and the whole site.
 *
 * This page is the destination of the Google Ads campaign, so it has to do
 * exactly what the ad promises, immediately and without a gate:
 *   · the full price is stated up front and is the price actually charged
 *     (no deposit, no undisclosed "final fee")
 *   · the buy button is NEVER disabled — an out-of-area postcode explains the
 *     problem and offers a route forward instead of a dead control
 *   · nothing blocks or overlays the content, and the checkout stays on this
 *     same origin (Stripe is the payment processor, not a different landing
 *     destination)
 *
 * The ad's final URL should be this deployment's own root, on the host it is
 * actually served from. If the domain has a www/apex pair, point the ad at
 * whichever one does NOT redirect: a 308 on the way in adds a hop Google can
 * read as a destination mismatch.
 */

/* Pricing mirrors api/checkout.js — the server recomputes it from the bedroom
   count, so this is only ever a display figure. Keep the two in step. */
const EPC_BASE = 65
const PER_EXTRA_BEDROOM = 5
const BEDROOMS_INCLUDED = 3
const MAX_BEDROOMS = 10

const priceFor = (beds) =>
  EPC_BASE + Math.max(0, Math.min(beds, MAX_BEDROOMS) - BEDROOMS_INCLUDED) * PER_EXTRA_BEDROOM

/* Coverage is a 40-mile ring around Preston (src/data/coverage.js). The page
   asks /api/coverage for the distance as the postcode is typed; the checkout
   server runs the same check again before it takes payment, so this is a
   courtesy to the customer, not the gate. */
const CHECK_DELAY_MS = 350

/* The domain this is actually served from, without the www. Derived rather
   than hardcoded, so the identity line in the hero stays true if the site is
   ever moved to a different domain. */
const HOST = SITE.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '')

const facts = [
  {
    icon: FileCheck2,
    title: 'The baseline',
    body: 'An EPC rates energy efficiency from A to G and lists recommended improvements. It is the starting point for any retrofit plan.',
  },
  {
    icon: Scale,
    title: 'Often a legal must',
    body: 'Required to sell or rent a home, and increasingly tied to minimum standards for landlords.',
  },
  {
    icon: CalendarClock,
    title: 'Valid 10 years',
    body: 'Once lodged, an EPC is valid for a decade, though a retrofit is a good reason to refresh it.',
  },
  {
    icon: Ruler,
    title: 'Measured, not guessed',
    body: 'EPCs are produced by an accredited assessor on RdSAP, the same measured data that drives your retrofit plan.',
  },
]

/* Turnaround, as given by George (2026-09-04). Single source for the page:
   the band at the top of the page, the steps below and the post-payment
   banner all read from these, so the page can never promise two timescales.
   The Consumer Contracts Regulations require the time by which the service
   will be performed to be given before the customer is bound — which is why
   it appears above the order card, not only in the steps further down. */
const BOOK_WITHIN = 'within 24 hours'
const LINK_WITHIN = 'within 2–24 hours of lodgement'

const steps = [
  ['Pay online', 'Choose your bedroom count and pay the full fee securely by card. That is the whole EPC fee.'],
  [
    'Pick your dates',
    'As soon as you have paid, the next screen asks which dates suit you. It takes a few seconds and there is nothing else to fill in.',
  ],
  [
    'We call to confirm',
    `We ring you on the number you gave to fix the visit. We aim to have your assessment booked ${BOOK_WITHIN} of your order.`,
  ],
  [
    'Certificate lodged',
    `The visit takes about 45 minutes for a typical home. Your EPC is then lodged on the national register and the link returned to you ${LINK_WITHIN}.`,
  ],
]

export default function Book() {
  const [params] = useSearchParams()
  const status = params.get('status')

  const [house, setHouse] = useState('')
  const [postcode, setPostcode] = useState('')
  const [touched, setTouched] = useState(false)
  const [coverage, setCoverage] = useState({ state: 'idle', outcode: null })
  const [bedrooms, setBedrooms] = useState(3)
  const [startNow, setStartNow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const typed = postcode.trim().length > 0
  const outcode = outcodeOf(postcode)
  const price = priceFor(bedrooms)

  // Results by outcode, and the outcode currently on screen. Typing "PR1 2AB"
  // passes through PR1, PR12 and back to PR1; caching by outcode means the
  // answer for PR1 is shown again instantly, and a late reply for PR12 is
  // ignored because it is no longer the latest.
  const results = useRef(new Map())
  const latest = useRef(null)
  const runCheck = (oc) => {
    const cached = results.current.get(oc)
    if (cached) return Promise.resolve(cached)
    return fetch(`/api/coverage?outcode=${encodeURIComponent(oc)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .catch(() => fallbackCoverage(oc))
      .then((result) => {
        if (result.source !== 'fallback') results.current.set(oc, result)
        if (latest.current === oc) {
          setCoverage(result)
          // How often the ring turns people away, so its size can be judged
          // from data rather than guessed. An outcode is not personal data.
          if (result.state === 'outside') {
            trackEvent('coverage_outside', { outcode: oc, miles: result.miles ?? 0 })
          }
        }
        return result
      })
  }

  useEffect(() => {
    latest.current = outcode
    if (!outcode) {
      setCoverage({ state: typed ? 'invalid' : 'idle', outcode: null, source: 'shape' })
      return undefined
    }
    const cached = results.current.get(outcode)
    if (cached) {
      setCoverage(cached)
      return undefined
    }
    setCoverage({ state: 'checking', outcode })
    const timer = setTimeout(() => runCheck(outcode), CHECK_DELAY_MS)
    return () => clearTimeout(timer)
  }, [outcode, typed])

  async function buy() {
    setError('')
    // Validate here so the button always DOES something — a disabled primary
    // CTA on an ad landing page reads as a broken destination.
    if (!validHouse(house)) {
      setError('Please tell us the house number or name so we know which property to visit.')
      return
    }
    if (!typed) {
      setError('Please enter your postcode so we can check we cover your area.')
      return
    }
    if (!outcode) {
      setTouched(true)
      setError('That does not look like a UK postcode. Please check it and try again.')
      return
    }
    // Consumer Contracts Regulations 2013 regs 36 and 37. We book within 24
    // hours, so the service is always performed INSIDE the 14-day cancellation
    // window. Doing that lawfully needs the customer's express request; and
    // the right to cancel only ends on full performance if they also
    // acknowledged that it would. Without both, an EPC could be assessed,
    // lodged and paid for, and still be cancelled for a full refund on day 13.
    if (!startNow) {
      setError(
        'Please tick the box asking us to start within the 14-day cancellation period, so we can book you in straight away.',
      )
      return
    }
    setLoading(true)
    // Wait for the coverage answer if it is still on its way.
    const cov =
      coverage.outcode === outcode && coverage.state !== 'checking' ? coverage : await runCheck(outcode)
    if (cov.state !== 'covered') {
      setError(`${describeCoverage(cov)} Give us a call on ${COMPANY.phone} and we will see what we can do.`)
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: 'epc', house, postcode, bedrooms, startNow }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) throw new Error(data.error || 'Something went wrong. Please try again.')
      window.location.href = data.url
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  const meta = metaFor('/')
  const jsonLd = graph(
    baseNodes(),
    webPageNode({ path: '/', title: meta.title, description: meta.description }),
    breadcrumbNode({
      path: '/',
      trail: [{ name: 'Book an EPC', path: '/' }],
    }),
    serviceNode({
      path: '/',
      name: 'Domestic Energy Performance Certificate (EPC)',
      serviceType: 'Energy Performance Certificate',
      description:
        'An accredited domestic energy assessor visits the property, carries out an RdSAP assessment and lodges the certificate on the national EPC register.',
      // The offer states the entry price and the actual pricing rule — the
      // server computes the charge from the bedroom count, so nothing here
      // promises a figure we do not honour.
      offers: {
        '@type': 'Offer',
        '@id': SITE + '/#offer',
        price: String(EPC_BASE),
        priceCurrency: 'GBP',
        priceSpecification: {
          '@type': 'PriceSpecification',
          price: String(EPC_BASE),
          priceCurrency: 'GBP',
          valueAddedTaxIncluded: true,
          description:
            '£' + EPC_BASE + ' for up to ' + BEDROOMS_INCLUDED + ' bedrooms, then £' + PER_EXTRA_BEDROOM + ' per additional bedroom.',
        },
        availability: 'https://schema.org/InStock',
        url: SITE,
      },
    }),
  )

  const orderCard = (
    <div id="order" className="scroll-mt-24 rounded-2xl border border-line bg-white p-6 text-ink shadow-lift sm:p-7">
      <h2 className="font-display text-2xl font-medium text-ink">Order your EPC</h2>
      <p className="mt-1 text-sm text-ink-soft">Takes a minute. Secure card payment handled by Stripe.</p>

      {/* House number or name. Asked here rather than on Stripe's page: it is
          the half of the address a postcode does not give us, and asking for
          it before payment means a mistake can be corrected for free. */}
      <div className="mt-6">
        <label htmlFor="house" className="label">
          House number or name
        </label>
        <input
          id="house"
          value={house}
          onChange={(e) => {
            setHouse(e.target.value.slice(0, HOUSE_MAX))
            setError('')
          }}
          placeholder="e.g. 14, 14A or Rose Cottage"
          autoComplete="address-line1"
          className="field"
        />
        <p className="mt-2 text-xs leading-relaxed text-ink-faint">
          Include the flat number if there is one. With your postcode this is all we need to find
          the property.
        </p>
      </div>

      {/* Postcode */}
      <div className="mt-5">
        <label htmlFor="pc" className="label">
          Property postcode
        </label>
        <input
          id="pc"
          value={postcode}
          onChange={(e) => {
            setPostcode(e.target.value)
            setError('')
          }}
          onBlur={() => setTouched(true)}
          placeholder="e.g. PR1 2AB"
          autoComplete="postal-code"
          className="field uppercase placeholder:normal-case"
        />
        {coverage.state === 'idle' && (
          <p className="mt-2 text-xs leading-relaxed text-ink-faint">
            We cover anywhere {coverageLabel()}, measured in a straight line. Type your postcode and
            we will check it for you.
          </p>
        )}
        <CoverageNote coverage={coverage} touched={touched} />
      </div>

      {/* Bedrooms */}
      <div className="mt-5">
        <label htmlFor="beds" className="label">
          Number of bedrooms
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Fewer bedrooms"
            onClick={() => setBedrooms((b) => Math.max(1, b - 1))}
            disabled={bedrooms <= 1}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line-strong text-ink transition-colors hover:border-green-600 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus size={16} />
          </button>
          <input
            id="beds"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_BEDROOMS}
            value={bedrooms}
            onChange={(e) => {
              const n = Math.round(Number(e.target.value) || 1)
              setBedrooms(Math.min(Math.max(n, 1), MAX_BEDROOMS))
            }}
            className="field text-center font-semibold"
          />
          <button
            type="button"
            aria-label="More bedrooms"
            onClick={() => setBedrooms((b) => Math.min(MAX_BEDROOMS, b + 1))}
            disabled={bedrooms >= MAX_BEDROOMS}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line-strong text-ink transition-colors hover:border-green-600 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Price */}
      <div className="mt-6 flex items-end justify-between border-t border-line pt-5">
        <div>
          <div className="text-sm font-semibold text-ink">Total to pay</div>
          <p className="mt-0.5 text-xs text-ink-faint">
            {bedrooms <= BEDROOMS_INCLUDED
              ? `Up to ${BEDROOMS_INCLUDED} bedrooms`
              : `£${EPC_BASE} + ${bedrooms - BEDROOMS_INCLUDED} × £${PER_EXTRA_BEDROOM}`}
          </p>
        </div>
        <div className="font-display text-4xl font-medium leading-none text-ink">£{price}</div>
      </div>

      {error && (
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm leading-relaxed text-danger">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {/* Consumer Contracts Regulations 2013, regs 36(1) and 37(1).
          We aim to book within 24 hours, so the EPC is always carried out
          INSIDE the 14-day cancellation window. Two things have to be true
          for that to work: the customer must have EXPRESSLY REQUESTED that we
          start early, and they must have ACKNOWLEDGED that the right to
          cancel ends once the service is fully performed. Telling them is not
          enough — the regulations want a positive act, which is what this tick
          is. Without it the certificate could be assessed, lodged and paid
          for, and still cancelled for a full refund on day thirteen.
          The answer is sent to the server and stamped on the Stripe session,
          so there is a dated record of it. */}
      <label
        htmlFor="start-now"
        className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-paper p-3.5 text-xs leading-relaxed text-ink-soft transition-colors hover:border-green-300"
      >
        <input
          id="start-now"
          type="checkbox"
          checked={startNow}
          onChange={(e) => {
            setStartNow(e.target.checked)
            setError('')
          }}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-line text-green-700 focus:ring-green-600"
        />
        <span>
          <strong className="font-semibold text-ink">Please start straight away.</strong> I am asking
          you to carry out my EPC within the 14-day cancellation period. If I cancel before the visit
          I pay only for work already done, and I understand the right to cancel ends once my
          certificate has been lodged.
        </span>
      </label>

      <button
        type="button"
        onClick={buy}
        disabled={loading}
        className="btn-primary mt-4 w-full py-3.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Redirecting to secure checkout…
          </>
        ) : (
          <>
            Pay £{price} and book <ArrowRight size={16} />
          </>
        )}
      </button>

      <p className="mt-3 flex items-center justify-center gap-2 text-xs text-ink-faint">
        <Lock size={12} /> Secure checkout by Stripe. Your card details never touch our site.
      </p>

      <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-ink-soft">
        {[
          // Precise, not absolute. The Terms allow a fee for a SECOND wasted
          // journey, so "nothing to pay afterwards" full stop was a claim the
          // small print contradicted — which is Google's dishonest-pricing
          // category, and the same shape of fault that got the ads flagged.
          // Saying "no hidden extras" and disclosing the free rebook keeps the
          // reassurance without the contradiction.
          'This is the full amount for your EPC. No deposit and no hidden extras.',
          'The price depends only on the number of bedrooms. Nothing is added for distance inside our area.',
          'If nobody is home when we arrive, we rebook once free of charge.',
          'If we cannot complete your EPC we refund you in full.',
        ].map((t) => (
          <li key={t} className="flex items-start gap-2">
            <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-green-600" />
            <span>{t}</span>
          </li>
        ))}
      </ul>

      {/* Consumer Contracts Regulations 2013: the cancellation right, how
          to use it and where to send it must be given BEFORE the customer
          is bound. Leaving it out stretches the 14 days to 12 months and
          14 days AND removes the right to charge for work already done. */}
      <details className="mt-4 rounded-lg border border-line bg-paper px-3.5 py-2.5">
        <summary className="cursor-pointer list-none text-xs font-semibold text-ink [&::-webkit-details-marker]:hidden">
          Your 14-day right to cancel →
        </summary>
        <div className="mt-2 space-y-1.5 text-xs leading-relaxed text-ink-soft">
          <p>
            You have <strong>14 days</strong> from the day after you order to cancel for any reason
            and get a full refund. To cancel, email{' '}
            <a href={`mailto:${COMPANY.email}`} className="underline underline-offset-2">
              {COMPANY.email}
            </a>
            , call {COMPANY.phone}, or write to us at {COMPANY.registeredOffice}. A clear statement
            is enough. You can also use our{' '}
            <Link to="/cancellation-form" className="underline underline-offset-2">
              cancellation form
            </Link>
            .
          </p>
          <p>
            If you ask us to carry out the EPC <strong>within</strong> those 14 days and then cancel
            before it is done, you pay a proportionate amount for the work already carried out. Once
            the assessment is done and the certificate lodged, the right to cancel ends.
          </p>
        </div>
      </details>
      <p className="mt-3 text-center text-xs leading-relaxed text-ink-faint">
        By paying you agree to our{' '}
        <Link to="/terms" className="underline underline-offset-2">
          Terms
        </Link>{' '}
        and{' '}
        <Link to="/privacy" className="underline underline-offset-2">
          Privacy Policy
        </Link>
        . Full refund if we can&rsquo;t complete your EPC.
      </p>
    </div>
  )

  return (
    <>
      <JsonLd data={jsonLd} />

      {/* Turnaround band — the first thing on the page, above the order card.
          Paid traffic arrives asking "how fast?", and answering it before the
          price is asked for is what stops that question becoming a phone call
          or an abandoned checkout. */}
      <div className="border-b border-green-100 bg-green-50">
        <div className="container-site flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-10">
          <p className="flex items-start gap-2.5 text-sm leading-snug text-ink-soft">
            <CalendarClock size={17} className="mt-px shrink-0 text-green-700" />
            <span>
              We aim to book your assessment <strong className="font-semibold text-ink">{BOOK_WITHIN}</strong>
            </span>
          </p>
          <p className="flex items-start gap-2.5 text-sm leading-snug text-ink-soft">
            <FileCheck2 size={17} className="mt-px shrink-0 text-green-700" />
            <span>
              Certificates are lodged and your link returned{' '}
              <strong className="font-semibold text-ink">{LINK_WITHIN}</strong>
            </span>
          </p>
        </div>
      </div>

      {/* ---- Hero + order card (the whole point of the page, above the fold) ---- */}
      <PageHeader
        image={IMAGES.headerEpcs.src}
        kicker={`${HOST} · a booking site by Eco Futures`}
        title={
          <>
            Book a home EPC for <span className="text-green-400">£{EPC_BASE}</span>
          </>
        }
        intro={[
          `£${EPC_BASE} covers a home with up to ${BEDROOMS_INCLUDED} bedrooms, then £${PER_EXTRA_BEDROOM} for each extra bedroom. A four-bedroom home is £${EPC_BASE + PER_EXTRA_BEDROOM} and a five-bedroom home is £${EPC_BASE + PER_EXTRA_BEDROOM * 2}. That is the whole price for the EPC, with no deposit and no hidden extras.`,
          'An accredited domestic energy assessor visits your property, carries out the assessment and lodges your certificate on the national register.',
        ]}
        aside={orderCard}
      >
        <ul className="space-y-2.5">
          {[
            `${COMPANY.accreditationScheme} accredited assessor, number ${COMPANY.assessorNumber}`,
            'Domestic EPCs only, for houses, flats and maisonettes',
            `Covering everywhere ${coverageLabel()}`,
            'Certificate lodged on the national register and emailed to you',
          ].map((t) => (
            <li key={t} className="flex items-start gap-2.5 text-[0.98rem] text-white/90">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-400" />
              {t}
            </li>
          ))}
        </ul>
        {/* Who this actually is, above the fold.
            The domain does not carry the business name, and a previously
            flagged advertiser on a brand-new domain that does not match its
            trading name invites exactly the misrepresentation review we are
            trying to avoid. So the legal entity, its company number and its
            registered office are stated in the hero rather than left to the
            footer — a reviewer, or a customer, can identify who is taking the
            money without scrolling. */}
        <p className="mt-6 border-t border-white/15 pt-5 text-sm leading-relaxed text-white/75">
          <strong className="font-semibold text-white">{HOST} is Eco Futures.</strong> Eco Futures is
          the trading name of {COMPANY.legalName}, registered in {COMPANY.placeOfRegistration},
          company number {COMPANY.companyNumber}, registered office {COMPANY.registeredOffice}.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/70">
          <a className="inline-flex items-center gap-2 hover:text-white" href={`tel:${COMPANY.phoneHref}`}>
            <Phone size={15} /> {COMPANY.phone}
          </a>
          <a className="inline-flex items-center gap-2 hover:text-white" href={`mailto:${COMPANY.email}`}>
            <Mail size={15} /> {COMPANY.email}
          </a>
          <span className="inline-flex items-center gap-2">
            <MapPin size={15} /> {COMPANY.area}
          </span>
        </div>
      </PageHeader>

      {/* ---- Accreditations — directly under the hero on the page paid
           traffic lands on, so the schemes back the claim before anyone
           has to scroll. Renders only schemes actually held. ---- */}
      <AccreditationStrip />

      {/* ---- Status banners after returning from Stripe ---- */}
      {(status === 'success' || status === 'cancelled') && (
        <section className="container-site pt-10">
          {status === 'success' ? (
            <Banner tone="success" icon={CheckCircle2}>
              <strong className="font-semibold">Payment received. Thank you.</strong> You will get a
              receipt by email, and we will call you on the number you gave to arrange the visit. We
              aim to have you booked in {BOOK_WITHIN}. Any questions in the meantime, ring{' '}
              {COMPANY.phone}.
            </Banner>
          ) : (
            <Banner tone="muted" icon={XCircle}>
              Checkout cancelled. No payment was taken. Your details are still above if you would
              like to try again.
            </Banner>
          )}
        </section>
      )}

      {/* ---- How it works ---- */}
      <section className="container-site py-16 md:py-20">
        <div className="max-w-2xl">
          <h2 className="h-section">What happens next</h2>
          <p className="lede mt-4">Four steps, from payment to certificate.</p>
        </div>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([title, desc], i) => (
            <li key={title} className="card flex flex-col p-7">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-700 font-display text-lg font-medium text-white">
                {i + 1}
              </span>
              <h3 className="mt-5 font-display text-xl font-medium text-ink">{title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---- What the price includes, and what it does not ----
           A shop or office landlord could otherwise pay and then need
           refunding under our own guarantee. ---- */}
      <section className="border-y border-line bg-paper py-14 md:py-16">
        <div className="container-site grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="h-section">What the price includes</h2>
            <p className="lede mt-4">
              The visit, the assessment, lodging the certificate on the national EPC register and
              emailing you the link. That is everything.
            </p>
          </div>
          <div className="card p-7">
            <h3 className="font-display text-lg font-medium text-ink">What we do not do</h3>
            <ul className="mt-4 space-y-2.5 text-[0.95rem] leading-relaxed text-ink-soft">
              {[
                'We carry out domestic EPCs only, for houses, flats and maisonettes. We do not carry out commercial or non-domestic EPCs.',
                'Whole-house retrofit advice is a separate service, quoted to your property.',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-green-600" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---- Who carries it out (trust signals) ---- */}
      <section className="border-y border-line bg-paper py-16 md:py-20">
        <div className="container-site grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <h2 className="h-section">An accredited assessor, not a call centre</h2>
            <p className="lede mt-5">
              You are booking an accredited domestic energy assessor —{' '}
              {COMPANY.accreditationScheme}, number {COMPANY.assessorNumber} — not a form that
              passes your details to whoever is nearest. The same assessor carries out the survey
              and lodges the certificate on the national register.
            </p>
          </div>
          <div className="card p-7">
            <dl className="divide-y divide-line">
              <Row
                icon={MapPin}
                label="Areas covered"
                value={`Anywhere ${coverageLabel()}, including ${coverageTowns()}`}
              />
              <Row icon={Phone} label="Phone" value={COMPANY.phone} href={`tel:${COMPANY.phoneHref}`} />
              <Row icon={Mail} label="Email" value={COMPANY.email} href={`mailto:${COMPANY.email}`} />
            </dl>
            <p className="mt-5 border-t border-line pt-5 text-sm leading-relaxed text-ink-faint">
              {COMPANY.tradingName} is a trading name of {COMPANY.legalName}, company{' '}
              {COMPANY.companyNumber}, registered office {COMPANY.registeredOffice}.
            </p>
          </div>
        </div>
      </section>

      {/* ---- Where we work ---- */}
      <section className="container-site py-16 md:py-20">
        <div className="max-w-2xl">
          <h2 className="h-section">Where we carry out EPCs</h2>
          <p className="lede mt-4">
            Anywhere {coverageLabel()} — {COVERAGE.towns.join(', ')} and every town and village in
            between.
          </p>
        </div>
        <p className="mt-6 max-w-3xl text-[1.02rem] leading-relaxed text-ink-soft">
          Not sure whether you are inside it? Type your postcode into the form above and it checks
          straight away, telling you how far the property is from us. If you are just outside, ring{' '}
          <a href={`tel:${COMPANY.phoneHref}`} className="font-semibold text-green-700">
            {COMPANY.phone}
          </a>{' '}
          — we can often still help.
        </p>
      </section>

      {/* ---- What an EPC is ---- */}
      <section className="container-site py-16 md:py-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((f) => (
            <div key={f.title} className="card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-50 text-green-700">
                <f.icon size={22} />
              </span>
              <h3 className="mt-5 font-display text-lg font-medium text-ink">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <EpcBandLadder className="shadow-card" />
          <div>
            <h2 className="h-section">What the rating means</h2>
            <p className="lede mt-5">
              An EPC scores a home from A to G and lists the improvements that would lift it. The
              certificate is lodged on the national register, is valid for ten years, and is the
              document a buyer, a tenant or a letting agent will look for.
            </p>
            <p className="mt-4 text-[1.02rem] leading-relaxed text-ink-soft">
              Any questions before you book, call{' '}
              <a href={`tel:${COMPANY.phoneHref}`} className="font-semibold text-green-700">
                {COMPANY.phone}
              </a>{' '}
              or email{' '}
              <a href={`mailto:${COMPANY.email}`} className="font-semibold text-green-700">
                {COMPANY.email}
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  )
}

/* What the postcode field says underneath itself. A half-typed postcode is
   not wrong yet, so the "not a UK postcode" line waits until the field is
   left (or the pay button is pressed). */
function CoverageNote({ coverage, touched }) {
  const base = 'mt-2 flex items-start gap-1.5 text-xs leading-relaxed'
  switch (coverage.state) {
    case 'checking':
      return (
        <p className={`${base} text-ink-faint`}>
          <Loader2 size={14} className="mt-px shrink-0 animate-spin" /> Checking we cover your area…
        </p>
      )
    case 'covered':
      return (
        <p className={`${base} font-medium text-green-800`}>
          <CheckCircle2 size={14} className="mt-px shrink-0" />
          <span>{describeCoverage(coverage)}</span>
        </p>
      )
    case 'outside':
      return (
        <p className={`${base} text-danger`}>
          <AlertCircle size={14} className="mt-px shrink-0" />
          <span>
            {describeCoverage(coverage)} Call{' '}
            <a href={`tel:${COMPANY.phoneHref}`} className="underline underline-offset-2">
              {COMPANY.phone}
            </a>{' '}
            and we will see what we can do.
          </span>
        </p>
      )
    case 'invalid':
      return touched ? (
        <p className={`${base} text-danger`}>
          <AlertCircle size={14} className="mt-px shrink-0" />
          <span>{describeCoverage(coverage)}</span>
        </p>
      ) : null
    default:
      return null
  }
}

function Row({ icon: Icon, label, value, href }) {
  return (
    <div className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
      <Icon size={18} className="mt-0.5 shrink-0 text-green-600" />
      <dt className="w-32 shrink-0 text-sm font-semibold text-ink-faint">{label}</dt>
      <dd className="text-[0.95rem] font-medium text-ink">
        {href ? (
          <a href={href} className="hover:text-green-700">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  )
}

function Banner({ tone, icon: Icon, children }) {
  const tones = {
    success: 'border-green-200 bg-green-50 text-green-900',
    muted: 'border-line bg-paper text-ink-soft',
  }
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 text-sm leading-relaxed ${tones[tone]}`}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <p>{children}</p>
    </div>
  )
}
