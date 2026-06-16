import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        surface: "#111114",
        surfaceAlt: "#17171c",
        accent: "#f4c542",
        accentSoft: "#fde7a4",
        muted: "#8b8b96",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["'Playfair Display'", "ui-serif", "Georgia"],
      },
      boxShadow: {
        glow: "0 0 80px -20px rgba(244,197,66,0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
