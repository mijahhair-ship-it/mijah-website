/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html', './cart.js'],
  theme: {
    extend: {
      colors: {
        sage: {
          50:  '#f4f7f0',
          100: '#e5ede0',
          200: '#ccdcc4',
          600: '#4a6e3d',
          700: '#3d5a33',
          900: '#2b3d24',
        },
        cream: {
          50: '#fefdf9',
        },
        gold: {
          300: '#e8c98a',
          400: '#d4a853',
          500: '#c09040',
        },
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans:  ['Jost', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
