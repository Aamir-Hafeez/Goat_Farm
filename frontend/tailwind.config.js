/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: "#16a34a",       // A vibrant, modern green (Tailwind 'green-600')
        forestDark: "#15803d",   // A slightly darker green
        lightGreen: "#dcfce7",   // A very light, airy green (Tailwind 'green-50')
        softGray: "#fdfdfd",     // An even brighter, whiter background (near white)
      },
    },
  },
  plugins: [],
}