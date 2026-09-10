import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="container-site flex min-h-[62vh] flex-col items-center justify-center gap-5 py-24 text-center">
      <span className="kicker">Error 404</span>
      <h1 className="font-display text-5xl font-medium text-ink md:text-6xl">Page not found</h1>
      <p className="max-w-md text-ink-soft">
        That page does not exist or has moved. Let us get you back to the start.
      </p>
      <Link to="/" className="btn-primary mt-2">
        Back to home
      </Link>
    </section>
  )
}
