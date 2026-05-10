/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1A1A1A",
        secondary: "#2A2A2A",
        accent: "#00FF88",
        danger: "#FF3366",
        warning: "#FFCC00"
      }
    },
  },
  plugins: [],
}
