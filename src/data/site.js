// The canonical origin for THIS deployment.
//
// This repo is a standalone copy of the Eco Futures EPC booking flow, built so
// it can run on its own domain independently of ecofutures.uk. Nothing here
// may hardcode a hostname: canonical tags, JSON-LD @ids, the sitemap and the
// Stripe return URLs all derive from this one value, and a wrong host in any
// of them is an SEO or checkout fault that is easy to ship and hard to notice.
//
// Resolution order, set in vite.config.js at build time:
//   1. SITE_URL                        — set this in Vercel for a custom domain
//   2. VERCEL_PROJECT_PRODUCTION_URL   — Vercel provides this automatically
//   3. http://localhost:5173           — local development
//
// The server side (api/checkout.js) resolves the same value from process.env
// directly, because serverless functions do not see Vite's define.

export const SITE = (import.meta.env.VITE_SITE_URL || 'http://localhost:5173').replace(/\/+$/, '')

/** Absolute URL for a path on this deployment: url('/booked') → https://…/booked */
export const url = (path = '/') => `${SITE}${path === '/' ? '' : path}`

// Whether this deployment should be indexed by search engines.
//
// Default is NO. This site is a copy of the booking page that already exists at
// ecofutures.uk/epcs, and two indexable copies of the same content compete with
// each other: the established domain would lose ground to a new one with no
// authority, which is the opposite of what a hedge deployment is for. It exists
// to receive paid traffic, which does not require indexing.
//
// Set INDEXABLE=true in the environment only if this domain becomes the primary
// home for the booking page and ecofutures.uk/epcs is removed or canonicalised
// to it.
export const INDEXABLE = String(import.meta.env.VITE_INDEXABLE || '') === 'true'
