// Site photography. All files live in public/images/ and were produced from
// Unsplash photographs (Unsplash Licence: free for commercial use, no
// attribution required — https://unsplash.com/license). The `source` is the
// Unsplash CDN id of the original, kept so a photo can be traced or replaced.
//
// This deployment is one booking page, so it carries two photographs rather
// than the full set on ecofutures.uk. Swap either for George's own by dropping
// a file into public/images/ and changing the path here. The header wants
// 1920×800 so a replacement keeps the layout.

export const IMAGES = {
  // The page-header background behind the hero and the order card.
  headerEpcs: {
    src: '/images/header-epcs.jpg',
    alt: 'A brick terrace with painted front doors',
    source: 'photo-1618660920685-4505debb785a',
  },
  // Footer backdrop, heavily darkened by a navy wash over the top.
  footer: {
    src: '/images/header-blackpool.jpg',
    alt: '',
    source: 'photo-1657991783650-ea7d453c119b',
  },
}
