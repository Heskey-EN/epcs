// Where we carry out EPCs: anywhere within 40 miles of Preston, as the crow
// flies (George, 7 Sep 2026). That takes in Blackpool, Blackburn, Burnley,
// Bolton, Wigan, Lancaster, Warrington, Manchester, Liverpool and the Wirral;
// the edge of the ring sits around Chester, Kendal, Bradford and Huddersfield.
//
// This module is shared by the browser (src/pages/Epcs.jsx: postcode parsing
// and copy) and the server (api/coverage.js and api/checkout.js: the distance
// lookup). Keep it free of anything browser-only or Node-only.
//
// HOW THE CHECK WORKS. A postcode's outcode (the part before the space, e.g.
// "BL1") is looked up on postcodes.io, which returns the district centroid
// from the ONS Postcode Directory, and the straight-line distance to the
// centre of Preston is compared with the radius. Only the outcode is ever sent
// to postcodes.io; the full postcode stays on this site. District centroids
// are accurate to a couple of miles, which is fine for a 40-mile ring, and
// results are cached because only ~150 outcodes fall inside it.
//
// If postcodes.io cannot be reached, the check falls back to the list of
// postcode AREAS the ring touches. That list is deliberately generous (parts
// of LA, SK, CH, BD and HD lie outside the ring) so a lookup outage never
// stops a genuine customer paying. The order carries the postcode, the miles
// and the council area either way, so a job at the very edge is George's call.

export const COVERAGE = {
  from: 'Preston',
  // The PR1 outcode centroid from postcodes.io (ONS Postcode Directory).
  centre: { lat: 53.757321, lng: -2.701587 },
  radiusMiles: 40,
  // For copy, nearest first. All measured inside the ring on 7 Sep 2026
  // (Blackburn 10 mi, Bolton 16, Lancaster 20, Warrington 26, Liverpool 27,
  // Manchester 27, Oldham 28, Stockport 33).
  towns: [
    'Blackpool',
    'Blackburn',
    'Bolton',
    'Wigan',
    'Lancaster',
    'Warrington',
    'Manchester',
    'Liverpool',
    'Burnley',
    'Southport',
    'Chorley',
    'Oldham',
    'Stockport',
    'the Wirral',
  ],
  // Postcode areas the ring touches: the fallback when the lookup is down.
  fallbackAreas: ['PR', 'FY', 'BB', 'BL', 'WN', 'LA', 'WA', 'L', 'M', 'OL', 'SK', 'CH', 'HX', 'BD', 'HD'],
}

/** "within 40 miles of Preston" */
export const coverageLabel = () => `within ${COVERAGE.radiusMiles} miles of ${COVERAGE.from}`

/** "Blackpool, Blackburn, Bolton, Wigan, Lancaster, Warrington, Manchester and Liverpool" */
export const coverageTowns = (limit = 8) => {
  const list = COVERAGE.towns.slice(0, limit)
  return list.length > 1 ? `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}` : list.join('')
}

// ── Postcode parsing ────────────────────────────────────────────────────────

/** Uppercase, no spaces or punctuation: "pr1 2ab" → "PR12AB". */
export const normalisePostcode = (raw) =>
  String(raw || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')

// Outcode: area (1–2 letters), district (a digit, then an optional digit or
// letter). Inward code: a digit and two letters.
const OUTCODE = /^[A-Z]{1,2}\d[A-Z\d]?$/
const FULL = /^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})$/

/** The outcode of a full or partial postcode, or null if it has no valid shape. */
export const outcodeOf = (raw) => {
  const s = normalisePostcode(raw)
  if (!s) return null
  const full = FULL.exec(s)
  if (full) return full[1]
  return OUTCODE.test(s) ? s : null
}

/** "pr12ab" → "PR1 2AB"; anything else uppercased with spaces collapsed. */
export const formatPostcode = (raw) => {
  const s = normalisePostcode(raw)
  const full = FULL.exec(s)
  return full ? `${full[1]} ${full[2]}` : s
}

/** "BL1" → "BL" */
export const postcodeAreaOf = (outcode) => String(outcode || '').replace(/\d.*$/, '')

/**
 * The house number or name, tidied. Together with the postcode this is a
 * complete UK address, which is why the order form asks for nothing more.
 * Control characters are stripped because the value ends up in Stripe
 * metadata and in an email. Letters, digits and ordinary address punctuation
 * survive, so "Flat 2, 14A" and "Rose Cottage" both pass.
 */
