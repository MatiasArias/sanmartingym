import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sanmartin: {
          red: '#E31E24',
          black: '#1A1A1A',
          white: '#FFFFFF',
        },
      },
    },
  },
  plugins: [],
};
export default config;
