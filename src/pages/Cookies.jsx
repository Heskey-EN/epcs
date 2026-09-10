import LegalPage from '../components/LegalPage.jsx'
import { COOKIE_SETTINGS_EVENT } from '../components/CookieBanner.jsx'
import { COMPANY } from '../data/company.js'

function openSettings() {
  window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))
}

export default function Cookies() {
  return (
    <LegalPage
      title="Cookie Policy"
      intro="What cookies we use, and how to control them."
      updated={COMPANY.lastUpdatedCookies}
    >
      <h2>What cookies are</h2>
      <p>
        Cookies are small text files stored on your device when you visit a website. Similar
        technologies such as your browser’s local storage work in the same way. They can be
        “essential” (needed for the site to function) or “non-essential” (for example analytics).
      </p>

      <h2>Our approach</h2>
      <p>
        We don’t set any non-essential cookies until you tell us we can. When you first visit, a
        banner asks whether you’re happy for us to use analytics and advertising measurement. Until
        you choose <strong>Accept all</strong>, neither Google Analytics nor the Google Ads tag is
        loaded, and neither sets any cookies. You can change your choice at any time.
      </p>
      <p>
        We also use <strong>Vercel Web Analytics</strong> to count page views. It is not on this
        list because it uses no cookies at all — it stores nothing on your device, sets no
        identifier and cannot recognise you on a return visit or on another site. There is nothing
        for you to consent to, so it runs whichever choice you make above. If you would rather it
        did not, a content blocker will stop it.
      </p>
      <p>
        <button
          type="button"
          onClick={openSettings}
          className="btn-primary px-5 py-2.5 text-sm no-underline"
        >
          Change your cookie settings
        </button>
      </p>

      <h2>Cookies we use</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Purpose</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>ecofutures-cookie-consent</td>
            <td>Essential</td>
            <td>Remembers your cookie choice so we don’t ask again (stored in your browser).</td>
            <td>Up to 12 months, then we ask again</td>
          </tr>
          <tr>
            <td>_ga, _ga_&lt;id&gt;</td>
            <td>Analytics (only if accepted)</td>
            <td>Set by Google Analytics to measure how visitors use the site.</td>
            <td>Up to 2 years</td>
          </tr>
          <tr>
            <td>_gcl_au, _gcl_aw</td>
            <td>Advertising measurement (only if accepted)</td>
            <td>
              Set by the Google Ads tag so that a booking can be matched to a click on one of our
              adverts. Used to measure whether the adverts work, not to build a profile of you.
            </td>
            <td>Up to 90 days</td>
          </tr>
        </tbody>
      </table>

      <h2>Fonts and other requests</h2>
      <p>
        Our web fonts are served by Google Fonts, which may receive your IP address when a page
        loads. This doesn’t set or read a cookie, but we mention it for transparency — see our{' '}
        <a href="/privacy">Privacy Policy</a> for more on third parties.
      </p>

      <h2>Managing cookies</h2>
      <p>
        As well as the settings button above, you can control or delete cookies through your browser
        settings, and you can opt out of Google Analytics across all sites using Google’s{' '}
        <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noreferrer">
          opt-out browser add-on
        </a>
        . Blocking essential cookies may affect how the site works.
      </p>

      <h2>More information</h2>
      <p>
        For how we handle personal data more generally, see our <a href="/privacy">Privacy Policy</a>.
        Questions? Email <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
      </p>
    </LegalPage>
  )
}
