// Language: JavaScript (ES Modules)
// Purpose: Configures Tailwind CSS design system with the SERENDIP Sri Lankan Heritage palette, typography, and box shadows.
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // SERENDIP Official Heritage Palette
        heritage: {
          DEFAULT: '#315D4F', // Primary Heritage Green
          green: '#315D4F',
          secondary: '#426F60', // Secondary Green
          hover: '#19372E', // Hover Green
          dark: '#19372E',
          light: '#426F60',
          50: '#F2F6F4',
          100: '#E1ECE7',
          200: '#C2D9CF',
          300: '#94BCAC',
          400: '#5F9580',
          500: '#315D4F',
          600: '#2A5144',
          700: '#214238',
          800: '#19372E',
          900: '#122620',
        },
        gold: {
          DEFAULT: '#A48B57', // Antique Gold
          antique: '#A48B57',
          light: '#BD9F75', // Light Gold
          dark: '#876F3E',
          50: '#FAF7F0',
          100: '#F3ECD9',
          200: '#E6D7B0',
          300: '#D5BE82',
          400: '#BD9F75',
          500: '#A48B57',
          600: '#8A7342',
          700: '#6C5832',
        },
        ivory: {
          DEFAULT: '#F9F6EF', // Main Background
          warm: '#F9F6EF',
          surface: '#E9E4D7', // Surface Background
          border: '#D6CBB5', // Border
          50: '#FFFFFF',
          100: '#FCFAF6',
          200: '#F9F6EF',
          300: '#F2EDE1',
          400: '#E9E4D7',
          500: '#D6CBB5',
          600: '#B8AA91',
          700: '#92846D',
        },
        forest: {
          DEFAULT: '#222B1F', // Primary Text
          text: '#222B1F',
          muted: '#7A755D', // Readable Muted Text
          soft: '#ADA78A', // Muted Accent
        },
        // Backward-compatibility aliases for existing components
        serendip: {
          50: '#F2F6F4',
          100: '#E1ECE7',
          200: '#C2D9CF',
          300: '#94BCAC',
          400: '#5F9580',
          500: '#315D4F',
          600: '#2A5144',
          700: '#214238',
          800: '#19372E',
          900: '#122620',
          950: '#0B1713',
        },
        ceylon: {
          sapphire: '#1D3B53',
          ruby: '#7A2222',
          amber: '#A48B57',
          tea: '#3A2E2B',
          cinnamon: '#874F2F',
        }
      },
      fontFamily: {
        serif: [
          'Playfair Display',
          'Cinzel',
          'Georgia',
          'Cambria',
          'serif'
        ],
        sans: [
          'Plus Jakarta Sans',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(34, 43, 31, 0.05)',
        'premium': '0 10px 30px -10px rgba(49, 93, 79, 0.12), 0 4px 6px -2px rgba(49, 93, 79, 0.04)',
        'elevated': '0 20px 40px -15px rgba(34, 43, 31, 0.14), 0 0 1px 1px rgba(214, 203, 181, 0.4)',
        'gold': '0 4px 20px -2px rgba(164, 139, 87, 0.25)',
        'heritage': '0 4px 20px -2px rgba(49, 93, 79, 0.3)',
      }
    },
  },
  plugins: [],
}
