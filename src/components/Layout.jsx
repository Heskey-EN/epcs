import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import CookieBanner from './CookieBanner.jsx'
import { initAnalytics, trackPageView } from '../lib/analytics.js'
import { metaFor } from '../data/routeMeta.js'

export default function Layout() {
  const location = useLocation()

  // Load analytics once, only if consent was previously granted.
  useEffect(() => {
    initAnalytics()
  }, [])

  // Keep <title>/<meta description> correct on client-side navigation.
  // Each route is pre-rendered with its own head tags (scripts/prerender.mjs),
  // which is what crawlers read; this keeps them right once React takes over
  // and the visitor moves between pages without a reload.
  useEffect(() => {
    if (typeof document === 'undefined') return
    const { title, description } = metaFor(location.pathname)
    document.title = title
    const tag = document.querySelector('meta[name="description"]')
    if (tag) tag.setAttribute('content', description)
  }, [location.pathname])

  // Record SPA page views (GA only auto-fires the first one).
  //
  // PATH ONLY — never the query string. Stripe returns a paying customer to
  // /epcs/booked?session_id=cs_live_… and that id is an unauthenticated bearer
  // token for their name, email, phone and home address (api/booking.js). Sending
  // it to Google would put personal data in GA — against Google's own terms and
  // UK GDPR Art. 5(1)(f) — and leave the key readable by anyone with analytics
  // access. No page on this site needs its query string for analytics.
  useEffect(() => {
    trackPageView(location.pathname)
  }, [location.pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CookieBanner />
    </div>
  )
}
