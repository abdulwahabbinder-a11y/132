import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#05060A",
          900: "#0A0B12",
          800: "#101220",
          700: "#1A1C2E",
          600: "#2A2D44",
        },
        accent: {
          DEFAULT: "#FF5C2A",
          soft: "#FF8A66",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'Space Grotesk'", "Inter", "sans-serif"],
      },
      backgroundImage: {
        "grid-radial":
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,92,42,0.18), transparent)",
      },
    },
  },
  plugins: [],
};

export default config;
