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
        // Epic Gaming Emotions and Storytelling Palette
        primary: {
          50: '#F9F7F7',
          100: '#E8E4E4',
          200: '#D1C9C9',
          300: '#BAAEAE',
          400: '#A39393',
          500: '#0F3460', // Medium dark blue
          600: '#0D2D52',
          700: '#0A2544',
          800: '#081D36',
          900: '#1A1A2E', // Very dark blue/black
        },
        dark: {
          DEFAULT: '#1A1A2E',
          navy: '#16213E',
          blue: '#0F3460',
        },
        accent: {
          DEFAULT: '#E94560',
          light: '#F06B82',
          dark: '#D1344F',
        },
        light: {
          DEFAULT: '#F9F7F7',
        },
      },
    },
  },
  plugins: [],
}

