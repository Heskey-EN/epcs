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
// Default is YES, since 2026-09-12. It was NO while this was a hedge deployment
// standing behind ecofutures.uk/epcs — two indexable copies of one page compete,
// and the established domain would have lost ground to a new one with no
// authority. That is no longer the situation: this is the primary site, it is
// where the ads point, and it is the only one being worked on. A commercial site
// that refuses to be found in organic search is leaving free traffic on the
// table for no remaining reason.
//
// /booked stays out of the index either way — its URL carries a Stripe session
// id, which unlocks the payer's name, phone and address. That exclusion lives in
// scripts/prerender.mjs, not here.
//
// Set INDEXABLE=false in the environment to close it again — useful for a
// staging deployment, which should never be indexed.
export const INDEXABLE =
  !['false', '0', 'no', 'off'].includes(
    String(import.meta.env.VITE_INDEXABLE ?? '').trim().toLowerCase(),
  )
