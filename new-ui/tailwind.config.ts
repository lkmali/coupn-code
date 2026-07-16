import type { Config } from 'tailwindcss'

/**
 * ArenaX palette — dark surface, gold accent.
 *
 * NOTE: this file was reconstructed from the tokens referenced across the
 * components (gold #F4C542 / #D89F00, surface #0B0B0D). If the original design
 * spec resurfaces, prefer it over these values.
 */
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0B0D',
        surface: '#141417',
        border: '#2A2A30',
        gold: {
          primary: '#F4C542',
          dark: '#D89F00',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#9A9AA5',
        },
        error: '#EF4444',
        success: '#22C55E',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-outfit)', 'var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
