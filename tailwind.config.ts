import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette — dark luxury editorial
        brand: {
          bg:       '#0a0a0f',
          surface:  '#12121a',
          card:     '#1a1a26',
          border:   '#2a2a3a',
          accent:   '#a8ff3e',       // lime green CTA
          accent2:  '#3e8fff',       // electric blue secondary
          gold:     '#f0c040',       // prize / jackpot
          muted:    '#6b7280',
          text:     '#e8e8f0',
          subtext:  '#9999b0',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body:    ['var(--font-body)', 'sans-serif'],
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        reveal: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        flipIn: {
          '0%': { transform: 'rotateY(90deg)', opacity: '0' },
          '100%': { transform: 'rotateY(0deg)', opacity: '1' },
        },
        countUp: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        pulse2: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        'fade-up':  'fadeUp 0.6s ease-out forwards',
        'reveal':   'reveal 0.4s ease-out forwards',
        'flip-in':  'flipIn 0.5s ease-out forwards',
        'pulse2':   'pulse2 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
