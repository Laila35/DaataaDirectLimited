/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        accent: "#a384f5",
        ink: "#2a1a4a",
        wash: "#efeff4",
        note: "#f3eefe",
      },
      fontFamily: {
        sans: ["Outfit", '"Helvetica Neue"', "Arial", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
