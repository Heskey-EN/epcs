/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── Ground ──────────────────────────────────────────────────────
        // The page is white. `paper` is the quiet grey-green for alternate
        // sections and tiles; `line` is the hairline used for every border.
        paper: { DEFAULT: '#F4F7F5', deep: '#EAF0EC', card: '#FFFFFF', warm: '#F7F8FA' },
        line: { DEFAULT: '#E2E8E4', strong: '#CBD5CF' },

        // ── Text ────────────────────────────────────────────────────────
        ink: { DEFAULT: '#1A2330', soft: '#47525E', faint: '#6B7683' },

        // ── Brand green (from the leaf and the top of the logo's bar chart) ─
        // `green` is the action colour: buttons, links, section headings.
        // 700 passes AA on white for text; 400 is the lime accent on navy.
        green: {
          50: '#EEF6EF',
          100: '#DCEDDF',
          200: '#B9DBBF',
          300: '#8CC896',
          400: '#8BC34A',
          500: '#4CAF50',
          600: '#3A9146',
          700: '#2E7A3B',
          800: '#245F2F',
          900: '#183F20',
          DEFAULT: '#2E7A3B',
        },

        // ── Brand navy (the logo's ground) ──────────────────────────────
        // Used for the footer, the utility bar and dark panels only.
        navy: { DEFAULT: '#0D1B2A', 800: '#132638', 700: '#1B3349', deep: '#081521' },

        // ── Semantic ────────────────────────────────────────────────────
        danger: { DEFAULT: '#B42318', soft: '#FEF3F2' },
        amber: { DEFAULT: '#E8B23A' },

        // ── Legacy aliases ──────────────────────────────────────────────
        // Still referenced by the private Retrofit Suite pages (which were
        // not part of the marketing redesign). Do not use on public pages.
        ember: { DEFAULT: '#B9481F', soft: '#CE6236', deep: '#933814' },
        moss: { DEFAULT: '#2E7A3B', soft: '#3A9146', deep: '#245F2F' },
      },
      fontFamily: {
        // Outfit for headings: a clean geometric face that reads corporate at
        // light weights. Hanken Grotesk stays for body copy and UI.
        display: ['"Outfit"', 'system-ui', 'sans-serif'],
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        site: '1200px',
        prose: '66ch',
      },
      borderRadius: {
        DEFAULT: '6px',
        lg: '10px',
        xl: '16px',
        '2xl': '22px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(26,35,48,0.04), 0 4px 16px -4px rgba(26,35,48,0.08)',
        lift: '0 8px 28px -8px rgba(26,35,48,0.18)',
        header: '0 1px 0 rgba(26,35,48,0.06), 0 6px 20px -10px rgba(26,35,48,0.15)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in': 'fade-in 0.9s ease-out both',
      },
    },
  },
  plugins: [],
}
