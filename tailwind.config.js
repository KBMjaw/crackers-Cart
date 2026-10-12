/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // 'navy' token now carries the Shanmuga brand green
        navy: { DEFAULT: '#0f5a2c', 50: '#ecf7ef', 100: '#d3ecda', 600: '#16773a', 700: '#0f5a2c', 800: '#0b4824', 900: '#07331a' },
        saffron: { DEFAULT: '#f7941d', 50: '#fff6eb', 100: '#ffe8cc', 400: '#ffab47', 500: '#f7941d', 600: '#e07b06' },
        festive: { red: '#e63323', yellow: '#ffc93c', green: '#1f9d4c' },
        cream: '#fffaf2',
      },
      fontFamily: {
        display: ['"Baloo 2"', '"Noto Sans Tamil"', 'system-ui', 'sans-serif'],
        sans: ['Inter', '"Noto Sans Tamil"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,90,44,.06), 0 4px 16px rgba(15,90,44,.06)',
        lift: '0 8px 28px rgba(15,90,44,.14)',
      },
    },
  },
  plugins: [],
}
