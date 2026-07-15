/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
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
        surface: {
          DEFAULT: "var(--surface)",
          mid: "var(--surface-mid)",
          stripe: "var(--surface-stripe)",
          header: "var(--surface-header)",
          panel: "var(--surface-panel)",
          control: "var(--surface-control)",
        },
        line: {
          DEFAULT: "var(--line)",
          strong: "var(--line-strong)",
        },
        tint: {
          DEFAULT: "var(--tint)",
          strong: "var(--tint-strong)",
        },
        overlay: {
          DEFAULT: "var(--overlay)",
          soft: "var(--overlay-soft)",
        },
        ink: {
          100: "var(--ink-100)",
          200: "var(--ink-200)",
          300: "var(--ink-300)",
          400: "var(--ink-400)",
          500: "var(--ink-500)",
          600: "var(--ink-600)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          strong: "var(--accent-strong)",
        },
        positive: "var(--positive)",
        negative: "var(--negative)",
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
