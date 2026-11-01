// Language: JavaScript (ES Modules)
// Purpose: Configures Tailwind CSS design system, defining content scan paths, custom color palettes ('serendip', 'ceylon'), typography, and box shadows.
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        serendip: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        ceylon: {
          sapphire: '#0f2b5c',
          ruby: '#881337',
          amber: '#d97706',
          tea: '#3b2f2f',
          cinnamon: '#8d4925'
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'premium': '0 10px 30px -10px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
        'elevated': '0 20px 40px -15px rgba(0, 0, 0, 0.12), 0 0 1px 1px rgba(0,0,0,0.03)',
      }
    },
  },
  plugins: [],
}
