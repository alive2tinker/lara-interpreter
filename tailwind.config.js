/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './renderer.js'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        editor: {
          dark: '#1e1e1e',
          light: '#ffffff'
        }
      }
    },
  },
  plugins: [],
};
