import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Light professional palette
        surface: {
          DEFAULT: '#f1f5f9',   // page background
          50:  '#f8fafc',       // subtle bg
          100: '#ffffff',       // cards
          200: '#e2e8f0',       // borders
          300: '#cbd5e1',       // stronger borders / input bg
          400: '#94a3b8',       // disabled / muted
        },
        // Sidebar indigo
        sidebar: {
          DEFAULT: '#312e81',   // indigo-900
          hover:   '#3730a3',   // indigo-800
          active:  '#4338ca',   // indigo-700
          text:    '#c7d2fe',   // indigo-200
          muted:   '#818cf8',   // indigo-400
          border:  '#3730a3',   // indigo-800
        },
        brand: {
          DEFAULT: '#4f46e5',
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        accent: {
          green:  '#16a34a',
          yellow: '#d97706',
          red:    '#dc2626',
          purple: '#9333ea',
          cyan:   '#0891b2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl:  '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-md': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
      },
    },
  },
  plugins: [],
}

export default config
