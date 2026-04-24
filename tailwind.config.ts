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
        brand: {
          bg:      '#080810',
          surface: '#0f0f1a',
          card:    '#13131f',
          border:  '#1e1e30',
          'border-hi': '#2a2a42',
          accent:  '#a8ff3e',
          'accent-dim': '#7acc1e',
          accent2: '#4f8fff',
          gold:    '#f5c842',
          text:    '#eeeef8',
          subtext: '#8888aa',
          muted:   '#44445a',
          danger:  '#ff4f4f',
          success: '#22d67a',
        },
      },
      fontFamily: {
        display: ['Bricolage Grotesque', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh': 'radial-gradient(at 40% 20%, rgba(168,255,62,0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(79,143,255,0.06) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(168,255,62,0.04) 0px, transparent 50%)',
      },
      boxShadow: {
        'accent': '0 0 40px rgba(168,255,62,0.18)',
        'accent-lg': '0 0 80px rgba(168,255,62,0.22)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'card-lg': '0 12px 48px rgba(0,0,0,0.5)',
        'inner-accent': 'inset 0 0 0 1px rgba(168,255,62,0.2)',
      },
      keyframes: {
        fadeUp:      { from: { opacity:'0', transform:'translateY(24px)' }, to: { opacity:'1', transform:'translateY(0)' } },
        fadeIn:      { from: { opacity:'0' }, to: { opacity:'1' } },
        scaleIn:     { from: { opacity:'0', transform:'scale(0.92)' }, to: { opacity:'1', transform:'scale(1)' } },
        slideRight:  { from: { transform:'translateX(-100%)' }, to: { transform:'translateX(0)' } },
        orbFloat:    { '0%,100%': { transform:'translateY(0)' }, '50%': { transform:'translateY(-20px)' } },
        activeBlink: { '0%,100%': { opacity:'1' }, '50%': { opacity:'0.4' } },
        spin:        { to: { transform:'rotate(360deg)' } },
      },
      animation: {
        'fade-up':    'fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) forwards',
        'fade-in':    'fadeIn 0.4s ease forwards',
        'scale-in':   'scaleIn 0.4s cubic-bezier(0.22,1,0.36,1) forwards',
        'orb-float':  'orbFloat 6s ease-in-out infinite',
        'blink':      'activeBlink 2s ease-in-out infinite',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.22,1,0.36,1)',
      },
    },
  },
  plugins: [],
}

export default config