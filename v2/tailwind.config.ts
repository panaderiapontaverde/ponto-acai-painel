import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        acai: {
          50: "#f5f0fb",
          100: "#e6d9f5",
          200: "#cdb3eb",
          300: "#b18ddc",
          400: "#9566c9",
          500: "#7a45b3",
          600: "#5f3391",
          700: "#492670",
          800: "#331a4f",
          900: "#1f0f30",
        },
      },
    },
  },
  plugins: [],
};

export default config;
