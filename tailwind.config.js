/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        unity: {
          navy: {
            50: '#F0F4F8',
            100: '#D9E2EC',
            200: '#BCCCDC',
            300: '#9FB3C8',
            400: '#627D98',
            500: '#334E68',
            600: '#243B53',
            700: '#102A43',
            800: '#0B192C',
            900: '#07101E',
            950: '#030810',
          },
          teal: {
            50: '#F0FDFA',
            100: '#CCFBF1',
            200: '#99F6E4',
            300: '#5EEAD4',
            400: '#2DD4BF',
            500: '#14B8A6',
            600: '#0D9488',
            700: '#0F766E',
            800: '#115E59',
            900: '#134E4A',
          },
          cyan: {
            400: '#22D3EE',
            500: '#06B6D4',
            600: '#0891B2',
          },
          gold: {
            400: '#FBBF24',
            500: '#F59E0B',
            600: '#D97706',
          },
          yellow: {
            50: '#FFFAEB',
            100: '#FEF0C7',
            200: '#FEDF89',
            300: '#FEC84B',
            400: '#FDB022',
            500: '#FCB913', // Official Unity Bank Yellow
            600: '#D99B06',
            700: '#B57D05',
            800: '#8A5D07',
            900: '#684507',
            950: '#3D2502',
          },
          obsidian: {
            950: '#0B0D10',
            900: '#12151B',
            850: '#181C24',
            800: '#1F242F',
            700: '#2D3545',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
