// Vercel serverless function — creates a Stripe Checkout Session and returns
// its hosted URL. The Stripe SECRET key is read from an environment variable
// and never reaches the browser; card details are handled entirely by Stripe.
//
// Required env var (set in Vercel → Settings → Environment Variables):
//   STRIPE_SECRET_KEY = sk_test_... (test) / sk_live_... (live)
import Stripe from 'stripe'
import {
  coverageForOutcode,
  outcodeOf,
  formatPostcode,
  describeCoverage,
  cleanHouse,
  validHouse,
  propertyAddress,
} from '../src/data/coverage.js'
import { COMPANY } from '../src/data/company.js'

/* If Stripe will not talk to us, the customer must not be left with "try
   again". They came here to buy an EPC; give them the phone number so the
   sale survives the outage. This is what an expired or rotated
   STRIPE_SECRET_KEY looks like from the visitor's side. */
const CANNOT_TAKE_PAYMENT =
  `We cannot take card payments online at the moment. Please call ${COMPANY.phone} or email ${COMPANY.email} and we will book your EPC for you.`

/* Faults that are ours, not the customer's: no point telling them to retry. */
const isConfigFault = (err) =>
  err?.type === 'StripeAuthenticationError' ||
  err?.type === 'StripePermissionError' ||
  err?.code === 'api_key_expired'

// ── EPC pricing ────────────────────────────────────────────────────────────
// £65 for up to 3 bedrooms, then £5 for each additional bedroom.
//   3 bed → £65 · 4 bed → £70 · 5 bed → £75 · 6 bed → £80
// The customer pays the FULL price online — there is no deposit and no
// separate final fee, so the price shown on the landing page is the price
// charged. (Google disapproves ads whose landing page hides part of the cost.)
export const EPC_BASE_PENCE = 6500
export const EPC_PER_EXTRA_BEDROOM_PENCE = 500
export const EPC_BEDROOMS_INCLUDED = 3
export const EPC_MAX_BEDROOMS = 10

/** Price in pence for a given bedroom count. Always recomputed server-side —
 *  the browser sends the bedroom count, never an amount. */
export function epcPricePence(bedrooms) {
  const n = Math.min(Math.max(Math.round(Number(bedrooms) || 0), 1), EPC_MAX_BEDROOMS)
  const extra = Math.max(0, n - EPC_BEDROOMS_INCLUDED)
  return { bedrooms: n, amount: EPC_BASE_PENCE + extra * EPC_PER_EXTRA_BEDROOM_PENCE }
}

// Product catalogue. Amounts are in pence. Edit here to change prices.
//
// This deployment sells one thing. The parent site's other products (the EPC
// Checker membership, and Cavwall before it) are deliberately absent: a
// subscription needs lifecycle webhooks watching it, those live with the site
// that owns the product, and a POST for anything else here gets "Unknown
// product".
const PRODUCTS = {
  epc: {
    mode: 'payment',
    name: 'Energy Performance Certificate',
    description: 'A domestic EPC carried out at your property and lodged on the national register.',
    dynamic: 'epc', // amount comes from epcPricePence(bedrooms)
    postcodeGated: true,
    collectJobDetails: true,
    // We perform inside the 14-day cancellation window, so the customer's
    // express request to start early is part of the order — see the check
    // below and the tick box on the booking page.
    requiresStartConsent: true,
    // After paying, the customer picks preferred dates on /booked. The session
    // id lets that page verify the payment and attach the dates to it.
    successTo: '/booked?session_id={CHECKOUT_SESSION_ID}',
    cancelTo: '/?status=cancelled',
  },
}

// Coverage is a 40-mile ring around Preston, decided by outcode distance:
// see src/data/coverage.js. This is the real gate. The landing page runs the
// same check for feedback as the postcode is typed, but a crafted request
// skips the page, so the decision is made again here before Stripe is called.

/* Where Stripe may send the customer back to. Never trust the caller for this:
   an unpinned return URL is an open redirect on a real payment page. Localhost
   is allowed so `vercel dev` still works. */
const normaliseOrigin = (v) => {
  const s = String(v ?? '').trim().replace(/\/+$/, '')
  if (!s) return null
  return /^https?:\/\//.test(s) ? s : `https://${s}`
}

/* This deployment's own address. PUBLIC_SITE_URL is what you set once a real
   domain is pointed at it; the Vercel variables are provided automatically and
   keep preview deployments working before that. */
const DEFAULT_ORIGIN =
  normaliseOrigin(process.env.PUBLIC_SITE_URL) ||
  normaliseOrigin(process.env.SITE_URL) ||
  normaliseOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
  'http://localhost:3000'

