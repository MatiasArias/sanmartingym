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
      // Tokens de diseño: tipografía y espaciado (Fase 5.1)
      fontSize: {
        'h1': ['1.75rem', { lineHeight: '2rem' }],
        'h2': ['1.5rem', { lineHeight: '1.75rem' }],
        'h3': ['1.25rem', { lineHeight: '1.5rem' }],
        'h4': ['1.125rem', { lineHeight: '1.375rem' }],
        'body': ['1rem', { lineHeight: '1.5rem' }],
        'caption': ['0.875rem', { lineHeight: '1.25rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
    },
  },
  plugins: [],
};
export default config;
