import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import Book from './pages/Book.jsx'
import Booked from './pages/Booked.jsx'
import CancellationForm from './pages/CancellationForm.jsx'
import Privacy from './pages/Privacy.jsx'
import Cookies from './pages/Cookies.jsx'
import Terms from './pages/Terms.jsx'
import NotFound from './pages/NotFound.jsx'
import BlogIndex from './pages/BlogIndex.jsx'
import BlogPost from './pages/BlogPost.jsx'

/**
 * One job: sell and book a domestic EPC.
 *
 * Every route here exists because the sale needs it. The booking page is the
 * site root, the post-payment page is where Stripe returns, and the rest are
 * the documents a business is required to publish before taking money online:
 * the cancellation form under the Consumer Contracts Regulations, and the
 * privacy, cookie and terms pages.
 *
 * The blog (/blog) is the one addition that is not part of the sale: EPC news
 * and guides that earn organic search traffic. Posts live in content/blog/*.md.
 */
export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Book />} />
          {/* Where Stripe returns a paying customer to choose their dates. */}
          <Route path="/booked" element={<Booked />} />
          <Route path="/cancellation-form" element={<CancellationForm />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/blog" element={<BlogIndex />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  )
}
