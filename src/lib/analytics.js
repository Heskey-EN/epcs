// Consent-gated Google tags: Analytics (GA4) and the Google Ads conversion tag.
//
// PECR requires prior consent before setting non-essential cookies, so NO
// Google script is loaded until the visitor explicitly accepts. Withdrawing
// consent takes effect immediately: the tags are disabled and their cookies
// cleared without a reload. Consent is re-asked after 12 months.
//
// CONVERSION TRACKING (7 Sep 2026). The Google Ads campaign had 149 clicks and
// "0 conversions" because nothing on the site ever reported one. A confirmed
// EPC payment on /epcs/booked now fires a GA4 `purchase` event and a Google
// Ads `conversion` event carrying the amount and a transaction id, both only
// with consent. That undercounts (visitors who reject cookies are invisible
// to Google) but it is the compliant version, and some signal beats none. A
// sale that lands before the visitor has answered the banner is held and sent
// if they accept on the same page.

const GA_ID = 'G-QXW4DLMERL'

// The Google Ads tag ("conversion ID") and the label of the "EPC booked"
// purchase conversion action, from Google Ads → Goals → Conversions → the
// action → Tag setup. These belong to account 124-164-8460
// (george.ecofuturesgb@gmail.com), the account that runs the live campaign;
// the older account 602-206-8184 has its own "EPC booked" action
// (AW-17905030948) which is no longer referenced. Leave either constant empty
// and Ads reporting is simply skipped; GA4 still receives the purchase event.
export const ADS_ID = 'AW-18364780142'
export const ADS_PURCHASE_LABEL = 'x17RCP3uwvAcEO6cgbVE'

const STORAGE_KEY = 'ecofutures-cookie-consent' // 'granted' | 'denied'
const STORAGE_AT = 'ecofutures-cookie-consent-at' // timestamp (ms)
const CONSENT_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 365 // 12 months
const PENDING_KEY = 'ecofutures-pending-conversion' // sessionStorage: a sale awaiting consent
const SENT_PREFIX = 'ecofutures-conversion-sent:' // sessionStorage: one report per order

let gaLoaded = false

// Returns 'granted' | 'denied' | null. Expired consent returns null so the
// banner re-appears and the visitor re-confirms.
export function getConsent() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (!value) return null
    const at = Number(localStorage.getItem(STORAGE_AT) || 0)
    if (at && Date.now() - at > CONSENT_MAX_AGE_MS) return null
    return value
  } catch {
    return null
  }
}

const session = {
  get(key) {
    try {
      return sessionStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key, value) {
    try {
      sessionStorage.setItem(key, value)
    } catch {
      /* storage unavailable: report once, cannot de-duplicate */
    }
  },
  remove(key) {
    try {
      sessionStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  },
}

function loadGa() {
  if (gaLoaded || typeof window === 'undefined') return
  gaLoaded = true

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    window.dataLayer.push(arguments)
  }

  // Consent Mode: declare the default (everything denied) and, because this
  // only ever runs after the visitor accepted, the update. Ad personalisation
  // stays denied: we measure whether adverts lead to bookings, we do not build
  // audiences or remarket. The Google Ads config sits on the same gtag.js.
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  })
  window.gtag('consent', 'update', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'denied',
    analytics_storage: 'granted',
  })
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, { anonymize_ip: true })
  if (ADS_ID) window.gtag('config', ADS_ID, { allow_ad_personalization_signals: false })

  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(s)

  flushPendingPurchase()
}

// Immediately stop the tags and delete the cookies they may have set.
function disableGa() {
  if (typeof window === 'undefined') return
  window[`ga-disable-${GA_ID}`] = true
  if (ADS_ID) window[`ga-disable-${ADS_ID}`] = true
  const past = 'Thu, 01 Jan 1970 00:00:00 GMT'
  const host = window.location.hostname
  const scopes = ['', `; domain=${host}`, `; domain=.${host}`]
  document.cookie.split(';').forEach((c) => {
    const name = c.split('=')[0].trim()
    // _ga* are Analytics; _gcl* and _gac* are the Ads conversion cookies.
    if (/^_ga|^_gid|^_gat|^_gcl|^_gac/.test(name)) {
      scopes.forEach((scope) => {
        document.cookie = `${name}=; expires=${past}; path=/${scope}`
      })
    }
  })
}

// Record a preference and act on it immediately. value: 'granted' | 'denied'
export function setConsent(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value)
    localStorage.setItem(STORAGE_AT, String(Date.now()))
  } catch {
    /* storage unavailable — treat as session-only */
  }
  if (value === 'granted') {
    if (typeof window !== 'undefined') {
      window[`ga-disable-${GA_ID}`] = false
      if (ADS_ID) window[`ga-disable-${ADS_ID}`] = false
    }
    loadGa()
  } else {
    session.remove(PENDING_KEY)
    disableGa()
  }
}

// Call once on app start: load the tags only if consent was previously granted.
export function initAnalytics() {
  if (getConsent() === 'granted') loadGa()
}

// SPA page-view tracking (GA only fires the first one automatically).
export function trackPageView(path) {
  if (gaLoaded && typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', { page_path: path })
  }
}

/** Any GA4 event. Dropped silently without consent. */
export function trackEvent(name, params = {}) {
  if (gaLoaded && typeof window.gtag === 'function') {
    window.gtag('event', name, params)
  }
}

/**
 * A confirmed EPC payment. Reported once per order; if consent has not been
 * given yet it is held and sent should the visitor accept the banner on this
 * page. `transactionId` must never be the Stripe Checkout Session id: that is
 * a bearer token for the customer's details (see api/booking.js). The
 * PaymentIntent id is used instead.
 */
export function trackPurchase({ transactionId, value, currency = 'GBP', itemName = 'Energy Performance Certificate' }) {
  if (typeof window === 'undefined' || !transactionId) return
  const record = { transactionId, value: Number(value) || 0, currency, itemName }
  if (!gaLoaded) {
    session.set(PENDING_KEY, JSON.stringify(record))
    return
  }
  sendPurchase(record)
}

function sendPurchase(record) {
  const key = SENT_PREFIX + record.transactionId
  if (session.get(key)) return
  window.gtag('event', 'purchase', {
    transaction_id: record.transactionId,
    value: record.value,
    currency: record.currency,
    items: [{ item_name: record.itemName, quantity: 1, price: record.value }],
  })
  if (ADS_ID && ADS_PURCHASE_LABEL) {
    window.gtag('event', 'conversion', {
      send_to: `${ADS_ID}/${ADS_PURCHASE_LABEL}`,
      value: record.value,
      currency: record.currency,
      transaction_id: record.transactionId,
    })
  }
  session.set(key, '1')
  session.remove(PENDING_KEY)
}

function flushPendingPurchase() {
  const raw = session.get(PENDING_KEY)
  if (!raw) return
  try {
    sendPurchase(JSON.parse(raw))
  } catch {
    session.remove(PENDING_KEY)
  }
}
