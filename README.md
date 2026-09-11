# Eco Futures — EPC booking site

A standalone version of the domestic EPC booking page, split out of the main
[ecofutures.uk](https://www.ecofutures.uk) site so it can be deployed on its own
domain, independently of everything else the business publishes.

It sells one thing: a domestic Energy Performance Certificate. `£65` covers a
home with up to three bedrooms, then `£5` for each additional bedroom, paid in
full online with nothing to pay afterwards.

## Why it exists

The booking page is the destination of a Google Ads campaign. When the whole
business shares one domain, anything that goes wrong anywhere on that domain —
a policy flag, a manual action, a hosting problem — takes the booking page down
with it. This deployment is a hedge: the same page, the same checkout, on a
domain of its own, ready to point an ad at.

**It is a copy, not an extraction.** The page still exists at
`ecofutures.uk/epcs` and the two codebases will drift apart. A fix to the
booking flow, the pricing, the coverage area or the legal pages needs applying
in **both** repositories.

## Routes

| Route               | What it is                                                        |
| ------------------- | ----------------------------------------------------------------- |
| `/`                 | The booking page. Hero, price, order form, checkout.               |
| `/booked`           | Where Stripe returns a paying customer to choose their dates.      |
| `/cancellation-form`| The Consumer Contracts Regulations 2013 Sch 3 Pt B model form.     |
| `/privacy`          | Privacy policy.                                                    |
| `/cookies`          | Cookie policy.                                                     |
| `/terms`            | Terms of use.                                                      |

Anything else returns a real `404`.

## Getting it running

```bash
npm install
cp .env.example .env    # then fill in STRIPE_SECRET_KEY
npm run dev
```

The order form calls `/api/checkout`, which is a serverless function. `npm run
dev` serves the front end only, so use `vercel dev` if you need to click all the
way through to Stripe locally.

## Build

```bash
npm run build
```

Three steps, in order:

1. `vite build` — the client bundle and `dist/index.html`, a shell with an empty
   `#root`.
2. `vite build --ssr` — the same app, renderable in Node.
3. `node scripts/prerender.mjs` — renders every route to real HTML and writes
   `dist/<route>/index.html`, plus `dist/404.html` and `dist/robots.txt`.

Step 3 is not optional decoration. Crawlers — and **Google Ads' own
landing-page review** — fetch the destination URL without running JavaScript. An
ad pointing at an empty `<div id="root">` is a disapproval waiting to happen.
The build fails rather than shipping a route that did not pre-render.

## Environment variables

Set these in Vercel → Settings → Environment Variables. `.env.example` documents
the same list.

| Variable                  | Where       | What it does                                                                                             |
| ------------------------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `SITE_URL`                | build       | This deployment's canonical origin. Drives canonical tags, JSON-LD `@id`s and the sitemap.                 |
| `PUBLIC_SITE_URL`         | server      | The same value, for the serverless functions — they do not see the build-time injection. Set both.         |
| `INDEXABLE`               | build       | `true` opens the site to search engines. **Unset means noindex** — see below.                              |
| `STRIPE_SECRET_KEY`       | server      | `sk_live_…` / `sk_test_…`. Never reaches the browser.                                                      |
| `STRIPE_WEBHOOK_SECRET`   | server      | `whsec_…` from the Stripe webhook. Without it the webhook rejects every request.                           |
| `RESEND_API_KEY`          | server      | `re_…` for the booking notification emails. Server-only — never prefix it `VITE_`.                          |
| `BOOKINGS_EMAIL`          | server      | Where notifications go. Defaults to `COMPANY.email`.                                                        |
| `BOOKINGS_FROM`           | server      | The `From:` address. Blank uses Resend's shared domain, which needs no DNS.                                 |

### How you find out you have a booking

Two emails per sale, both sent **server-side**, neither depending on the
customer's browser:

1. **`api/stripe-webhook.js`** — Stripe calls it on `checkout.session.completed`,
   the instant the payment clears. Address, postcode, bedrooms, amount, name,
   phone, email, distance from Preston. This one is guaranteed: it arrives
   whether or not the customer stays on the page.
2. **`api/booking.js`** — when they choose their preferred dates, you get those
   too.

This used to be EmailJS called from the customer's browser on `/booked`, which
meant a customer who paid and closed the tab generated **no notification at
all**. If you are ever tempted to move sending back to the client, that is why
it is not there.

Duplicate protection: Stripe redelivers events, so the webhook stamps
`notified_at` on the PaymentIntent and skips any repeat. A retryable send
failure returns 500 so Stripe tries again for up to three days; a
misconfiguration returns 200 so the endpoint is not disabled over a missing key.

**Setting up the Stripe webhook:** Stripe Dashboard → Developers → Webhooks →
Add endpoint → `https://www.fastepcs.com/api/stripe-webhook`, event
`checkout.session.completed`. Copy the signing secret into
`STRIPE_WEBHOOK_SECRET` and redeploy — environment variables bind at build
time, so a new variable does nothing until the next deploy.

If `SITE_URL` is unset the build falls back to `VERCEL_PROJECT_PRODUCTION_URL`,
which Vercel provides automatically, so a fresh deployment works before a domain
is attached. Nothing in this repo hardcodes a hostname.

### This site is noindex by default

`robots.txt` says `Disallow: /`, every page carries
`<meta name="robots" content="noindex, nofollow">`, and no sitemap is written.

That is deliberate. This is a second copy of a page that is already published at
`ecofutures.uk/epcs`, and two indexable copies of the same content compete with
each other in search — the established domain would lose ground to a new one
with no authority. The deployment exists to receive **paid** traffic, which does
not need indexing.

Set `INDEXABLE=true` only if this domain becomes the primary home for the
booking page and `ecofutures.uk/epcs` is removed or canonicalised to it.

`/booked` stays noindex either way: its URL carries a Stripe session id, which
is an unauthenticated bearer token for the payer's name, email, phone and
address.

## `vercel.json` has no rewrites, and must not get any

Vercel serves `dist/<route>/index.html` for `/<route>` on its own, and serves
`dist/404.html` with a real `404` status for anything else. A catch-all rewrite
to `/index.html` breaks that: every unknown URL starts answering `200` with a
full page of content. `/wp-login.php`, `/shell.php`, `/.env` — all `200`, all
serving the homepage. That is a soft 404 to a search engine and the exact
fingerprint of a compromised site to an automated classifier. The parent site
had one, and it cost real money to find out.

If a route ever 404s that should not, add it to `ROUTE_META` in
`src/data/routeMeta.js` so it gets pre-rendered. Do not add a rewrite.

## How the money works

- The browser sends a **bedroom count**, never an amount. `api/checkout.js`
  recomputes the price and creates the Stripe Checkout Session, so a tampered
  request cannot change what is charged.
- The **postcode gate** is enforced server-side as well as on the page: coverage
  is a 40-mile ring around Preston (`src/data/coverage.js`), and a crafted
  request that skips the form is checked again before Stripe is called.
- The **return URL is pinned server-side**. Taking it from the request's
  `Origin` header would let anyone mint a genuine `checkout.stripe.com` link,
  branded with this business, that returned the payer to a site of their
  choosing — carrying the session id.
- If Stripe will not authenticate, the customer gets the **phone number**, not
  "try again". An expired key should cost a phone call, not a sale.

## Analytics and ads

`src/lib/analytics.js` is consent-gated: nothing loads until the cookie banner
is accepted, and consent expires after 12 months. It reports to the same GA4
property and Google Ads conversion action as the parent site, so a sale booked
here optimises the same campaign. Page views are recorded **path only** — never
the query string, because `/booked?session_id=…` would put personal data into
Google Analytics.

## Layout

```
api/            serverless functions: checkout, booking, coverage lookup
scripts/        prerender.mjs — the build step that makes the HTML real
src/
  components/   header, footer, cookie banner, shared page furniture
  data/         company details, coverage ring, route metadata, JSON-LD,
                site.js (the canonical origin, and INDEXABLE)
  lib/          analytics
  pages/        Book, Booked, CancellationForm, Privacy, Cookies, Terms
```
