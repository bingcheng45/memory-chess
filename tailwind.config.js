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
        // Dark background with better contrast
        'bg-dark': '#121212',
        'bg-card': '#1E1E1E',
        'bg-light': '#2A2A2A',
        
        // Peach accent colors with better contrast
        peach: {
          50: '#FFF9F5',
          100: '#FFF0E6',
          200: '#FFE0CC',
          300: '#FFD1B3',
          400: '#FFC299',
          500: '#FFB380', // Main accent color
          600: '#FF9F66',
          700: '#FF8C4D',
          800: '#FF7733',
          900: '#FF6419',
        },
        
        // Text colors with good contrast
        'text-primary': '#FFFFFF',
        'text-secondary': '#E0E0E0',
        'text-muted': '#A0A0A0',
        
        // Complementary colors for accents
        teal: {
          500: '#38B2AC',
          600: '#319795',
        },
        indigo: {
          500: '#667EEA',
          600: '#5A67D8',
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