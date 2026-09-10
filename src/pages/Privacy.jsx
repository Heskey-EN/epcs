import LegalPage from '../components/LegalPage.jsx'
import { COMPANY } from '../data/company.js'

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`How ${COMPANY.tradingName} collects, uses and protects your personal data.`}
      updated={COMPANY.lastUpdatedPrivacy}
    >
      <h2>Who we are</h2>
      <p>
        {COMPANY.legalName} (“we”, “us”, “our”) is the data controller responsible for your personal
        data. This policy explains what we collect, why we collect it, and the rights you have under
        UK data protection law — the UK GDPR and the Data Protection Act 2018.
      </p>
      <p>
        You can contact us about privacy at any time:
        <br />
        Email: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
        <br />
        Phone: <a href={`tel:${COMPANY.phoneHref}`}>{COMPANY.phone}</a>
        <br />
        {COMPANY.isLtd ? (
          <>
            {COMPANY.legalName}, registered in {COMPANY.placeOfRegistration} (company no.{' '}
            {COMPANY.companyNumber}). Registered office: {COMPANY.registeredOffice}.
          </>
        ) : (
          <>Business address: {COMPANY.registeredOffice}.</>
        )}
      </p>
      {COMPANY.icoNumber && (
        <p>
          We are registered with the Information Commissioner’s Office (ICO) under reference{' '}
          {COMPANY.icoNumber}.
        </p>
      )}

      <h2>The personal data we collect</h2>
      <ul>
        <li>
          <strong>Enquiry details</strong> — when you use our contact form, email or call us: your
          name, email address, property address or postcode, and the content of your message.
        </li>
        <li>
          <strong>Order details</strong> — when you book an EPC online: your name, email address,
          phone number, the property address and postcode, and the appointment dates you choose.
          Card details are entered on Stripe&rsquo;s payment page and never reach our systems.
        </li>
        <li>
          <strong>Survey &amp; service data</strong> — if you go on to engage us, the information
          needed to carry out your survey, plan and any installation work.
        </li>
        {/* Article 13: we cannot collect this and not say so. RdSAP 10 makes
            photographic evidence mandatory and our accreditation scheme
            requires the master images to be archived for audit, so this is
            the most sensitive data the business holds — photographs of the
            inside of someone's home, date- and location-stamped. */}
        <li>
          <strong>Assessment photographs and site notes</strong> — when we carry out an EPC at your
          property: measurements, site notes and photographs of the things that determine the
          rating, such as the boiler and its controls, meters, glazing, insulation, ventilation and
          the outside of the building. The assessment standard requires these to be date-stamped
          and location-stamped, and requires us to keep them so that an auditor can check the
          certificate was produced correctly. We photograph the building, its fixtures and its
          services — not you, and not your belongings. If you would rather a particular room or
          item was not photographed, tell the assessor on the day.
        </li>
        <li>
          <strong>Usage data</strong> — if you consent to analytics cookies, Google Analytics
          collects information about how you use the site (pages viewed, approximate location,
          device and browser). See our <a href="/cookies">Cookie Policy</a>.
        </li>
        <li>
          <strong>Technical data</strong> — our hosting provider automatically processes limited
          technical data such as your IP address and request logs to serve and secure the site.
        </li>
      </ul>

      <h2>How and why we use your data</h2>
      <p>We only use your personal data where we have a lawful basis to do so:</p>
      <table>
        <thead>
          <tr>
            <th>Purpose</th>
            <th>Lawful basis (UK GDPR Art. 6)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Respond to your enquiry and provide quotes or arrange a survey</td>
            <td>
              Legitimate interests (responding to and managing enquiries about our services), and
              taking steps at your request before entering a contract
            </td>
          </tr>
          <tr>
            <td>Deliver the surveys, plans and installations you engage us for</td>
            <td>Performance of a contract</td>
          </tr>
          <tr>
            <td>
              Take and keep assessment photographs and site notes, and produce and lodge your
              certificate
            </td>
            <td>
              Performance of a contract, and legal obligation — an EPC must be produced to the
              government&rsquo;s assessment standard and lodged on the national register, and our
              accreditation scheme must be able to audit it
            </td>
          </tr>
          <tr>
            <td>Measure and improve the website (analytics)</td>
            <td>Consent — you can withdraw it at any time</td>
          </tr>
          <tr>
            <td>Keep business, accounting and regulatory records</td>
            <td>Legal obligation</td>
          </tr>
          <tr>
            <td>Keep the website secure and working</td>
            <td>Legitimate interests (keeping our website secure, available and free from abuse)</td>
          </tr>
        </tbody>
      </table>
      <p>
        Providing your details is not a statutory requirement. If you don’t give us the information
        we need to arrange or deliver a survey or installation, we won’t be able to provide that
        service. We don’t make decisions about you based solely on automated processing, and we don’t
        carry out profiling.
      </p>

      <h2>Who we share your data with</h2>
      <p>We do not sell your personal data. We share it only with:</p>
      <ul>
        <li>
          <strong>Stripe Payments UK Ltd</strong> — takes payment for EPC bookings and holds the
          order details we need to arrange the visit.
        </li>
        <li>
          <strong>postcodes.io</strong> — an open UK postcode database. When you enter a postcode
          on the EPC page, our server sends only its outward part (for example &ldquo;BL1&rdquo;)
          to check the property is within the area we cover. Nothing else is sent.
        </li>
        <li>
          <strong>EmailJS</strong> — delivers your contact-form message to our inbox.
        </li>
        <li>
          <strong>Google (Google Analytics and Google Ads measurement)</strong> — only if you
          accept analytics and advertising cookies.
        </li>
        <li>
          <strong>Vercel Inc.</strong> — hosts and serves the website, and provides Vercel Web
          Analytics, which counts page views and visitors. Unlike Google Analytics it sets no
          cookies, stores nothing on your device and builds no profile of you, so it runs whatever
          you choose in the cookie banner. It cannot identify you.
        </li>
        <li>
          <strong>{COMPANY.accreditationScheme}</strong> — our accreditation scheme. Your assessment
          data, site notes and photographs are provided to them if your certificate is selected for
          audit. Auditing is how the scheme checks that certificates are accurate, and every
          assessor is subject to it.
        </li>
        <li>
          <strong>The national register of energy certificates</strong> — your finished EPC is
          lodged on the government&rsquo;s register, where it is published and can be found by
          anyone searching your property&rsquo;s address. That is a legal requirement of producing
          an EPC rather than something we choose to do. The photographs and site notes are{' '}
          <strong>not</strong> published there.
        </li>
        <li>
          <strong>Accredited assessors, installers and scheme administrators</strong> — where needed
          to deliver a survey, plan or installation you have requested, or to process grant funding.
        </li>
        <li>
          <strong>Professional advisers and authorities</strong> — where we are required to by law.
        </li>
      </ul>
      <p>
        These providers act as our processors under contract, or as independent controllers where
        they set their own purposes (for example Google).
      </p>

      <h2>International transfers</h2>
      <p>
        Some of these providers (including Google, EmailJS and Stripe) may process data outside the UK,
        including in the United States. Where they do, the transfer is protected by appropriate
        safeguards such as the UK International Data Transfer Agreement or Addendum, Standard
        Contractual Clauses, or an adequacy decision (for example the UK Extension to the EU–US Data
        Privacy Framework). Our web fonts are served by Google Fonts, which may receive your IP
        address when a page loads.
      </p>

      <h2>How long we keep your data</h2>
      <ul>
        <li>Enquiries that don’t become work — typically up to 12 months.</li>
        <li>Client, contract and financial records — as required for legal and tax purposes (generally 6 years).</li>
        <li>
          Assessment photographs, site notes and survey data — for as long as our accreditation
          scheme requires us to keep the evidence behind a certificate available for audit. We do
          not keep them beyond that, and we do not use them for anything else.
        </li>
        <li>Analytics data — in line with Google Analytics’ retention settings.</li>
      </ul>
      <p>We keep personal data only for as long as we need it for the purposes above.</p>

      <h2>Your rights</h2>
      <p>Under UK data protection law you have the right to:</p>
      <ul>
        <li>be informed about how we use your data (this policy);</li>
        <li>access the personal data we hold about you;</li>
        <li>have inaccurate data corrected;</li>
        <li>have your data erased in certain circumstances;</li>
        <li>restrict or object to our processing;</li>
        <li>data portability; and</li>
        <li>withdraw consent at any time, where we rely on consent.</li>
      </ul>
      <p>
        To exercise any of these rights, email us at <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
        We will respond within one month.
      </p>

      <h2>Complaints</h2>
      <p>
        If you are unhappy with how we have handled your personal data, you can complain to the
        Information Commissioner’s Office at{' '}
        <a href="https://ico.org.uk" target="_blank" rel="noreferrer">
          ico.org.uk
        </a>{' '}
        or on 0303 123 1113. We’d appreciate the chance to put things right first, so please do
        contact us.
      </p>

      <h2>Security</h2>
      <p>
        We use appropriate technical and organisational measures to protect your personal data
        against loss, misuse and unauthorised access.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. The “last updated” date at the top shows when it
        was last changed.
      </p>
    </LegalPage>
  )
}
