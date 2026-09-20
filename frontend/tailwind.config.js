export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef2f7',
          100: '#d6e0ec',
          200: '#aec1d9',
          300: '#7f9cbd',
          400: '#4f739c',
          500: '#325780',
          600: '#22436a',
          700: '#183456',
          800: '#122845',
          900: '#0c1c33',
          950: '#050f1e'
        },
        signal: {
          red: '#b3261e',
          amber: '#a15c00',
          amberLight: '#c77b00',
          teal: '#0f6d5c',
          blue: '#1a4a8c'
        }
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      borderRadius: {
        none: '0px',
        sm: '8px',
        DEFAULT: '12px',
        md: '14px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        full: '9999px'
      }
    }
  },
  plugins: []
}
