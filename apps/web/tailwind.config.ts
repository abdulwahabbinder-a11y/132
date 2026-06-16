import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b1020",
        panel: "#121a31",
        accent: "#7c3aed",
        cyan: "#38bdf8",
      },
    },
  },
  plugins: [],
};

export default config;
