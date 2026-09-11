// Sends George the booking notifications, server-side, via Resend.
//
// SERVER-SIDE IS THE POINT. This used to be EmailJS called from the customer's
// browser on /booked, which meant the email only existed if they completed the
// date form afterwards — pay and close the tab and the booking arrived silently.
// A notification that depends on the customer doing something after they have
// already paid is the wrong shape for a business whose promise is "we ring you
// within 24 hours".
//
// Underscore prefix so Vercel does not expose this as a route; it is a helper
// imported by api/stripe-webhook.js and api/booking.js.
//
// Env (Vercel → Settings → Environment Variables):
//   RESEND_API_KEY   re_...  — server-only, never VITE_
//   BOOKINGS_EMAIL   where notifications go     (default: COMPANY.email)
//   BOOKINGS_FROM    the From: address          (default: Resend's shared domain)
//
// BOOKINGS_FROM defaults to onboarding@resend.dev, which Resend lets any account
// send from with no DNS setup. That is fine for mail to yourself. To send from
// bookings@fastepcs.com — needed before you ever email a CUSTOMER — verify the
// domain in Resend, add the DNS records it gives you, then set this.
import { COMPANY } from '../src/data/company.js'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const DEFAULT_FROM = 'Eco Futures Bookings <onboarding@resend.dev>'

/* A failure we can retry our way out of (network blip, Resend having a moment)
   versus one that will fail identically forever (no key, bad key, unverified
   sender). The caller uses this to decide whether to ask Stripe to redeliver
   the webhook — retrying a missing API key just burns deliveries and gets the
   endpoint disabled. Mirrors isConfigFault in api/checkout.js. */
export const isRetryable = (err) => err?.retryable === true

const escapeHtml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

/**
 * Send one notification.
 * @returns {Promise<{sent: boolean, skipped?: string}>}
 * @throws  {Error & {retryable?: boolean}} when Resend refuses the message
 */
export async function sendNotification({ subject, lines }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    // Not an error the customer should ever feel: their payment went through and
    // Stripe has emailed George its own receipt. Log loudly and carry on.
    console.error('notify: RESEND_API_KEY is not set — no booking email sent.')
    return { sent: false, skipped: 'no_api_key' }
  }

  const to = process.env.BOOKINGS_EMAIL || COMPANY.email
  const from = process.env.BOOKINGS_FROM || DEFAULT_FROM
  const text = lines.join('\n')

  let res
  try {
    res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
        // Monospace so the aligned columns below survive in a mail client.
        html: `<pre style="font:14px/1.5 ui-monospace,Menlo,Consolas,monospace">${escapeHtml(text)}</pre>`,
      }),
    })
  } catch (e) {
    const err = new Error(`notify: could not reach Resend — ${e?.message}`)
    err.retryable = true
    throw err
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    const err = new Error(`notify: Resend returned ${res.status} — ${detail.slice(0, 300)}`)
    // 429 and 5xx are worth another go; 401/403/422 (bad key, unverified
    // sender, malformed payload) will fail the same way every time.
    err.retryable = res.status === 429 || res.status >= 500
    throw err
  }

  return { sent: true }
}

/** The details of a paid order, formatted the way George reads them. */
export function bookingLines(order, { heading, sessionId, dates }) {
  const line = (label, value) => `${(label + ':').padEnd(13)}${value || '(not given)'}`
  const out = [
    heading,
    '='.repeat(heading.length),
    '',
    line('Property', order.propertyAddress),
    line('Postcode', order.postcode),
    line('Bedrooms', order.bedrooms),
    line('Paid', order.amount == null ? '' : `£${order.amount}`),
    '',
    line('Customer', order.name),
    line('Phone', order.phone),
    line('Email', order.email),
  ]

  if (dates) {
    out.push(
      '',
      line('Preferred', dates.preferredDate),
      line('Alternative', dates.altDate),
      line('Time', dates.timeSlot),
      line('Notes', dates.notes),
    )
  }

  out.push('', line('Stripe ref', sessionId))
  return out
}
