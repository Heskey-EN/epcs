import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * The deployment's own origin is injected at build time rather than hardcoded,
 * because this repo is meant to run on a domain that is not decided yet. See
 * src/data/site.js for why every URL in the output derives from this.
 *
 * VERCEL_PROJECT_PRODUCTION_URL is supplied by Vercel automatically and comes
 * without a scheme, so it is normalised here.
 */
const resolveSiteUrl = () => {
  const explicit = process.env.SITE_URL
  if (explicit) return explicit.replace(/\/+$/, '')
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`
  return 'http://localhost:5173'
}

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_SITE_URL': JSON.stringify(resolveSiteUrl()),
    'import.meta.env.VITE_INDEXABLE': JSON.stringify(process.env.INDEXABLE || ''),
  },
})
