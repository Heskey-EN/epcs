// JSON-LD structured data — ONE connected graph, not isolated blobs.
//
// Every node carries an @id and references the others by @id, so search engines
// and AI assistants resolve "this Service is provided by that LocalBusiness,
// which is operated by that Organization, whose assessor is that Person" rather
// than seeing four unrelated objects.
//
// @id scheme. SITE is this deployment's own origin, resolved from the
// environment at build time (src/data/site.js) — never hardcoded, because a
// wrong host in an @id is an error that is easy to ship and hard to notice:
//   {SITE}/#organization    the legal entity, ECOFUTURESGB LTD
//   {SITE}/#localbusiness   the trading practice people actually book
//   {SITE}/#assessor        the named human doing the assessments (E-E-A-T)
//   {SITE}/#website         the site itself
//   {page}#webpage          each page
//   {page}#service          the service a page sells
//   {page}#faq              a page's Q&A, ONLY where visible on the page
//   {page}#breadcrumb       the trail
//
// HONESTY RULE: only assert what is verified. A property we cannot evidence is
// omitted, never guessed — structured data is machine-read and a wrong claim
// here is a misrepresentation signal, which this business cannot afford. Gaps
// currently open are listed in SCHEMA_TODO at the foot of this file.
import { COMPANY } from './company.js'
import { COVERAGE } from './coverage.js'

export { SITE } from './site.js'
import { SITE } from './site.js'

export const ID = {
  organization: `${SITE}/#organization`,
  localBusiness: `${SITE}/#localbusiness`,
  assessor: `${SITE}/#assessor`,
  website: `${SITE}/#website`,
  logo: `${SITE}/#logo`,
}

/**
 * The area we cover: a 40-mile circle around Preston (schema.org GeoCircle,
 * radius in metres) plus the places inside it that people search for. The
 * numbers come from src/data/coverage.js, which also drives the postcode
 * check, so the markup can never claim a different area from the one the
 * order form enforces.
 */
const AREA_SERVED = [
  {
    '@type': 'GeoCircle',
    geoMidpoint: {
      '@type': 'GeoCoordinates',
      latitude: COVERAGE.centre.lat,
      longitude: COVERAGE.centre.lng,
    },
    geoRadius: String(Math.round(COVERAGE.radiusMiles * 1609.344)),
  },
  { '@type': 'City', name: COVERAGE.from },
  ...COVERAGE.towns.filter((t) => !/^the /.test(t)).map((name) => ({ '@type': 'City', name })),
  { '@type': 'AdministrativeArea', name: 'Lancashire' },
  { '@type': 'AdministrativeArea', name: 'Greater Manchester' },
  { '@type': 'AdministrativeArea', name: 'Merseyside' },
]

/** Verified accreditations only — mirrors src/data/accreditations.js. */
const credentials = () => {
  const out = []
  if (COMPANY.accreditationScheme && COMPANY.assessorNumber) {
    out.push({
      '@type': 'EducationalOccupationalCredential',
      '@id': `${SITE}/#cred-elmhurst`,
      credentialCategory: 'Domestic Energy Assessor accreditation',
      name: `${COMPANY.accreditationScheme} accredited Domestic Energy Assessor`,
      identifier: COMPANY.assessorNumber,
      recognizedBy: {
        '@type': 'Organization',
        name: COMPANY.accreditationScheme,
        url: 'https://www.elmhurstenergy.co.uk/',
      },
    })
  }
  out.push({
    '@type': 'EducationalOccupationalCredential',
    '@id': `${SITE}/#cred-ecmk`,
    credentialCategory: 'Energy assessment scheme membership',
    name: 'ECMK accredited member',
    recognizedBy: { '@type': 'Organization', name: 'ECMK', url: 'https://www.ecmk.co.uk/' },
  })
  out.push({
    '@type': 'EducationalOccupationalCredential',
    '@id': `${SITE}/#cred-trustmark`,
    credentialCategory: 'Government Endorsed Quality registration',
    name: 'TrustMark registered business',
    recognizedBy: {
      '@type': 'Organization',
      name: 'TrustMark',
      url: 'https://www.trustmark.org.uk/',
    },
  })
  return out
}

/** Links that prove the entity is who it says it is. */
const sameAs = () => {
  const links = []
  if (COMPANY.isLtd && COMPANY.companyNumber && !COMPANY.companyNumber.startsWith('[')) {
    links.push(
      `https://find-and-update.company-information.service.gov.uk/company/${COMPANY.companyNumber}`,
    )
  }
  // Social / directory profiles go here once supplied — see SCHEMA_TODO.
  return links
}

const postalAddress = () => ({
  '@type': 'PostalAddress',
  streetAddress: '49 Whitegate Drive',
  addressLocality: 'Blackpool',
  addressRegion: 'Lancashire',
  postalCode: 'FY3 9DG',
  addressCountry: 'GB',
})

/* ── The persistent nodes, present on every page ───────────────────────── */

export const organizationNode = () => ({
  '@type': 'Organization',
  '@id': ID.organization,
  name: COMPANY.legalName,
  legalName: COMPANY.legalName,
  alternateName: COMPANY.tradingName,
  url: SITE,
  logo: { '@id': ID.logo },
  email: COMPANY.email,
  telephone: `+44${COMPANY.phoneHref.replace(/^\+44/, '')}`,
  address: postalAddress(),
  identifier: {
    '@type': 'PropertyValue',
    name: 'UK company number',
    value: COMPANY.companyNumber,
  },
  hasCredential: credentials(),
  employee: { '@id': ID.assessor },
  ...(sameAs().length ? { sameAs: sameAs() } : {}),
})

