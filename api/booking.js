// Vercel serverless function — the post-payment booking step for an EPC.
//
//   GET  /api/booking?session_id=cs_...   → the paid order's details
//   POST /api/booking { session_id, preferredDate, altDate, timeSlot, notes }
//                                          → attaches the chosen dates to the
//                                            payment in Stripe
//
// Why the dates go onto the Stripe PaymentIntent rather than a database: the
// payment is already the single record of the order, George already gets a
// Stripe notification for it, and the dashboard entry then carries the address,
// phone, bedroom count AND the requested dates in one place. No extra table to
// run, no second system to keep in step.
//
// Required env var: STRIPE_SECRET_KEY (already set for /api/checkout).
import Stripe from 'stripe'
import { COMPANY } from '../src/data/company.js'

const MAX_NOTES = 500

/** Only ever expose what the customer already typed themselves. */
function summarise(session) {
  const custom = (session.custom_fields || []).reduce((acc, f) => {
    acc[f.key] = f.text?.value ?? f.dropdown?.value ?? f.numeric?.value ?? ''
    return acc
  }, {})
  return {
    paid: session.payment_status === 'paid',
    name: session.customer_details?.name || '',
    email: session.customer_details?.email || '',
    phone: session.customer_details?.phone || '',
    // Orders placed from 8 Sep 2026 carry the address in metadata, built from
    // the house number the customer gave on our page. Older orders have it in
    // the Stripe custom field, so both are read.
    propertyAddress: session.metadata?.property_address || custom.propertyaddress || '',
    postcode: session.metadata?.postcode || '',
    bedrooms: session.metadata?.bedrooms || '',
    amount: typeof session.amount_total === 'number' ? session.amount_total / 100 : null,
    // A reference for conversion reporting that is safe to hand to Google:
    // the PaymentIntent id cannot fetch anything without the secret key,
    // unlike the Checkout Session id in the return URL.
    orderRef:
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || '',
    // Set once the customer has picked dates, so a refresh shows the confirmed
    // state instead of asking again.
    booked: session.metadata?.booking_status === 'requested',
    preferredDate: session.metadata?.preferred_date || '',
    altDate: session.metadata?.alt_date || '',
    timeSlot: session.metadata?.time_slot || '',
  }
}

const clean = (v, max) =>
  String(v ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .trim()
    .slice(0, max)

/** YYYY-MM-DD, a real date, today or later, within a year. '' is allowed. */
function validDate(raw) {
  const s = clean(raw, 10)
  if (!s) return ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const d = new Date(`${s}T00:00:00Z`)
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) return null
  const today = new Date()
  const floor = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  const ceiling = new Date(floor)
  ceiling.setUTCFullYear(ceiling.getUTCFullYear() + 1)
  if (d < floor || d > ceiling) return null
  return s
}

const TIME_SLOTS = ['Morning', 'Afternoon', 'Either']

export default async function handler(req, res) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return res.status(503).json({
      error: `We cannot reach the booking system at the moment. Your payment is safe. Please call ${COMPANY.phone} and we will arrange your visit.`,
    })
  }
  const stripe = new Stripe(secretKey)

  // ---- read the order -----------------------------------------------------
  if (req.method === 'GET') {
    const id = clean(req.query?.session_id, 100)
    if (!id.startsWith('cs_')) return res.status(400).json({ error: 'Missing booking reference.' })
    try {
      const session = await stripe.checkout.sessions.retrieve(id)
      const order = summarise(session)
      if (!order.paid) return res.status(402).json({ error: 'This order hasn’t been paid.' })
      return res.status(200).json({ order })
    } catch {
      return res.status(404).json({ error: 'We couldn’t find that booking reference.' })
    }
  }

  // ---- attach the requested dates -----------------------------------------
  if (req.method === 'POST') {
    let body = req.body
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch {
        body = {}
      }
    }
    const { session_id: sessionId, preferredDate, altDate, timeSlot, notes } = body || {}

    const id = clean(sessionId, 100)
    if (!id.startsWith('cs_')) return res.status(400).json({ error: 'Missing booking reference.' })

    const preferred = validDate(preferredDate)
    const alt = validDate(altDate)
    if (preferred === null || alt === null) {
      return res.status(400).json({ error: 'Please choose a date within the next year.' })
    }
    if (!preferred) return res.status(400).json({ error: 'Please choose a preferred date.' })

    const slot = TIME_SLOTS.includes(timeSlot) ? timeSlot : 'Either'

    try {
      const session = await stripe.checkout.sessions.retrieve(id)
      if (session.payment_status !== 'paid') {
        return res.status(402).json({ error: 'This order hasn’t been paid.' })
      }

      const metadata = {
        booking_status: 'requested',
        preferred_date: preferred,
        alt_date: alt,
        time_slot: slot,
        booking_notes: clean(notes, MAX_NOTES),
      }

      // The PaymentIntent is what shows in the Stripe dashboard next to the
      // money, so the dates live there. Best-effort: never fail the customer's
      // booking because a metadata write didn't land.
      const pi = typeof session.payment_intent === 'string' ? session.payment_intent : null
      if (pi) {
        try {
          await stripe.paymentIntents.update(pi, { metadata: { ...session.metadata, ...metadata } })
        } catch (e) {
          console.error('booking: paymentIntent metadata update failed', e?.message)
        }
      }

      return res.status(200).json({ ok: true, order: summarise({ ...session, metadata: { ...session.metadata, ...metadata } }) })
    } catch (e) {
      console.error('booking error:', e)
      return res.status(502).json({ error: 'Could not save your preferred dates. Please call us and we’ll book you in.' })
    }
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method not allowed' })
}
