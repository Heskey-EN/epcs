import LegalPage from '../components/LegalPage.jsx'
import { COMPANY } from '../data/company.js'

/**
 * /epc-cancellation-form — the model cancellation form.
 *
 * The Consumer Contracts (Information, Cancellation and Additional Charges)
 * Regulations 2013 require a trader selling at a distance to MAKE AVAILABLE a
 * cancellation form in the form set out in Schedule 3 Part B. Customers do not
 * have to use it — any clear statement cancels — but it has to exist and be
 * reachable before they buy, which is why /epcs and /terms both link here.
 */
export default function EpcCancellationForm() {
  return (
    <LegalPage
      title="Cancellation form"
      intro="Use this if you want to cancel an EPC you booked online. You don't have to — any clear statement will do."
      updated={COMPANY.lastUpdatedTerms}
    >
      <h2>Your right to cancel</h2>
      <p>
        If you booked an EPC through this website you have <strong>14 days</strong>, starting the day
        after you placed your order, to cancel for any reason and receive a full refund. We refund to
        the card you paid with, within 14 days of you telling us.
      </p>
      <p>
        If you ask us to carry out the assessment <strong>within</strong> those 14 days and then
        cancel before it is finished, you pay a proportionate amount for the work already carried
        out. Once the assessment has been carried out and the certificate lodged on the national
        register, the service is complete and the right to cancel ends.
      </p>

      <h2>How to cancel</h2>
      <p>
        Email <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>, call{' '}
        <a href={`tel:${COMPANY.phoneHref}`}>{COMPANY.phone}</a>, or post the wording below to{' '}
        {COMPANY.legalName}, {COMPANY.registeredOffice}.
      </p>

      <h2>Model cancellation form</h2>
      <p>Copy the wording below into an email or letter, fill in the gaps, and send it to us.</p>
      <blockquote>
        <p>
          To {COMPANY.legalName}, {COMPANY.registeredOffice}, {COMPANY.email}:
        </p>
        <p>
          I/We [*] hereby give notice that I/We [*] cancel my/our [*] contract of sale of the
          following goods [*]/for the supply of the following service [*],
        </p>
        <p>Ordered on [*]/received on [*],</p>
        <p>Name of consumer(s),</p>
        <p>Address of consumer(s),</p>
        <p>Signature of consumer(s) (only if this form is notified on paper),</p>
        <p>Date</p>
        <p>[*] Delete as appropriate.</p>
      </blockquote>

      <p>
        It helps us find your booking quickly if you also quote the property address and the email
        address you used at checkout.
      </p>
    </LegalPage>
  )
}
