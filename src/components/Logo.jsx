import { Link } from 'react-router-dom'

// The Eco Futures logo in two colourways, both cut from the master artwork:
//  - `light` (default): navy wordmark and house, for white backgrounds
//  - `dark`: white wordmark and house, for the navy footer and dark panels
// Both files are 640×375 and sit in public/brand/.
const SRC = {
  light: '/brand/eco-futures-logo.png',
  dark: '/brand/eco-futures-logo-white.png',
}

export default function Logo({ variant = 'light', className = 'h-14 md:h-16', link = true }) {
  const img = (
    <img
      src={SRC[variant] || SRC.light}
      width="640"
      height="375"
      alt="Eco Futures"
      className={`${className} w-auto`}
    />
  )
  if (!link) return img
  return (
    <Link to="/" className="flex shrink-0 items-center" aria-label="Eco Futures — home">
      {img}
    </Link>
  )
}
