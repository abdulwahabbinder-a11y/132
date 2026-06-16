import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#05060a",
        ember: "#ff6a3d",
        gold: "#f4c15d"
      },
      boxShadow: {
        glow: "0 0 80px rgba(244, 193, 93, 0.22)"
      }
    }
  },
  plugins: []
};

export default config;
