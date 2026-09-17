# fastepcs.com blog — SEO & publishing playbook

**Last strategy review:** 17 September 2026
**Owner:** George Hesketh (Eco Futures). Daily posts and the weekly review are run by Claude as scheduled tasks.

This file is the brief every daily post follows. The weekly SEO review keeps it current: it may edit any section, and logs what changed in the change log at the bottom. If this file and a scheduled task prompt disagree, this file wins — except the **Non-negotiables**, which only George changes.

---

## 1. What the blog is for

fastepcs.com is the booking site for Eco Futures domestic EPCs (40 miles of Preston) and the destination of a Google Ads campaign. The blog exists to earn **organic** traffic from people who will need an EPC or advice about one:

- **Landlords** in Lancashire, Greater Manchester, Merseyside and the wider North West facing MEES / EPC C by 2030, the rental property register, exemptions and compliance.
- **Homeowners and landlords looking for funding** — Warm Homes Plan grants and loans, Warm Homes: Local Grant, Boiler Upgrade Scheme, ECO successors.
- **Sellers and buyers** — EPCs when selling, how long they last, lenders and green mortgages, local market angles.

Every post should leave the reader knowing what changed, whether it affects them, and what to do next — and, where it's natural, that an accredited local assessor can help.

## 2. Non-negotiables (only George changes these)

1. **Original writing only.** Summarise news in our own words and add what it means for North West property owners. Never copy paragraphs, never rewrite one article sentence-by-sentence, never "spin" text. A direct quote is allowed only when short (under ~25 words), in quotation marks and attributed — and only if the exact wording was verified on the source page.
2. **Every post credits its sources** in the `sources` front matter (the build fails without one). Every fact, date, figure and quote in the post must be traceable to a listed source. Prefer primary sources (GOV.UK, legislation.gov.uk, DESNZ, MHCLG, Ofgem, council sites) and use trade press (Landlord Today, Property Industry Eye, NRLA, Propertymark, Elmhurst, ECMK) for the news hook — confirm key facts against the primary source where one exists.
3. **Nothing invented.** No made-up statistics, customer stories, case studies, testimonials, quotes, or claims about how many EPCs we've done. Speak as the business ("we", "our assessors") only in general, verifiable terms.
4. **Byline is "Eco Futures".** Don't name George or other people as author.
5. **Don't quote our prices in posts** — link to the booking page (`/`) instead. Prices live in one place so they can't go stale.
6. **General information, not advice.** No legal or financial recommendations; tell readers to check official guidance where it matters.
7. **Protect the ads landing page.** Daily runs only add or edit files in `content/blog/` and `docs/blog/`. The weekly review may also change blog code (`scripts/build-blog.mjs`, `src/lib/blog.js`, `src/pages/Blog*.jsx`, `src/components/BlogCta.jsx`, the blog parts of `scripts/prerender.mjs`, the blog nodes in `src/data/schema.js`) but never the booking page, header, pricing, checkout, `api/`, legal pages, `vercel.json`, or the Google Ads checks in `scripts/ads-audit.mjs`. `npm run build` (which runs the ads audit) must pass before anything is pushed.
8. **One new post per day, published at ~7am UK time.** If there is no genuinely new and relevant story, publish an evergreen guide from `docs/blog/TOPIC-BACKLOG.md` instead. Never publish a near-duplicate of an existing post — update the older post (set `updated:`) and write something different for the day.

## 3. What Google rewards and punishes (research summary)

- **Scaled content abuse** is the main risk for a daily, AI-assisted blog. Google's spam policies define it as "many pages … generated for the primary purpose of manipulating search rankings and not helping users", and give "using generative AI tools … to generate many pages without adding value for users" and scraping "including through automated transformations like synonymizing" as examples. The August 2026 spam update (18–21 Aug 2026) hit programmatic and AI-filler sites hard, and recovery takes months. Our defence: one useful post a day, real local and practical value, strict sourcing, no filler, no templated near-duplicates.
- **AI use is allowed** if the content is accurate, useful and people-first. Google recommends telling readers how content was made — every post page carries a short note saying it was drafted with AI tools and checked against the sources.
- **Answer first.** AI Overviews and AI Mode cite pages that answer clearly and early: a top summary (the "In short" box, from `summary:`), descriptive question-style H2s, tables for dates and figures, and a practical "what to do" section. Length should fit the topic — usefulness over word count.
- **Topical depth beats keyword chasing.** Build clusters (section 5) and link posts within a cluster. Broad head terms increasingly end in zero-click AI answers; aim at questions that need a local provider or a next action.
- **Freshness must be real.** Only set `updated:` when the facts changed. The sitemap uses real post dates, never the build date.
- **Structured data must match the page.** Each post emits `BlogPosting` (author = the Organization shown in the byline, datePublished/dateModified with the UK offset, citations = the Sources list) and `BreadcrumbList`. Don't add FAQ markup unless the Q&A is visible on the page.
- **Entity and brand signals** (Google Business Profile, directory listings, consistent name/address/phone, mentions on landlord forums and local sites) increasingly influence both rankings and AI citations. These are off-site actions for George; the weekly review should suggest them when useful.