const ALLOWED_ORIGINS = new Set(
  [
    DEFAULT_ORIGIN,
    // The exact deployment this request hit, so preview URLs return correctly.
    normaliseOrigin(process.env.VERCEL_URL),
    'http://localhost:3000',
    'http://localhost:5173',
  ].filter(Boolean),
)
const allowedOrigin = (origin) => (ALLOWED_ORIGINS.has(origin) ? origin : DEFAULT_ORIGIN)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return res.status(503).json({ error: CANNOT_TAKE_PAYMENT, code: 'no_secret_key' })
  }

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = {}
    }
  }
  const { product, postcode, bedrooms, house, startNow } = body || {}

  // hasOwnProperty, not a bare lookup: `{"product":"constructor"}` finds an
  // inherited Object property and slips past a truthiness check.
  const cfg = Object.prototype.hasOwnProperty.call(PRODUCTS, product) ? PRODUCTS[product] : null
  if (!cfg) return res.status(400).json({ error: 'Unknown product.' })

  /* Consumer Contracts Regulations 2013, regs 36(1) and 37(1). We aim to
     book within 24 hours, so the EPC is always carried out inside the 14-day
     cancellation period. Starting early lawfully requires the customer's
     EXPRESS REQUEST, and the right to cancel only ends on full performance if
     they also ACKNOWLEDGED that it would. The booking page captures both in
     one tick; this is the same check server-side, because a crafted request
     skips the page. Without it the certificate could be assessed, lodged and
     paid for, and still cancelled for a full refund on day thirteen. */
  if (cfg.requiresStartConsent && startNow !== true) {
    return res.status(400).json({
      error:
        'Please confirm you are asking us to start within the 14-day cancellation period, so we can book you in straight away.',
    })
  }

  let coverage = null
  if (cfg.postcodeGated) {
    // Validated here as well as on the page: a crafted request skips the form,
    // and without a house number nobody can find the property.
    if (!validHouse(house)) {
      return res.status(400).json({
        error: 'Please tell us the house number or name so we know which property to visit.',
      })
    }
    coverage = await coverageForOutcode(outcodeOf(postcode))
    if (coverage.state !== 'covered') {
      return res.status(400).json({
        error: `${describeCoverage(coverage)} Please call ${COMPANY.phone} and we will see what we can do.`,
      })
    }
  }

  // Dynamic products price themselves from validated inputs. The browser never
  // sends an amount, so a tampered request cannot change what is charged.
  let amount = cfg.amount
  let name = cfg.name
  let beds = null
  if (cfg.dynamic === 'epc') {
    const priced = epcPricePence(bedrooms)
    beds = priced.bedrooms
    amount = priced.amount
    name = `Energy Performance Certificate — ${beds} bedroom${beds === 1 ? '' : 's'}`
  }

  // The booking page is a Google Ads landing page: both return URLs must stay
  // on the same origin the ad points at, with no cross-domain hop.
  const successPath = cfg.successTo || '/?status=success'
  const cancelPath = cfg.cancelTo || '/?status=cancelled'

  // The return address is PINNED server-side. Taking it from the request's
  // Origin header let anyone mint a genuine checkout.stripe.com link, branded
  // with this business, that returned the payer to a site of their choosing —
  // carrying the session id, which is a bearer token for the payer's name,
  // phone and address (see api/booking.js).
  const origin = allowedOrigin(req.headers.origin)
  const stripe = new Stripe(secretKey)

  try {
    const session = await stripe.checkout.sessions.create({
      mode: cfg.mode,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'gbp',
            unit_amount: amount,
            product_data: { name, description: cfg.description },
            ...(cfg.interval ? { recurring: { interval: cfg.interval } } : {}),
          },
        },
      ],
      success_url: `${origin}${successPath}`,
      cancel_url: `${origin}${cancelPath}`,
      billing_address_collection: cfg.postcodeGated ? 'required' : 'auto',
      // We need to know where to go and how to reach them to book the visit.
      // The property address is collected on our own page now, so Stripe is
      // only asked for the things it is better at: who is paying, their email
      // and a phone number to arrange the visit on.
      ...(cfg.collectJobDetails ? { phone_number_collection: { enabled: true } } : {}),
      metadata: {
        product,
        ...(coverage
          ? {
              postcode: formatPostcode(postcode),
              // House number plus postcode is a complete UK address, so this
              // is what the assessor drives to and what the booking email
              // shows. It replaces the "property address" question Stripe
              // used to ask, which made the customer type it a second time.
              property_address: propertyAddress(house, postcode),
              house: cleanHouse(house),
              // Straight-line miles from Preston and the council area, from the
              // outcode lookup, so the order shows at a glance where the job is.
              distance_miles: coverage.miles == null ? 'unknown' : String(coverage.miles),
              district: coverage.district || '',
            }
          : {}),
        ...(beds ? { bedrooms: String(beds) } : {}),
        /* The dated record that the customer asked us to start early and
           accepted the consequence. Stripe timestamps the session itself, but
           storing it explicitly means the evidence survives being read back
           from the PaymentIntent alone. */
        ...(cfg.requiresStartConsent
          ? { early_start_requested_at: new Date().toISOString() }
          : {}),
      },
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    // Log everything server-side, and hand the caller Stripe's own structured
    // error identifiers. type/code/param are enum-like and carry no secrets,
    // but they turn "it just says try again" into a diagnosable fault.
    console.error('Stripe checkout error:', {
      type: err?.type,
      code: err?.code,
      param: err?.param,
      statusCode: err?.statusCode,
      message: err?.message,
      requestId: err?.requestId,
    })
    // Stripe's identifiers are enum-like and carry no secrets, so they are
    // safe to return and turn "it just says try again" into something
    // diagnosable. The message itself is never echoed: it quotes the key.
    return res.status(isConfigFault(err) ? 503 : 500).json({
      error: isConfigFault(err)
        ? CANNOT_TAKE_PAYMENT
        : 'Could not start checkout. Please try again, or call us and we will book it for you.',
      code: [err?.type, err?.code, err?.param].filter(Boolean).join('/') || 'unknown',
    })
  }
}
