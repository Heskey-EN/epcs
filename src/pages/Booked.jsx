import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import emailjs from '@emailjs/browser'
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  CalendarDays,
  Phone,
  MapPin,
  BedDouble,
  Receipt,
} from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import { COMPANY } from '../data/company.js'
import { trackPurchase } from '../lib/analytics.js'

// Same EmailJS credentials the contact form uses — public client-side ids.
const EMAILJS_SERVICE = import.meta.env.VITE_EMAILJS_SERVICE || 'service_tcu1ci3'
const EMAILJS_TEMPLATE = import.meta.env.VITE_EMAILJS_TEMPLATE || 'template_ldu2ckm'
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'Ew-e7AM5p0vx0GqrC'

const TIME_SLOTS = ['Morning', 'Afternoon', 'Either']

/**
 * /epcs/booked — where Stripe sends the customer after a successful EPC
 * payment. They choose preferred dates; we attach those to the payment in
 * Stripe (so the dashboard entry carries address, phone, bedrooms AND dates)
 * and email George so he knows to ring them.
 *
 * The payment is already complete by the time anyone lands here, so nothing on
 * this page can cost the customer anything. If the email or the metadata write
 * fails we still tell them they're booked — George has the Stripe notification
 * regardless, and the page shows his number.
 */
export default function Booked() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id') || ''

  const [state, setState] = useState('loading') // loading | form | saving | done | error
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  const [preferredDate, setPreferredDate] = useState('')
  const [altDate, setAltDate] = useState('')
  const [timeSlot, setTimeSlot] = useState('Either')
  const [notes, setNotes] = useState('')
  const emailedRef = useRef(false)

  // Earliest selectable day is tomorrow; latest a year out (matches the API).
  const { min, max } = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    const y = new Date()
    y.setFullYear(y.getFullYear() + 1)
    return { min: d.toISOString().slice(0, 10), max: y.toISOString().slice(0, 10) }
  }, [])

  useEffect(() => {
    if (!sessionId) {
      setState('error')
      setError('This page opens automatically after payment. If you have already paid, call us and we’ll book you in.')
      return
    }
    let cancelled = false
    fetch(`/api/booking?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (cancelled) return
        if (!ok || !d.order) {
          setState('error')
          setError(d.error || 'We couldn’t find that booking.')
          return
        }
        setOrder(d.order)
        setState(d.order.booked ? 'done' : 'form')
        // The sale, reported once the server has confirmed the payment and
        // only on the first arrival from Stripe (a later revisit shows the
        // booked state and must not count again). Sent only with consent.
        if (!d.order.booked) trackPurchase({ transactionId: d.order.orderRef, value: d.order.amount })
      })
      .catch(() => {
        if (cancelled) return
        setState('error')
        setError('We couldn’t reach the booking service. Your payment is safe — please call us.')
      })
    return () => {
      cancelled = true
    }
  }, [sessionId])

  /* Notify George. Reuses the contact-form template (name/email/address/
     message), so there is no new EmailJS template to set up. Best-effort: a
     failure here must never tell a paying customer their booking failed. */
  async function notify(details) {
    if (emailedRef.current) return
    emailedRef.current = true
    const lines = [
      'NEW EPC BOOKING — payment received',
      '',
      `Property:   ${details.propertyAddress || '(not given)'}`,
      `Postcode:   ${details.postcode || '(not given)'}`,
      `Bedrooms:   ${details.bedrooms || '?'}`,
      `Paid:       £${details.amount ?? '?'}`,
      '',
      `Preferred:  ${details.preferredDate}`,
      `Alternative:${details.altDate ? ` ${details.altDate}` : ' (none)'}`,
      `Time:       ${details.timeSlot}`,
      `Notes:      ${details.notes || '(none)'}`,
      '',
      `Customer:   ${details.name || '(not given)'}`,
      `Phone:      ${details.phone || '(not given)'}`,
      `Email:      ${details.email || '(not given)'}`,
      '',
      `Stripe ref: ${sessionId}`,
    ]
    try {
      await emailjs.send(
        EMAILJS_SERVICE,
        EMAILJS_TEMPLATE,
        {
          name: `EPC booking — ${details.name || 'customer'}`,
          email: details.email || COMPANY.email,
          address: `${details.propertyAddress || ''} ${details.postcode || ''}`.trim(),
          message: lines.join('\n'),
        },
        { publicKey: EMAILJS_PUBLIC_KEY },
      )
    } catch (e) {
      // George still gets Stripe's own payment notification, and the dates are
      // on the PaymentIntent — so this is a convenience, not the record.
      console.error('Booking notification email failed:', e)
    }
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!preferredDate) {
      setError('Please choose a preferred date.')
      return
    }
    setState('saving')
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, preferredDate, altDate, timeSlot, notes }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not save your dates.')
      await notify({ ...order, preferredDate, altDate, timeSlot, notes })
      setOrder(data.order || { ...order, booked: true, preferredDate, altDate, timeSlot })
      setState('done')
    } catch (err) {
      setError(err.message)
      setState('form')
    }
  }

  return (
    <>
      <PageHeader
        compact
        kicker="Payment received"
        title={state === 'done' ? 'You’re booked in.' : 'When suits you?'}
        intro={
          state === 'done'
            ? 'Thanks. We have your preferred dates and we will call you within 24 hours to confirm a time.'
            : 'Pick a date or two that work for you and we will call to confirm. The assessment takes about 45 minutes.'
        }
      />

      <section className="container-site py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
          <div>
            {state === 'loading' && (
              <p className="flex items-center gap-2 text-ink-soft">
                <Loader2 size={18} className="animate-spin" /> Loading your order…
              </p>
            )}

            {state === 'error' && (
              <div className="card p-7">
                <p className="flex items-start gap-2.5 text-sm leading-relaxed text-danger">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </p>
                <p className="mt-4 text-sm text-ink-soft">
                  Call{' '}
                  <a href={`tel:${COMPANY.phoneHref}`} className="font-semibold text-green-700">
                    {COMPANY.phone}
                  </a>{' '}
                  or email{' '}
                  <a href={`mailto:${COMPANY.email}`} className="font-semibold text-green-700">
                    {COMPANY.email}
                  </a>
                  .
                </p>
                <Link to="/" className="btn-outline mt-6 px-5 py-2.5 text-sm">
                  Back to booking
                </Link>
              </div>
            )}

            {(state === 'form' || state === 'saving') && (
              <form onSubmit={submit} className="card p-7">
                <h2 className="font-display text-2xl font-medium text-ink">Choose your dates</h2>
                <p className="mt-1 text-sm text-ink-soft">
                  We will confirm by phone. Nothing is fixed until we speak.
                </p>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="pref" className="label">
                      Preferred date
                    </label>
                    <input
                      id="pref"
                      type="date"
                      required
                      min={min}
                      max={max}
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="field"
                    />
                  </div>
                  <div>
                    <label htmlFor="alt" className="label">
                      Alternative date (optional)
                    </label>
                    <input
                      id="alt"
                      type="date"
                      min={min}
                      max={max}
                      value={altDate}
                      onChange={(e) => setAltDate(e.target.value)}
                      className="field"
                    />
                  </div>
                </div>

                <fieldset className="mt-5">
                  <legend className="label">Time of day</legend>
                  <div className="flex flex-wrap gap-2">
                    {TIME_SLOTS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTimeSlot(t)}
                        aria-pressed={timeSlot === t}
                        className={`rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${
                          timeSlot === t
                            ? 'border-green-700 bg-green-700 text-white'
                            : 'border-line-strong text-ink-soft hover:border-green-600'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="mt-5">
                  <label htmlFor="notes" className="label">
                    Anything we should know? (optional)
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    maxLength={500}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Access, parking, gate code, best number to reach you…"
                    className="field"
                  />
                </div>

                {error && (
                  <p className="mt-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={state === 'saving'}
                  className="btn-primary mt-6 w-full py-3.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {state === 'saving' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Sending…
                    </>
                  ) : (
                    <>
                      <CalendarDays size={16} /> Request these dates
                    </>
                  )}
                </button>
              </form>
            )}

            {state === 'done' && (
              <div className="card p-7">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700">
                    <CheckCircle2 size={22} />
                  </span>
                  <div>
                    <h2 className="font-display text-2xl font-medium text-ink">Dates requested</h2>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                      We will call you within 24 hours on{' '}
                      <strong className="text-ink">{order?.phone || 'the number you gave'}</strong> to
                      confirm your visit.
                    </p>
                  </div>
                </div>

                {/* The number, given its own block rather than buried in a
                    sentence. On a phone it dials. */}
                <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5 text-center">
                  <p className="text-sm font-semibold text-ink">Would rather speak to us now?</p>
                  <a
                    href={`tel:${COMPANY.phoneHref}`}
                    className="mt-2 inline-flex items-center justify-center gap-2.5 font-display text-3xl font-medium text-green-800 hover:text-green-900"
                  >
                    <Phone size={24} className="shrink-0 text-green-700" />
                    {COMPANY.phone}
                  </a>
                  <p className="mt-2 text-sm text-ink-soft">
                    Give us a call, or we will call you within 24 hours.
                  </p>
                </div>

                <dl className="mt-6 divide-y divide-line border-t border-line pt-2">
                  <Row icon={CalendarDays} label="Preferred" value={order?.preferredDate || preferredDate} />
                  {(order?.altDate || altDate) && (
                    <Row icon={CalendarDays} label="Alternative" value={order?.altDate || altDate} />
                  )}
                  <Row icon={CalendarDays} label="Time" value={order?.timeSlot || timeSlot} />
                </dl>

                <Link to="/" className="btn-outline mt-6 px-5 py-2.5 text-sm">
                  Book another EPC
                </Link>
              </div>
            )}
          </div>

          {/* Order summary */}
          {order && (
            <aside className="card h-fit p-6">
              <h2 className="text-sm font-semibold text-ink-faint">Your order</h2>
              <dl className="mt-3 divide-y divide-line">
                <Row icon={MapPin} label="Property" value={order.propertyAddress || order.postcode} />
                <Row icon={BedDouble} label="Bedrooms" value={order.bedrooms} />
                <Row icon={Receipt} label="Paid" value={order.amount != null ? `£${order.amount}` : '—'} />
                <Row icon={Phone} label="Phone" value={order.phone || '—'} />
              </dl>
              <p className="mt-4 text-xs leading-relaxed text-ink-faint">
                A receipt has been emailed to you by Stripe. Your EPC is carried out by{' '}
                {COMPANY.accreditationScheme
                  ? `${COMPANY.accreditationScheme}-accredited assessor ${COMPANY.assessorNumber}`
                  : 'an accredited assessor'}
                .
              </p>
            </aside>
          )}
        </div>
      </section>
    </>
  )
}

function Row({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon size={16} className="mt-0.5 shrink-0 text-green-600" />
      <dt className="w-24 shrink-0 text-sm font-semibold text-ink-faint">{label}</dt>
      <dd className="text-sm font-medium text-ink">{value}</dd>
    </div>
  )
}
