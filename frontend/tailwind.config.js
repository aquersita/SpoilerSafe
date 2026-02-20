/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#F47521", // Crunchyroll Orange
        "background-light": "#ffffff",
        "background-dark": "#1a1a1a",
        "surface-light": "#ffffff",
        "surface-dark": "#23252b",
        "text-main": "#212121",
        "text-secondary": "#555555",
        "border-light": "#e5e7eb"
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        demonslayer: ['BloodCrow', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        "lg": "0.5rem", 
        "xl": "0.75rem", 
        "full": "9999px"
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(to top, #ffffff 0%, rgba(255,255,255,0.8) 10%, rgba(255,255,255,0) 60%)',
        'hero-gradient-side': 'linear-gradient(to right, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%)',
      }
    },
  },
  plugins: [],
}
