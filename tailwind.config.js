/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./js/**/*.js",
    "./styles/**/*.css"
  ],
  theme: {
    extend: {
      fontFamily: {
        'montserrat': ['Montserrat', 'sans-serif'],
        'stolzl': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}