import type { Config } from "tailwindcss";

// Palette drawn from Pattachitra itself: vermilion (sindoor) red, temple
// maroon, turmeric yellow, conch-shell cream and lamp-black outlines.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sindoor: { DEFAULT: "#B5261E", dark: "#8E1B15", light: "#D9473C" },
        maroon: { DEFAULT: "#5A1414", deep: "#3A0B0B" },
        haldi: { DEFAULT: "#E3A21A", light: "#F3C85A", pale: "#FBEBC2" },
        shankh: { DEFAULT: "#FBF4E6", dark: "#F2E6CC" },
        leaf: { DEFAULT: "#2F5D3A" },
        ink: { DEFAULT: "#1C1410", soft: "#4A3B32" },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
        body: ['"Mulish"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,20,16,.06), 0 8px 24px -12px rgba(90,20,20,.25)",
      },
      keyframes: {
        "slide-up": { from: { transform: "translateY(12px)", opacity: "0" }, to: { transform: "none", opacity: "1" } },
      },
      animation: { "slide-up": "slide-up .25s ease-out" },
    },
  },
  plugins: [],
};

export default config;
