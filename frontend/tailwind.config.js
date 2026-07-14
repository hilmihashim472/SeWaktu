/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brass: {
          DEFAULT: "#C4933F",
          light: "#D9AE63",
          dark: "#9C7530",
        },
        night: {
          deep: "#0B1F2A",
          mid: "#132C38",
          light: "#1C3D4B",
        },
      },
      fontFamily: {
        serif: ["Amiri", "serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "spin-slow": "spin 120s linear infinite",
        "fade-in-up": "fade-in-up 0.5s ease-out both",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
