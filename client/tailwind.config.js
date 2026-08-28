/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['Charter', 'Georgia', 'Cambria', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        wiki: {
          light: '#fcfbf9',
          border: '#eaecf0',
          darkBorder: '#334155',
          sidebar: '#f8fafc',
          darkSidebar: '#0f172a',
          accent: '#2563eb',
          accentHover: '#1d4ed8',
        }
      }
    },
  },
  plugins: [],
};
