import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ice: {
          50: "#f0faff",
          100: "#e0f5ff",
          200: "#aee7f7",
          300: "#0fb5d3",
          400: "#0099bb",
          500: "#007a99",
          600: "#005c73",
          900: "#020c15",
        },
        cave: {
          bg: "#020c15",
          deep: "#041824",
          glass: "rgba(10, 50, 80, 0.35)",
          border: "rgba(15, 181, 211, 0.18)",
        },
      },
    },
  },
};

export default config;