export const localBusinessNode = () => ({
  '@type': 'ProfessionalService',
  '@id': ID.localBusiness,
  name: COMPANY.tradingName,
  legalName: COMPANY.legalName,
  // Only what this deployment actually sells. The parent site also offers
  // whole-house retrofit assessments; claiming them here would assert a
  // service nothing on this domain can be booked for.
  description:
    'Domestic Energy Assessor covering Preston, Blackpool and the North West. Accredited Energy Performance Certificates, lodged on the national register.',
  url: SITE,
  logo: { '@id': ID.logo },
  image: `${SITE}/brand/eco-futures-logo.png`,
  email: COMPANY.email,
  telephone: `+44${COMPANY.phoneHref.replace(/^\+44/, '')}`,
  address: postalAddress(),
  // Coordinates of the registered office, resolved from FY3 9DG via
  // postcodes.io (Ordnance Survey data) — measured, not estimated.
  geo: { '@type': 'GeoCoordinates', latitude: 53.816119, longitude: -3.037172 },
  areaServed: AREA_SERVED,
  priceRange: '££',
  currenciesAccepted: 'GBP',
  paymentAccepted: 'Credit Card, Debit Card',
  parentOrganization: { '@id': ID.organization },
  founder: { '@id': ID.assessor },
  hasCredential: credentials(),
  ...(sameAs().length ? { sameAs: sameAs() } : {}),
})

/** The named human behind the assessments — the core E-E-A-T signal. */
export const assessorNode = () => ({
  '@type': 'Person',
  '@id': ID.assessor,
  name: 'George Hesketh',
  jobTitle: 'Domestic Energy Assessor',
  worksFor: { '@id': ID.organization },
  knowsAbout: [
    'Energy Performance Certificates',
    'RdSAP domestic energy assessment',
  ],
  hasCredential: credentials(),
})

/** The logo as its own node, so both entities can reference it by @id
 *  instead of one defining it inline and the other pointing at a nested
 *  object some consumers never flatten. */
export const logoNode = () => ({
  '@type': 'ImageObject',
  '@id': ID.logo,
  url: `${SITE}/brand/eco-futures-logo.png`,
  contentUrl: `${SITE}/brand/eco-futures-logo.png`,
  caption: COMPANY.tradingName,
})

export const websiteNode = () => ({
  '@type': 'WebSite',
  '@id': ID.website,
  url: SITE,
  name: COMPANY.tradingName,
  publisher: { '@id': ID.organization },
  inLanguage: 'en-GB',
})

/* ── Per-page nodes ────────────────────────────────────────────────────── */

export const webPageNode = ({ path, title, description }) => ({
  '@type': 'WebPage',
  '@id': `${SITE}${path}#webpage`,
  url: `${SITE}${path}`,
  name: title,
  ...(description ? { description } : {}),
  isPartOf: { '@id': ID.website },
  about: { '@id': ID.localBusiness },
  inLanguage: 'en-GB',
  breadcrumb: { '@id': `${SITE}${path}#breadcrumb` },
})

/** trail: [{ name, path }] — the final entry is the current page. */
export const breadcrumbNode = ({ path, trail }) => ({
  '@type': 'BreadcrumbList',
  '@id': `${SITE}${path}#breadcrumb`,
  itemListElement: trail.map((t, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: t.name,
    item: `${SITE}${t.path}`,
  })),
})

export const serviceNode = ({ path, name, serviceType, description, areaServed, offers }) => ({
  '@type': 'Service',
  '@id': `${SITE}${path}#service`,
  name,
  serviceType,
  ...(description ? { description } : {}),
  provider: { '@id': ID.localBusiness },
  areaServed: areaServed || AREA_SERVED,
  ...(offers ? { offers } : {}),
})

/**
 * questions: [{ q, a }] — ONLY pass questions that are genuinely visible on
 * the rendered page. Google requires the markup to match what a user can read,
 * and invisible FAQ markup is a manual-action risk.
 */
export const faqNode = ({ path, questions }) => ({
  '@type': 'FAQPage',
  '@id': `${SITE}${path}#faq`,
  mainEntity: questions.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
})

/** Wrap nodes into the single @graph document a page emits. */
export const graph = (...nodes) => ({
  '@context': 'https://schema.org',
  '@graph': nodes.flat().filter(Boolean),
})

/** The nodes every page carries. */
export const baseNodes = () => [
  organizationNode(),
  logoNode(),
  localBusinessNode(),
  assessorNode(),
  websiteNode(),
]

// ── Still needed before this graph is complete ────────────────────────────
// Deliberately omitted rather than guessed. Each is a Google "recommended"
// field whose absence costs richness but whose invention would be a false
// claim:
//   · openingHoursSpecification — actual working hours
//   · sameAs — Google Business Profile, TrustMark listing, LinkedIn/Facebook
//   · TrustMark licence number and ECMK membership number (identifier fields)
//   · George's formal qualifications (e.g. Level 3 Diploma in DEA, Level 5
//     Diploma in Retrofit Coordination) for Person.hasCredential
export const SCHEMA_TODO = [
  'openingHoursSpecification',
  'sameAs (Google Business Profile, TrustMark listing, social)',
  'TrustMark licence number / ECMK member number',
  'assessor formal qualifications',
]
