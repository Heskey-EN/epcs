// Per-route <title> and <meta description>.
//
// A crawler, and Google Ads' own landing-page review, reads these WITHOUT
// running JavaScript. They are baked into each route's HTML at build time by
// scripts/prerender.mjs and applied again at runtime on client-side navigation
// by the Layout, so the two can never disagree.
//
// This deployment sells one thing, so the booking page is the site root rather
// than living at /epcs.

export const DEFAULT_META = {
  title: 'Book a Home EPC for £65 | Eco Futures',
  description:
    'Book an accredited domestic Energy Performance Certificate online from £65. Elmhurst-accredited assessor, certificate lodged on the national register.',
}

export const ROUTE_META = {
  '/': {
    title: 'Book a Home EPC for £65 | Eco Futures',
    description:
      'Book an accredited domestic Energy Performance Certificate online. £65 for up to 3 bedrooms, then £5 per extra bedroom. Covering 40 miles of Preston.',
  },
  '/booked': {
    title: 'Choose your EPC appointment | Eco Futures',
    description: 'Pick a date for your EPC assessment. We will call to confirm.',
  },
  // Required by the Consumer Contracts Regulations 2013 (Sch 3 Pt B).
  '/cancellation-form': {
    title: 'EPC cancellation form | Eco Futures',
    description:
      'Cancel an EPC you booked online. You have 14 days from the day after you order to cancel for a full refund.',
  },
  '/privacy': {
    title: 'Privacy Policy | Eco Futures',
    description: 'How Eco Futures collects, uses and protects your personal data.',
  },
  '/cookies': {
    title: 'Cookie Policy | Eco Futures',
    description: 'The cookies this website uses and how to control them.',
  },
  '/terms': {
    title: 'Terms of Use | Eco Futures',
    description: 'The terms on which you may use this website, including EPC payment and cancellation.',
  },
}

export const metaFor = (pathname) => ROUTE_META[pathname] || DEFAULT_META
