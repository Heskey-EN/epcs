// Accreditations and memberships shown in the trust strip.
//
// ─────────────────────────────────────────────────────────────────────────
//  ONLY LIST A SCHEME THE BUSINESS IS ACTUALLY REGISTERED WITH.
//
//  Showing a badge you don't hold is false advertising: the schemes below
//  all publish public member registers, so it is trivially checkable, and
//  each of them actively polices misuse of its mark. On a site that already
//  had Google ads disapproved, an unearned accreditation badge is the
//  fastest route to a Misrepresentation flag — which is far harder to clear
//  than a technical fault.
//
//  Set `held: false` and the strip skips it entirely. Nothing renders until
//  someone deliberately flips it to true.
// ─────────────────────────────────────────────────────────────────────────
//
// LOGO FILES: drop the official artwork into public/accreditations/ using the
// filename below. Every scheme gives members a logo pack — use theirs, don't
// recreate it, because a redrawn mark breaks their brand guidelines and looks
// wrong next to the real thing. Until a file is present the strip falls back
// to a clean wordmark, so it never shows a broken image.

export const ACCREDITATIONS = [
  {
    id: 'elmhurst',
    name: 'Elmhurst Energy',
    // Confirmed: George is an Elmhurst-accredited domestic energy assessor,
    // assessor number EES/035222 (see src/data/company.js).
    held: true,
    logo: '/accreditations/elmhurst-energy.png',
    alt: 'Elmhurst Energy accredited',
    detail: 'Accredited domestic energy assessor',
    url: 'https://www.elmhurstenergy.co.uk/',
  },
  {
    id: 'trustmark',
    name: 'TrustMark',
    held: true, // Confirmed by George, 8 Aug 2026
    logo: '/accreditations/trustmark.svg',
    alt: 'TrustMark — Government Endorsed Quality',
    detail: 'Government Endorsed Quality',
    url: 'https://www.trustmark.org.uk/',
  },
  {
    id: 'ecmk',
    name: 'ECMK',
    held: true, // Confirmed by George, 8 Aug 2026
    logo: '/accreditations/ecmk.svg',
    alt: 'ECMK accredited member',
    detail: 'Accredited member',
    url: 'https://www.ecmk.co.uk/',
  },

  // ── NOT held. Confirmed by George on 8 Aug 2026 that these are not ──
  // memberships he has. Kept here so nobody re-adds them on the assumption
  // they were simply forgotten. Do not flip these without checking the
  // scheme's public member register first.
  {
    id: 'ciob',
    name: 'CIOB',
    held: false,
    logo: '/accreditations/ciob.svg',
    alt: 'The Chartered Institute of Building',
    detail: 'The Chartered Institute of Building',
    url: 'https://www.ciob.org/',
  },
  {
    id: 'checkatrade',
    name: 'Checkatrade',
    held: false,
    logo: '/accreditations/checkatrade.svg',
    alt: 'Checkatrade member',
    detail: 'Checked and monitored',
    url: 'https://www.checkatrade.com/',
  },
]

/** Only the schemes actually held — the strip never renders anything else. */
export const heldAccreditations = () => ACCREDITATIONS.filter((a) => a.held)
