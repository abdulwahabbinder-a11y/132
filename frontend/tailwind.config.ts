import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./remotion/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0f4ff",
          100: "#e0e9ff",
          200: "#c7d6fe",
          300: "#a5b8fc",
          400: "#8196f8",
          500: "#6470f1",
          600: "#5254e5",
          700: "#4540ca",
          800: "#3935a3",
          900: "#312f81",
          950: "#1e1b4b",
        },
        surface: {
          DEFAULT: "#0f0f1a",
          card:    "#16162a",
          border:  "#2a2a4a",
        },
      },
      fontFamily: {
        sans:    ["Inter", "system-ui", "sans-serif"],
        display: ["Sora", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "hero-gradient":   "linear-gradient(135deg, #0f0f1a 0%, #1a0a3a 50%, #0a1a3a 100%)",
        "card-gradient":   "linear-gradient(135deg, rgba(100, 112, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)",
        "glow-brand":      "radial-gradient(ellipse at center, rgba(100,112,241,0.15) 0%, transparent 70%)",
      },
      animation: {
        "fade-in":        "fadeIn 0.6s ease-out",
        "slide-up":       "slideUp 0.5s ease-out",
        "pulse-glow":     "pulseGlow 3s ease-in-out infinite",
        "gradient-shift": "gradientShift 8s ease infinite",
        "progress-bar":   "progressBar 2s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(100, 112, 241, 0.3)" },
          "50%":       { boxShadow: "0 0 40px rgba(100, 112, 241, 0.6)" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%":       { backgroundPosition: "100% 50%" },
        },
        progressBar: {
          "0%":   { width: "0%" },
          "100%": { width: "100%" },
        },
      },
      boxShadow: {
        "glow-sm":  "0 0 15px rgba(100, 112, 241, 0.2)",
        "glow-md":  "0 0 30px rgba(100, 112, 241, 0.3)",
        "glow-lg":  "0 0 60px rgba(100, 112, 241, 0.4)",
        "card":     "0 4px 24px rgba(0, 0, 0, 0.4)",
      },
      aspectRatio: {
        "21/9": "21 / 9",
      },
    },
  },
  plugins: [],
};

export default config;
