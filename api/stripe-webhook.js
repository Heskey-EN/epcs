// Stripe → us, the moment a payment completes.
//
// This is the ONE notification that cannot be missed. It fires from Stripe's
// servers to ours on `checkout.session.completed`, so it does not care whether
// the customer stayed on the page, filled in the date form, or closed the tab
// the instant their card went through. Every paid EPC produces this email.
//
// The second email — which dates they picked — comes from api/booking.js when
// they choose them. Two emails per booking: one guaranteed, one when they tell
// us when they're free.
//
// Env (Vercel → Settings → Environment Variables):
//   STRIPE_SECRET_KEY      already set for /api/checkout
//   STRIPE_WEBHOOK_SECRET  whsec_... — from the webhook you create in Stripe
//   RESEND_API_KEY         see api/_notify.js
//
// Stripe must receive the RAW body to verify its signature, so the parser is
// off and the body is read manually below.
import Stripe from 'stripe'
import { sendNotification, bookingLines, isRetryable } from './_notify.js'

export const config = { api: { bodyParser: false } }

async function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body
  if (typeof req.body === 'string') return Buffer.from(req.body)
  const chunks = []
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  return Buffer.concat(chunks)
}

/** The same shape api/booking.js builds, from a webhook's session object. */
function summarise(session) {
  return {
    name: session.customer_details?.name || '',
    email: session.customer_details?.email || '',
    phone: session.customer_details?.phone || '',
    propertyAddress: session.metadata?.property_address || '',
    postcode: session.metadata?.postcode || '',
    bedrooms: session.metadata?.bedrooms || '',
    amount: typeof session.amount_total === 'number' ? session.amount_total / 100 : null,
    distance: session.metadata?.distance_miles || '',
    district: session.metadata?.district || '',
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secretKey || !webhookSecret) {
    console.error('stripe-webhook: STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET is not set.')
    // 200, not 500: Stripe retrying for three days will not conjure a missing
    // environment variable, and a failing endpoint eventually gets disabled.
    return res.status(200).json({ received: true, handled: false, reason: 'not_configured' })
  }

  const stripe = new Stripe(secretKey)

  /* Signature verification is the whole security model here. Without it anyone
     who knows the URL could POST a fabricated "payment completed" and have us
     email a booking that never happened. */
  let event
  try {
    const raw = await readRawBody(req)
    event = stripe.webhooks.constructEvent(raw, req.headers['stripe-signature'], webhookSecret)
  } catch (e) {
    console.error('stripe-webhook: signature verification failed —', e?.message)
    return res.status(400).json({ error: 'Invalid signature' })
  }

  /* Both events mean "this order is paid for", they just arrive at different
     moments. A card settles immediately, so `completed` already carries
     payment_status: paid. A delayed method — bank debit, bank transfer — sends
     `completed` while still unpaid and then `async_payment_succeeded` once the
     money actually lands. Handling only the first would mean a delayed payment
     never produced an email at all. The payment_status check below is what
     makes subscribing to both safe: whichever event arrives paid triggers the
     notification, and the notified_at stamp stops the other one repeating it. */
  const HANDLED = ['checkout.session.completed', 'checkout.session.async_payment_succeeded']
  if (!HANDLED.includes(event.type)) {
    return res.status(200).json({ received: true, handled: false, reason: 'ignored_event' })
  }

  const session = event.data.object
  if (session.payment_status !== 'paid') {
    // Expected for a delayed payment method — its async_payment_succeeded will
    // follow when the money clears, and that is the one that emails.
    return res.status(200).json({ received: true, handled: false, reason: 'unpaid' })
  }

  const pi = typeof session.payment_intent === 'string' ? session.payment_intent : null

  /* Stripe redelivers events — on its own retries, and if the endpoint is ever
     replayed by hand. Without a guard George gets the same booking emailed
     twice. The flag lives on the PaymentIntent because that is the record the
     rest of this codebase already treats as the order. */
  if (pi) {
    try {
      const intent = await stripe.paymentIntents.retrieve(pi)
      if (intent.metadata?.notified_at) {
        return res.status(200).json({ received: true, handled: false, reason: 'already_notified' })
      }
    } catch (e) {
      // Not fatal — a duplicate email is better than a missing one.
      console.error('stripe-webhook: could not read PaymentIntent metadata —', e?.message)
    }
  }

  const order = summarise(session)
  const lines = bookingLines(order, {
    heading: 'NEW EPC BOOKING — payment received',
    sessionId: session.id,
  })
  if (order.distance || order.district) {
    lines.push(
      `Distance:    ${order.distance ? `${order.distance} miles from Preston` : 'unknown'}`,
      `Area:        ${order.district || 'unknown'}`,
    )
  }
  lines.push(
    '',
    'They have not picked dates yet — you will get a second email when they do.',
    'If you would rather not wait, ring them.',
  )

  try {
    await sendNotification({
      subject: `EPC booking — ${order.propertyAddress || order.postcode || 'new order'}`,
      lines,
    })
  } catch (e) {
    console.error('stripe-webhook:', e?.message)
    // Retryable → 500 so Stripe delivers it again (it keeps trying for three
    // days). A booking notification is worth the retries. Permanent failures
    // return 200 so the endpoint is not disabled over a misconfiguration.
    if (isRetryable(e)) return res.status(500).json({ error: 'notification failed, please retry' })
    return res.status(200).json({ received: true, handled: false, reason: 'notify_failed' })
  }

  if (pi) {
    try {
      await stripe.paymentIntents.update(pi, {
        metadata: { ...session.metadata, notified_at: new Date().toISOString() },
      })
    } catch (e) {
      console.error('stripe-webhook: could not stamp notified_at —', e?.message)
    }
  }

  return res.status(200).json({ received: true, handled: true })
}
