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
        bgPrimary: "var(--bg-primary)",
        bgSecondary: "var(--bg-secondary)",
        bgCard: "var(--bg-card)",
        borderSubtle: "var(--border-subtle)",
        borderMedium: "var(--border-medium)",
        accentBlue: "var(--accent-blue)",
        textPrimary: "var(--text-primary)",
        textSecondary: "var(--text-secondary)",
        textMuted: "var(--text-muted)",
      },
      fontFamily: {
        heading: ["var(--font-sora)", "sans-serif"],
        body: ["var(--font-dm)", "sans-serif"],
      },
      boxShadow: {
        blueGlow: "0 0 24px rgba(59,130,246,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
