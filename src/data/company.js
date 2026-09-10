// ─────────────────────────────────────────────────────────────────────────
//  The business's real legal details. These are shown on the legal pages,
//  in the footer and on the /epcs paid-traffic landing page, and are legally
//  required for a UK business website (Companies Act 2006 / E-Commerce
//  Regulations 2002 / UK GDPR). Do NOT guess any of these — use the real
//  values. Anything left as a "[placeholder]" is hidden by the UI rather
//  than printed, so a blank never renders as a broken-looking claim.
// ─────────────────────────────────────────────────────────────────────────

export const COMPANY = {
  tradingName: 'Eco Futures',

  // The exact registered name as it appears at Companies House for 15782816.
  // Confirmed by George, 13 Aug 2026. "Eco Futures" is the trading name.
  legalName: 'ECOFUTURESGB LTD',
  isLtd: true,

  // Only used when isLtd is true:
  companyNumber: '15782816',
  placeOfRegistration: 'England & Wales',

  // Required on a UK business website (a real geographic address, not a PO box):
  registeredOffice: '49 Whitegate Drive, Blackpool, England, FY3 9DG',

  // Leave '' if not applicable:
  vatNumber: '', // TODO e.g. 'GB123456789' if VAT registered
  icoNumber: '', // TODO ICO data-protection register reference (see note in Privacy page)

  // Contact
  email: 'info@ecofutures.uk',
  phone: '07359 069886',
  phoneHref: '+447359069886',
  area: 'Preston, Blackpool and the North West',

  // ── Domestic energy assessor accreditation ──────────────────────────────
  // Shown on the /epcs paid-traffic landing page. Google expects an EPC
  // provider to name its accreditation scheme and assessor ID; without them a
  // "buy an EPC" ad invites a misrepresentation review. The page hides this
  // block while the values are blank rather than showing an empty claim —
  // so fill these in before running ads. Do NOT guess them.
  accreditationScheme: 'Elmhurst Energy Systems Ltd',
  assessorNumber: 'EES/035222',

  // Update the relevant date whenever you edit that policy
  lastUpdated: '17 July 2026', // fallback
  lastUpdatedPrivacy: '7 September 2026',
  lastUpdatedCookies: '7 September 2026',
  lastUpdatedTerms: '10 September 2026',
}

// True while a field still holds its placeholder, so the UI can flag it.
export const isPlaceholder = (value) =>
  typeof value === 'string' && value.trim().startsWith('[')
