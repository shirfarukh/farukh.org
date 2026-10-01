/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EFF4FF',
          100: '#DBE5FE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#2563EB',
          600: '#0B25B7',
          700: '#061D8F',
          800: '#031366',
          900: '#020B38',
        },
        gold: {
          50: '#FEFCE8',
          100: '#FEF9C3',
          200: '#FEF08A',
          300: '#FDE047',
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
          700: '#A16207',
          800: '#854D0E',
          900: '#713F12',
        },
        surface: {
          dark: '#030819',
          card: '#091430',
          border: '#1E2D5A',
          hover: '#132452',
          light: '#F8FAFC',
        }
      },
    },
  },
  plugins: [],
};