Research sources (September 2026):
- Google Search Central, Spam policies — https://developers.google.com/search/docs/essentials/spam-policies
- Google Search Central, Using generative AI content (updated 10 Dec 2025) — https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
- Google Search Central, Article structured data (updated 8 Sep 2026) — https://developers.google.com/search/docs/appearance/structured-data/article
- GSQI, August 2026 Google spam update case studies — https://www.gsqi.com/marketing-blog/august-2026-google-spam-update-case-studies/
- Search Engine Land, The new SEO rules for bloggers in 2026 (21 Jul 2026) — https://searchengineland.com/new-seo-rules-for-bloggers-clarity-ai-search-482748
- Search Engine Land, 6 SEO priorities to rethink for AI search (6 Jul 2026) — https://searchengineland.com/seo-priorities-rethink-ai-search-481566

## 4. How a post is written

**File:** `content/blog/<slug>.md`. The slug is short, lowercase, hyphenated and keyword-led, with no date unless the date is the point (e.g. `epc-c-2030-landlord-rules`). It becomes `/blog/<slug>` and must never change once published.

**Front matter** (validated by `scripts/build-blog.mjs` — the build fails on any error):

```yaml
---
title: "H1 shown on the page, 20–110 characters"
seoTitle: "The <title> for Google, 20–60 characters (required if title > 60)"
description: "Meta description, 70–160 characters: who it's for and the key fact"
date: 2026-09-17            # UK publish date, YYYY-MM-DD, not in the future
updated: 2026-10-02         # optional, only when facts genuinely changed
category: landlords          # landlords | grants | buying-selling | guides
keywords:                   # 3–6 phrases people actually search
  - "..."
summary:                    # 2–5 bullet points: the answer in brief
  - "..."
sources:                    # 1 or more, https only
  - title: "Exact page title"
    publisher: "GOV.UK"
    url: "https://..."
    date: 2026-09-10        # the source's publication/update date if known
---
```

**Body** (Markdown): no H1 (the title is the H1) — start sections at `##`. At least 400 words; typically 700–1,200 for news and 1,200–2,000 for guides. No scripts, iframes, forms or embeds (the build rejects them).

