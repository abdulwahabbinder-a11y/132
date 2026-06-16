import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050712",
        brass: "#d6a84f",
        signal: "#7dd3fc"
      },
      boxShadow: {
        glow: "0 0 60px rgba(125, 211, 252, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
