import LegalPage from '../components/LegalPage.jsx'
import { COMPANY } from '../data/company.js'
import {
  EPC_BASE_PRICE,
  EPC_PER_EXTRA_BEDROOM,
  EPC_BEDROOMS_INCLUDED,
  EPC_MAX_BEDROOMS,
} from '../data/epcFacts.js'

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Use"
      intro={`The terms on which you may use the ${COMPANY.tradingName} website.`}
      updated={COMPANY.lastUpdatedTerms}
    >
      <h2>About us</h2>
      <p>
        This website is operated by {COMPANY.legalName}
        {COMPANY.isLtd ? (
          <>
            , registered in {COMPANY.placeOfRegistration} (company no. {COMPANY.companyNumber}),
            registered office {COMPANY.registeredOffice}
          </>
        ) : (
          <> (business address: {COMPANY.registeredOffice})</>
        )}
        . By using this website you accept these terms. If you don’t agree with them, please don’t
        use the site.
      </p>
      {/* Electronic Commerce (EC Directive) Regulations 2002, reg 6(f)–(g):
          where the provider is subject to an authorisation or professional
          scheme, the scheme and the registration number have to be given. */}
      <p>
        Energy Performance Certificates are produced by a domestic energy assessor accredited by{' '}
        {COMPANY.accreditationScheme} under assessor number {COMPANY.assessorNumber}, and are
        carried out and lodged in accordance with that scheme’s rules and the Energy Performance of
        Buildings (England and Wales) Regulations 2012. You can contact us by email at{' '}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> or by phone on{' '}
        <a href={`tel:${COMPANY.phoneHref}`}>{COMPANY.phone}</a>.
        {COMPANY.vatNumber ? <> Our VAT registration number is {COMPANY.vatNumber}.</> : null}
      </p>

      <h2>Using the website</h2>
      <p>
        You may use this website for lawful, personal and business purposes connected with our
        services. You must not misuse it — for example by attempting to gain unauthorised access,
        introducing malicious code, or scraping content at scale.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The content, design, branding and interactive tools on this site are owned by us or our
        licensors and are protected by copyright and other rights. You may view and print pages for
        your own use, but you may not reuse them commercially without our permission.
      </p>

      <h2>Guidance and figures are illustrative</h2>
      <p>
        The general information on this site — including any indicative costs, savings, EPC uplifts
        and grant amounts — is provided for guidance only. The figures are typical estimates for older UK homes and are{' '}
        <strong>not quotes, guarantees, or a promise of any particular result</strong>. Every home
        is different. Actual measures, costs, savings and grant eligibility can only be confirmed by
        a survey of your specific property and by the relevant third parties and scheme rules.
      </p>

      <h2>Our services</h2>
      <p>
        Where you engage us for a survey, retrofit plan or to facilitate installation work, that
        work is governed by a separate written quote and contract, not by these website terms.
        Grant funding is subject to eligibility and to the rules of the scheme and its
        administrator, which are outside our control. Where you are a consumer, you may have a right
        to cancel certain contracts within 14 days under the Consumer Contracts Regulations 2013 —
        details are provided with your quote.
      </p>

      {/* Electronic Commerce (EC Directive) Regulations 2002, reg 9: before an
          order is placed a service provider must set out the technical steps
          to conclude the contract, whether the contract will be filed and
          accessible, how input errors can be corrected, and the languages
          offered. Reg 9(3) also requires the terms to be available in a form
          the customer can store and reproduce — which a plain web page the
          browser can save or print satisfies. */}
      <h2>How your order is made</h2>
      <p>
        You order an EPC by entering your house number or name, your postcode and the number of
        bedrooms on our <a href="/">booking page</a>, ticking the box asking us to start within the
        cancellation period, and then paying by card on Stripe’s secure checkout. The contract
        between us is formed when your payment is confirmed and we send you an order confirmation by
        email. Nothing is charged before then.
      </p>
      <p>
        <strong>Correcting a mistake.</strong> Before you pay, you can change anything you have
        entered by typing over it, and you can review the full price before pressing the pay button.
        On Stripe’s checkout page you can go back to correct your details. If you spot a mistake
        after paying — a wrong house number, the wrong number of bedrooms — call{' '}
        <a href={`tel:${COMPANY.phoneHref}`}>{COMPANY.phone}</a> or email{' '}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> and we will put it right. We will
        not charge you for correcting an error before the visit.
      </p>
      <p>
        <strong>Your records.</strong> We file your order and keep it for our records, and you can
        ask us for a copy at any time. We do not publish it and it is not accessible to anyone else.
        Your confirmation email is your own copy. These terms are on this page for you to save or
        print at any time. The contract is concluded in English only.
      </p>

      <h2>Payments</h2>
      <p>
        Payments on this website are processed securely by Stripe; we don’t see or store your card
        details. Prices are in pounds sterling.
      </p>
      <p>
        <strong>EPC fee.</strong> The EPC fee is paid in full online when you book — £
        {EPC_BASE_PRICE} for up to {EPC_BEDROOMS_INCLUDED} bedrooms, then £{EPC_PER_EXTRA_BEDROOM}{' '}
        per additional bedroom, up to {EPC_MAX_BEDROOMS} bedrooms. There is no deposit, and no
        further charge for the assessment itself. If we are unable to carry out your EPC (for
        example your property is outside our service area), we refund the fee in full. The one
        situation in which a further charge can arise is a repeatedly missed visit — see{' '}
        <em>Cancelling, rearranging or a missed visit</em> below.
      </p>
      <h2>Cancelling an EPC you booked online</h2>
      <p>
        Because you bought online without meeting us, you have a legal right to cancel under the
        Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013.
      </p>
      <ul>
        <li>
          You have <strong>14 days</strong>, starting the day after you place your order, to cancel
          for any reason and get a full refund.
        </li>
        <li>
          To cancel, email <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>, call{' '}
          <a href={`tel:${COMPANY.phoneHref}`}>{COMPANY.phone}</a>, or write to us at{' '}
          {COMPANY.registeredOffice}. A clear statement that you are cancelling is enough — you can
          also use our <a href="/cancellation-form">cancellation form</a>.
        </li>
        <li>
          Because we aim to book you in within 24 hours, the booking form asks you to tick a box
          expressly requesting that we start <strong>within</strong> those 14 days. If you then
          cancel before the visit, you pay a proportionate amount for any work already carried out
          and we refund the rest.
        </li>
        <li>
          Once the assessment has been carried out and the certificate lodged on the national
          register, the service is fully performed and the right to cancel ends. That is what the
          tick box confirms you understand.
        </li>
        <li>Refunds are made to the card you paid with, within 14 days of you telling us.</li>
      </ul>
      <p>
        If you would rather we did not start within the 14 days, do not tick the box — call us
        instead and we will book your visit for after the cancellation period ends.
      </p>

      {/* Consumer Rights Act 2015 ss.49–52, and the Consumer Contracts
          Regulations 2013 Sch 2(l), which requires a reminder that the trader
          is under a legal duty to supply a conforming service. */}
      <h2>Your legal rights</h2>
      <p>
        We are under a legal duty to supply services that conform to this contract. Under the
        Consumer Rights Act 2015 any service we carry out for you must be performed with reasonable
        care and skill, within a reasonable time, and must match anything we have told you about it
        that you relied on. Nothing in these terms affects those rights. If a service we have
        supplied does not meet that standard you are entitled to ask us to put it right, and to a
        price reduction if we cannot.
      </p>
      <h2>Cancelling, rearranging or a missed visit</h2>
      <p>
        Outside the statutory period above: you can rearrange a booked visit at no charge if you tell
        us at least 24 hours beforehand. If nobody is home when we arrive, or we cannot access the
        whole property, we will contact you to rebook; we may charge a reasonable abortive-visit fee
        for a second wasted journey, and we will always tell you before charging it. If we cancel or
        cannot complete the EPC, you get a full refund.
      </p>

      <h2>Complaints</h2>
      <p>
        If something isn’t right with a survey or installation, please contact us first at{' '}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> and we’ll do our best to put it
        right. Where your work is carried out under a certification scheme (such as TrustMark or a
        PAS 2035 scheme), that scheme’s complaints and dispute-resolution process also applies, and
        we’ll tell you how to use it. A data-protection complaint can be raised separately with the
        ICO — see our <a href="/privacy">Privacy Policy</a>.
      </p>
      {/* Alternative Dispute Resolution for Consumer Disputes (Competent
          Authorities and Information) Regulations 2015, reg 19, and the
          Consumer Contracts Regulations 2013 Sch 2(t): where an internal
          complaints procedure has been exhausted, a consumer must be told
          about a competent ADR provider and whether the trader will use it.
          We are not naming a scheme we have not joined — the duty bites at
          the point the internal process is exhausted, which is what this
          says. */}
      <p>
        <strong>If we cannot settle it between us.</strong> We aim to resolve every complaint
        ourselves. If we have not been able to, and you are a consumer, you can ask for the dispute
        to be looked at by an independent alternative dispute resolution (ADR) provider instead of
        going to court. Where the work was done under TrustMark or a PAS 2035 scheme, that scheme’s
        own dispute process applies and we will point you to it. Otherwise, write to us and we will
        tell you within 14 days which ADR provider we consider competent to handle the dispute and
        whether we agree to use them. Using ADR does not affect your right to take the matter to
        court.
      </p>

      <h2>Third-party links</h2>
      <p>
        The site links to third-party websites (for example GOV.UK services and our own tools). We
        aren’t responsible for the content or availability of external sites.
      </p>

      <h2>Our liability</h2>
      <p>
        Nothing in these terms limits our liability for death or personal injury caused by our
        negligence, for fraud, or for anything else that cannot be excluded under law. Subject to
        that, we don’t accept liability for any loss arising from reliance on the general guidance or
        indicative figures on this website. We don’t guarantee the site will always be available or
        error-free.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the law of England and Wales, and the courts of England and
        Wales have jurisdiction.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms from time to time. The “last updated” date at the top shows when
        they were last changed.
      </p>

      <h2>Contact</h2>
      <p>
        {COMPANY.legalName} — email <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>, phone{' '}
        <a href={`tel:${COMPANY.phoneHref}`}>{COMPANY.phone}</a>.
      </p>
    </LegalPage>
  )
}
