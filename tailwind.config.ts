import type { Config } from 'tailwindcss';

/**
 * Paleta presa del logo de la 4a edició: lila elèctric i groc àcid,
 * amb el degradat groc → lila com a element de marca (la franja del logo).
 */
const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        violet: {
          50: '#F7F1FF',
          100: '#EFE0FF',
          200: '#DFC2FF',
          300: '#C89BFF',
          400: '#AC67FA',
          500: '#8B2BE8',
          600: '#7A1FD1',
          700: '#6417AE',
          800: '#4B0F85',
          900: '#2E0757',
          950: '#1B0435',
        },
        acid: {
          50: '#FBFEE6',
          100: '#F6FDBF',
          200: '#F1FA7D',
          300: '#EBF63F',
          400: '#E6EF0C',
          500: '#CBD400',
          600: '#A2AA00',
          700: '#7A8000',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Impact', 'sans-serif'],
      },
      backgroundImage: {
        'brand-bar': 'linear-gradient(90deg, #E6EF0C 0%, #8B2BE8 100%)',
        'brand-bar-r': 'linear-gradient(90deg, #8B2BE8 0%, #E6EF0C 100%)',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.2' },
        },
      },
      animation: {
        blink: 'blink 1.1s steps(1, end) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
