import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        arctic: {
          50: "#f0f9ff",
          100: "#e0f4ff",
          200: "#bae8ff",
          300: "#a8edff",
          400: "#67d8f5",
          500: "#22c4e8",
          600: "#0099cc",
          900: "#003a52",
        },
        frost: {
          bg: "#02080f",
          card: "#040f1a",
          glass: "rgba(168, 237, 255, 0.04)",
          border: "rgba(168, 237, 255, 0.12)",
        },
      },
    },
  },
};

export default config;