**Structure that works:**
1. An opening paragraph that states the news and who it affects, with the key date or figure in **bold**, within the first two or three sentences.
2. Question-style H2s that match real searches ("What is…", "When do North West landlords need to…", "Can I get a grant for…").
3. A table for any schedule, list of dates, grant amounts or comparison.
4. A local angle: what it means in Lancashire and the North West — only with sourced facts (regional deadlines, council schemes, local grant availability).
5. **"What we'd do now"** — numbered, practical steps. Link the government EPC register (https://find-energy-certificate.service.gov.uk/) where relevant, and the booking page (`/`) at most once, naturally.
6. Internal links: 1–3 links to earlier related posts (`/blog/<slug>`) with descriptive anchor text. When a new post supersedes information in an old one, add a line to the old post linking forward and set its `updated:` date.

**Style:** UK English; plain, direct, short paragraphs; no hype, no clichés ("in today's fast-paced world", "navigating the landscape"), no emojis. Dates as "14 August 2027". Money as "£10,000". Explain acronyms on first use (MEES, EPC, EICR, BUS).

**Titles:** lead with the audience or place plus the concrete change ("North West landlords…", "Warm Homes Local Grant in Lancashire…"). `seoTitle` puts the main search phrase first.

## 5. Topic clusters and target searches

| Cluster | Category | Example target searches | Pillar guide |
|---|---|---|---|
| Landlord EPC rules & MEES | `landlords` | EPC C 2030 landlords · minimum EPC rating for rental property · MEES exemptions · £10,000 cap · EPC for HMO | "EPC rules for landlords in England: complete guide" (to write) |
| Rental register (energy side of the Renters' Rights Act) | `landlords` | register your rental property EPC · PRS database North West deadline | `/blog/north-west-landlord-register-epc-deadline-2027` |
| Grants & funding | `grants` | Warm Homes Plan grants · Warm Homes Local Grant Lancashire · Boiler Upgrade Scheme · Warm Homes loan · grants for landlords | "Energy grants for North West homes and landlords" (to write) |
| Buying & selling | `buying-selling` | do I need an EPC to sell my house · how long does an EPC last · EPC and mortgages · what is a good EPC rating | "EPCs when selling a home" (to write) |
| EPC guides & local | `guides` | what happens during an EPC assessment · how to improve EPC rating · EPC Preston · EPC Blackpool · new EPC format 2027 | "How to improve your EPC rating" (to write) |

Local modifiers to use where true and natural: Preston, Blackpool, Lancashire, Fylde Coast, Blackburn, Burnley, Lancaster, Chorley, Wigan, Bolton, Manchester, Liverpool, Southport, Warrington, the Wirral, North West.

**Weekly mix (a guide, not a quota):** about 3 landlord news/explainers, 2 grants & funding, 1 buying & selling, 1 evergreen guide or local explainer. Follow the news when something big breaks.

## 6. Where to look for stories

Primary: GOV.UK news and consultations (DESNZ, MHCLG) · housinghub.campaign.gov.uk · legislation.gov.uk (new statutory instruments) · Ofgem (ECO, Great British Insulation Scheme, Boiler Upgrade Scheme) · North West council housing and energy pages (Lancashire County Council, Blackpool, Preston, Blackburn with Darwen, Greater Manchester Combined Authority, Liverpool City Region).

Trade and sector: Landlord Today · Property Industry Eye · The Negotiator · NRLA news · Propertymark · Elmhurst Energy blog · ECMK · Stroma · Energy Saving Trust · Which? · HomeOwners Alliance · Rightmove and Zoopla press releases (EPC and buyer data).

A story qualifies if it is **new in the last ~7 days** (or has just become relevant), **affects our audiences in England / the North West**, and **isn't already covered** on the blog. Scotland- or Wales-only changes qualify only if they affect readers here.

## 7. Daily run — exact procedure

Runs at about 07:00 UK time. Git and the build run on George's PC through device_bash (the PC's Linux shell); web research runs in the cloud session.

1. **Get the repo** (device_bash — clone into the shell's home directory, which is scratch space, not George's folder):
   ```bash
   TOKEN=$(tr -d '\r\n ' < "$HOME/mnt/Eco Website/fastepcs-blog-bot/github-token.txt")
   rm -rf "$HOME/site" && git clone -q "https://x-access-token:${TOKEN}@github.com/Heskey-EN/epcs.git" "$HOME/site"
   cd "$HOME/site" && git config user.name "Eco Futures Blog Bot" && git config user.email "info@ecofutures.uk"
   ```
   Never print the token and never write it into the repo.
2. **Read** this playbook, `docs/blog/TOPIC-BACKLOG.md`, and the front matter of every file in `content/blog/` (titles, dates, sources) so you know what's already covered.
3. **Research** with WebSearch/WebFetch using section 6. Verify every fact on the source page itself, and against the primary source where one exists. If nothing qualifies, take the top suitable item from the backlog.
4. **Write** `content/blog/<slug>.md` following section 4, dated today (UK). If the story updates an older post, edit that post too (forward link + `updated:`). Write files with a heredoc or a short python script in device_bash.
5. **Build and audit:**
   ```bash
   cd "$HOME/site" && npm ci --no-audit --no-fund && SITE_URL=https://www.fastepcs.com npm run build
   ```
   Fix any failure in the post — never by weakening a check.
6. **Publish** (remove the item from the backlog first if it came from there):
   ```bash
   git add content/blog docs/blog && git commit -q -m "Blog: <title>" && git pull --rebase -q origin main && git push -q origin HEAD:main
   ```
   Only files in `content/blog/` and `docs/blog/` may be in the daily commit.
7. **Verify live** about 3 minutes later with WebFetch on `https://www.fastepcs.com/blog/<slug>` (and `/blog`). If it isn't live after ~10 minutes, report it — the Vercel build may have failed.
8. **Log** one line to `$HOME/mnt/Eco Website/fastepcs-blog-bot/run-log.md` (append only, e.g. `echo ... >> file`): date, slug, commit hash, live yes/no, notes.
9. **Tell George** the title, the link and a one-line summary.

If the PC can't be reached, GitHub rejects the token, or the build can't be fixed: publish nothing half-done, and send George a short message saying what failed.

## 8. Weekly review — exact procedure

Runs on Sunday evening, before the week's posts.

1. Repo setup as in the daily run.
2. **Re-research SEO:** Google Search Central blog and documentation changes, the Google Search Status Dashboard (core and spam updates in the last 7–14 days), and 3–5 reputable SEO sources (Search Engine Land, Search Engine Roundtable, GSQI / Glenn Gabe, Aleyda Solis, Lily Ray). Note anything that changes how posts should be written, structured, marked up or linked.
3. **Audit the blog:** thin or overlapping posts to merge or update, missing internal links between cluster posts, pillar guides still to write, and facts in older posts that have gone out of date (deadlines, grant amounts, scheme status) — fix them and set `updated:`.
4. **Update this playbook** (sections 3–6 as needed, plus the "Last strategy review" date) and **refill `TOPIC-BACKLOG.md`** so it always holds at least 15 ideas, including upcoming dated hooks.
5. **Apply blog code improvements** only where the research justifies them and within section 2.7, with `npm run build` passing.
6. Commit ("Weekly SEO review: <date>"), pull --rebase, push, verify live, append to the run log, add a dated entry to the change log below, and send George a short summary of what changed plus any off-site actions worth his time.

## 9. Change log

- **2026-09-17** — Blog launched: Markdown build pipeline with validation, `/blog` index, post pages with an "In short" summary, Sources list and BlogPosting schema, RSS feed, real dates in the sitemap, footer link. First post: North West landlord register deadline and EPCs. Initial strategy from the research in section 3.
