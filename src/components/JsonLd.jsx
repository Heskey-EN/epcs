/**
 * Emits a JSON-LD graph as a <script type="application/ld+json"> block.
 *
 * Rendered by React, so it lands in the PRE-RENDERED HTML — crawlers and AI
 * agents that never execute JavaScript still read it. That only works because
 * of the build-time prerender step; in a plain SPA this markup would be
 * invisible to exactly the clients it exists for.
 */
export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      // The payload is our own structured data, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
