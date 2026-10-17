import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#0F1A26",
          800: "#17283B", // Deep ink navy
          700: "#223B56",
          600: "#325070",
        },
        slate: {
          muted: "#526A80",
          light: "#7891A6",
        },
        sand: {
          DEFAULT: "#F7F6F2", // Warm off-white
          50: "#FCFCF9",
          100: "#F7F6F2",
          200: "#EFECE4",
          300: "#E2DDD2",
        },
        mist: {
          DEFAULT: "#E8EEF2", // Pale blue-grey
          border: "#D3DDE5",
        },
        graphite: {
          DEFAULT: "#252B33", // Primary body text
          light: "#4E5763",
          subtle: "#75808F",
        },
        evidence: {
          supported: "#347C70", // Restrained teal
          supportedBg: "#EBF5F3",
          unresolved: "#B98237", // Muted amber
          unresolvedBg: "#FDF7ED",
          contradicted: "#B65353", // Muted red
          contradictedBg: "#FDF1F1",
          abstain: "#6366F1",
        },
      },
      fontFamily: {
        serif: ["Newsreader", "Charter", "Georgia", "serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        editorial: "0 1px 3px 0 rgba(23, 40, 59, 0.06), 0 1px 2px 0 rgba(23, 40, 59, 0.04)",
        panel: "0 4px 12px 0 rgba(23, 40, 59, 0.08)",
        modal: "0 12px 32px 0 rgba(23, 40, 59, 0.16)",
      },
    },
  },
  plugins: [],
};

export default config;
