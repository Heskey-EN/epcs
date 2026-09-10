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

      <h2>Guidance, figures and the interactive tools are illustrative</h2>
      <p>
        The information on this site — including the interactive house explorer and any indicative
        costs, savings, EPC uplifts, carbon figures and grant amounts — is provided for general
        guidance only. The figures are typical estimates for older UK homes and are{' '}
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

      <h2>Payments &amp; memberships</h2>
      <p>
        Payments on this website are processed securely by Stripe; we don’t see or store your card
        details. Prices are in pounds sterling.
      </p>
      <p>
        <strong>EPC fee.</strong> The EPC fee is paid in full online when you book — £
        {EPC_BASE_PRICE} for up to {EPC_BEDROOMS_INCLUDED} bedrooms, then £{EPC_PER_EXTRA_BEDROOM}{' '}
        per additional bedroom, up to {EPC_MAX_BEDROOMS} bedrooms. There is no deposit and nothing
        further to pay. If we are unable to carry out your EPC (for example your property is outside
        our service area), we refund the fee in full.
      </p>
      <p>
        <strong>Memberships.</strong> Software memberships (EPC Checker, Cavwall) are billed monthly
        and renew automatically until cancelled. You can cancel at any time to stop future payments;
        cancellation takes effect at the end of the current billing month.
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
          If you ask us to carry out your EPC <strong>within</strong> those 14 days and then cancel
          before it is done, you pay a proportionate amount for any work already carried out.
        </li>
        <li>
          Once the assessment has been carried out and the certificate lodged on the national
          register, the service is fully performed and the right to cancel ends.
        </li>
        <li>Refunds are made to the card you paid with, within 14 days of you telling us.</li>
      </ul>
      <p>
        If you do not ask us to start within the 14 days, we will arrange your visit for after the
        cancellation period ends.
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
