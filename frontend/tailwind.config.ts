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
          900: "#0a0a0f",
          800: "#12121a",
          700: "#1b1b27",
          600: "#262635",
        },
        brand: {
          50: "#eef6ff",
          400: "#5b9dff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        gold: "#e6b34a",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Sora", "Inter", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 60px -15px rgba(59,130,246,0.45)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
