/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        uncommon: '#4CAF50',
        rare: '#2196F3',
        epic: '#9C27B0',
        legendary: '#FFC107',
        mythic: '#F44336',
      },
    },
  },
  plugins: [],
}