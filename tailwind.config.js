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
        'bg-dark': '#0A0A0A',  // Darker background
        'bg-card': '#141414',  // Darker card background
        'bg-light': '#222222', // Darker light background
        
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
        
        // Text colors with enhanced contrast
        'text-primary': '#FFFFFF',    // Pure white for maximum contrast
        'text-secondary': '#F0F0F0',  // Lighter secondary text
        'text-muted': '#BBBBBB',      // Lighter muted text
        
        // Board colors with better contrast
        'board-light': '#2A2A2A',     // Light squares
        'board-dark': '#1A1A1A',      // Dark squares
        
        // Complementary colors for accents
        teal: {
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
        },
        indigo: {
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
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