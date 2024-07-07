/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [`./views/**/*.ejs`],
  theme: {
    extend: {},
  },

  daisyui: {
    themes: ['acid'],
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
}

