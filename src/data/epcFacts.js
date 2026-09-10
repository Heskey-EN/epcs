import { COVERAGE } from './coverage.js'
// EPC pricing and the factual claims the site makes about energy ratings.
//
// Everything a page states as fact about EPCs or minimum standards should come
// from here, so a rule change is one edit rather than a hunt through the copy.
// This business had Google ads disapproved once already; a wrong or stale
// regulatory claim on a page that takes payment is a misrepresentation risk,
// which is far harder to clear than a technical fault.
//
// RULE FOR THIS FILE: if you cannot point at a current GOV.UK page for a claim,
// it does not belong here. Prefer wording that stays true as dates move.

// ── Price ──────────────────────────────────────────────────────────────────
// £65 covers up to 3 bedrooms, then £5 per additional bedroom.
// KEEP IN STEP WITH api/checkout.js (EPC_BASE_PENCE / EPC_PER_EXTRA_BEDROOM_PENCE).
// The server recomputes every charge from these rules, so this copy is display
// only — but if they disagree, the page is advertising a price it won't charge.
export const EPC_BASE_PRICE = 65
export const EPC_PER_EXTRA_BEDROOM = 5
export const EPC_BEDROOMS_INCLUDED = 3
export const EPC_MAX_BEDROOMS = 10

export const epcPrice = (bedrooms) =>
  EPC_BASE_PRICE +
  Math.max(0, Math.min(bedrooms, EPC_MAX_BEDROOMS) - EPC_BEDROOMS_INCLUDED) * EPC_PER_EXTRA_BEDROOM

// ── The route to band C ────────────────────────────────────────────────────
// A second thing you can book, starting at the SAME first-visit price as a
// straight EPC. What follows depends on what the property turns out to need,
// so these are stated as separate steps rather than folded into one headline
// figure — a customer who is told "£65" and later billed £215 has been
// misled, whatever the small print said.
//
// Each step is charged only if it is actually carried out, and more than one
// can apply on the same job. All three are FLAT — unlike the first visit,
// they do not scale with bedroom count.
export const PATH_TO_C = {
  // Extra time on site gathering evidence (build dates, insulation records,
  // photographs) that RdSAP will accept in place of a cautious default.
  extraEvidence: 30,
  // The model: what specifically has to change to reach band C, and by how
  // much each measure moves the score.
  model: 50,
  // Return visit and lodgement of the new certificate once the work is done.
  secondVisit: 70,
}

/** Worst case for a 3-bedroom home: every step, start to finish. */
export const pathToCMax = (bedrooms = EPC_BEDROOMS_INCLUDED) =>
  epcPrice(bedrooms) + PATH_TO_C.extraEvidence + PATH_TO_C.model + PATH_TO_C.secondVisit

// ── Coverage ───────────────────────────────────────────────────────────────
// The ring around Preston is defined once, in ./coverage.js.
export const COVERAGE_LABEL = `Within ${COVERAGE.radiusMiles} miles of ${COVERAGE.from}`

// ── Facts about EPCs themselves ────────────────────────────────────────────
// These are long-standing and stable; safe to state plainly.
export const EPC_FACTS = {
  validityYears: 10,
  requiredWhen: 'A valid EPC is needed to sell or rent a home in England and Wales.',
  scale: 'Ratings run from A (most efficient) to G, based on a SAP score out of 100.',
  register: 'Every certificate is lodged on the national EPC register and is publicly searchable.',
  method: 'Domestic assessments use RdSAP — a measured survey, not an estimate.',
}

// ── Minimum standards for rented homes (MEES) ──────────────────────────────
// DELIBERATELY UNDATED. The minimum band for new lettings has been E for some
// years, and raising it to C has been consulted on and re-announced more than
// once with shifting dates. The site therefore says the standard EXISTS and is
// TIGHTENING — which is durably true — and points people at GOV.UK for the
// current position rather than printing a date that may already be wrong.
//
// Only add a specific band or date here once it is confirmed on GOV.UK, and
// put the source URL and the date you checked alongside it.
export const MEES = {
  govUkUrl:
    'https://www.gov.uk/guidance/domestic-private-rented-property-minimum-energy-efficiency-standard-landlord-guidance',

  // IN FORCE TODAY (GOV.UK landlord guidance, updated 5 May 2026):
  currentMinimumBand: 'E',
  currentCostCap: '£3,500 including VAT',
  currentMaxPenalty: '£5,000 per property',

  // CONFIRMED POLICY, NOT YET LAW (government response "Improving the energy
  // performance of privately rented homes", 21 January 2026). Regulations need
  // primary legislation then a statutory instrument, aimed to be in force 2027.
  futureBand: 'C',
  futureDeadline: '1 October 2030',
  futureAppliesTo: 'all tenancies', // the 2028 new-tenancy date was DROPPED
  futureCostCap: '£10,000 per property',

  // The genuinely useful commercial point, and it is true: a property graded C
  // or better on the CURRENT rating, on an EPC lodged before 1 October 2029,
  // counts as compliant until that certificate expires.
  earlyCertificateGrace: {
    band: 'C',
    lodgedBefore: '1 October 2029',
    effect: 'counts as compliant with the higher standard until that certificate expires',
  },

  confirmedOn: '2026-08-08',

  // ⛔ NEVER SAY (each of these is false as of the date above):
  //  · "EPC C by 2028 for new tenancies" — explicitly dropped on 21 Jan 2026
  //  · "the law now requires EPC C" — it does not; E is the standard in force
  //  · "£10,000 cap" / "£30,000 fines" as though they apply today
  //  · anything UK-wide about 2030 — Scotland is a separate regime and metric
  //  · that OWNER-OCCUPIERS must reach any band — they are not covered at all
}

/** England & Wales only — Scotland runs a separate regime with its own metric. */
export const MEES_NATIONS = 'England and Wales'
