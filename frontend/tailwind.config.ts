import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./video-composer/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f3f7ff",
          100: "#d9e6ff",
          500: "#3b82f6",
          700: "#1d4ed8",
          950: "#0b1229"
        }
      }
    },
  },
  plugins: [],
};

export default config;
