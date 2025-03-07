/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        black: '#121212',
        'gray-dark': '#1E1E1E',
        'gray-medium': '#2A2A2A',
        'gray-light': '#3A3A3A',
        peach: {
          100: '#FFF5F0',
          200: '#FFE6D9',
          300: '#FFD6C2',
          400: '#FFC7AB',
          500: '#FFB894',
          600: '#FF9E70',
          700: '#FF844C',
          800: '#FF6A28',
          900: '#FF5003',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}; 