/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["IBM Plex Sans", "Segoe UI", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      colors: {
        ink: {
          950: "#07111d",
          900: "#0b1f33",
          800: "#123047",
          700: "#1b425c",
        },
        mint: {
          50: "#eefbf7",
          100: "#d5f4ea",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0f766e",
        },
        sand: "#f3efe6",
      },
      boxShadow: {
        card: "0 10px 30px -18px rgba(11, 31, 51, 0.35)",
      },
    },
  },
  plugins: [],
};