export const HOUSE_MAX = 60
export const cleanHouse = (raw) =>
  String(raw ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/[^A-Za-z0-9 '\-,./]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, HOUSE_MAX)

/** A house number or name is usable when it has at least one letter or digit. */
export const validHouse = (raw) => /[A-Za-z0-9]/.test(cleanHouse(raw))

/** "14a" + "pr1 9ys" → "14A, PR1 9YS" — what the assessor drives to. */
export const propertyAddress = (house, postcode) =>
  [cleanHouse(house), formatPostcode(postcode)].filter(Boolean).join(', ')

// ── Distance ────────────────────────────────────────────────────────────────

const toRad = (deg) => (deg * Math.PI) / 180

/** Great-circle distance in statute miles. */
export const milesBetween = (a, b) => {
  const R = 3958.7613
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// ── The check ───────────────────────────────────────────────────────────────
// Result shape, everywhere:
//   { state: 'covered' | 'outside' | 'invalid',
//     outcode, miles (number | null), district (string | null),
//     source: 'lookup' | 'fallback' | 'shape' }

/** Area-list decision, used when the lookup is unavailable. */
export const fallbackCoverage = (outcode) => {
  const oc = outcodeOf(outcode)
  if (!oc) return { state: 'invalid', outcode: null, miles: null, district: null, source: 'shape' }
  return {
    state: COVERAGE.fallbackAreas.includes(postcodeAreaOf(oc)) ? 'covered' : 'outside',
    outcode: oc,
    miles: null,
    district: null,
    source: 'fallback',
  }
}

const cache = new Map() // outcode → { result, expires }
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

/**
 * Server-side: distance of an outcode from Preston via postcodes.io, with the
 * area-list fallback on any failure. Never throws.
 */
export async function coverageForOutcode(outcode, { fetchImpl, timeoutMs = 3500, now = Date.now } = {}) {
  const oc = outcodeOf(outcode)
  if (!oc) return { state: 'invalid', outcode: null, miles: null, district: null, source: 'shape' }

  const hit = cache.get(oc)
  if (hit && hit.expires > now()) return hit.result

  const doFetch = fetchImpl || globalThis.fetch
  let result
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    let res
    try {
      res = await doFetch(`https://api.postcodes.io/outcodes/${encodeURIComponent(oc)}`, {
        signal: controller.signal,
        headers: { accept: 'application/json' },
      })
    } finally {
      clearTimeout(timer)
    }

    if (res.status === 404) {
      // A well-formed outcode that does not exist ("PR12").
      result = { state: 'invalid', outcode: oc, miles: null, district: null, source: 'lookup' }
    } else if (!res.ok) {
      throw new Error(`postcodes.io responded ${res.status}`)
    } else {
      const body = await res.json()
      const r = body && body.result
      if (!r || typeof r.latitude !== 'number' || typeof r.longitude !== 'number') {
        throw new Error('postcodes.io returned no centroid')
      }
      // Decide on the rounded figure so the message and the decision agree:
      // "about 40 miles" is covered, "about 41 miles" is not.
      const miles = Math.round(milesBetween(COVERAGE.centre, { lat: r.latitude, lng: r.longitude }))
      const district = Array.isArray(r.admin_district) ? r.admin_district.join(' / ') : r.admin_district || null
      result = {
        state: miles <= COVERAGE.radiusMiles ? 'covered' : 'outside',
        outcode: oc,
        miles,
        district,
        source: 'lookup',
      }
    }
  } catch {
    result = fallbackCoverage(oc)
  }

  if (result.source === 'lookup') cache.set(oc, { result, expires: now() + CACHE_TTL_MS })
  return result
}

/** One plain sentence for the customer. No em-dashes: house style. */
export const describeCoverage = (c) => {
  const { from, radiusMiles } = COVERAGE
  switch (c && c.state) {
    case 'covered':
      return c.miles != null && c.miles >= 3
        ? `We cover your area. ${c.outcode} is about ${c.miles} miles from ${from}.`
        : 'We cover your area.'
    case 'outside':
      return c.miles != null
        ? `${c.outcode} is about ${c.miles} miles from ${from}, outside the ${radiusMiles}-mile area we book online.`
        : `${c.outcode} looks to be outside the ${radiusMiles}-mile area around ${from} that we book online.`
    case 'invalid':
      return c.source === 'lookup'
        ? `We cannot find the postcode area ${c.outcode}. Please check it.`
        : 'That does not look like a UK postcode.'
    default:
      return ''
  }
}
