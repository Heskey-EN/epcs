// Vercel serverless function: is this postcode inside the area we cover?
//
//   GET /api/coverage?outcode=BL1
//   → { state: 'covered', outcode: 'BL1', miles: 16, district: 'Bolton', source: 'lookup' }
//
// The landing page calls this as the postcode is typed so the customer gets
// an answer before they reach the pay button. It exists so the browser never
// talks to postcodes.io itself: our server sends only the outcode, and the
// decision logic lives in one place (src/data/coverage.js) that the checkout
// function reuses as the real gate.
//
// Responses are cacheable at the CDN: a district's distance from Preston does
// not change, and there are only a few thousand outcodes in the country.
// Fallback answers (lookup unavailable) are never cached.
import { coverageForOutcode, outcodeOf } from '../src/data/coverage.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const query = req.query || {}
  const outcode = outcodeOf(query.outcode ?? query.postcode ?? '')
  if (!outcode) {
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({ state: 'invalid', outcode: null, miles: null, district: null, source: 'shape' })
  }

  const result = await coverageForOutcode(outcode)
  res.setHeader(
    'Cache-Control',
    result.source === 'lookup' ? 'public, max-age=86400, s-maxage=604800' : 'no-store',
  )
  return res.status(200).json(result)
}
