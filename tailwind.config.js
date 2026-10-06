/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#14286b', 50: '#eef1fb', 100: '#d9e0f5', 600: '#1d3590', 700: '#14286b', 800: '#0f1f54', 900: '#0a163d' },
        saffron: { DEFAULT: '#f7941d', 50: '#fff6eb', 100: '#ffe8cc', 400: '#ffab47', 500: '#f7941d', 600: '#e07b06' },
        festive: { red: '#e63323', yellow: '#ffc93c', green: '#1f9d4c' },
        cream: '#fffaf2',
      },
      fontFamily: {
        display: ['"Baloo 2"', '"Noto Sans Tamil"', 'system-ui', 'sans-serif'],
        sans: ['Inter', '"Noto Sans Tamil"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,40,107,.06), 0 4px 16px rgba(20,40,107,.06)',
        lift: '0 8px 28px rgba(20,40,107,.14)',
      },
    },
  },
  plugins: [],
}
