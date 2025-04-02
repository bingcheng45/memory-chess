/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['media', 'class'], // 'media' or 'class'
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		colors: {
  			'bg-dark': '#0A0A0A',
  			'bg-card': '#141414',
  			'bg-light': '#222222',
  			peach: {
  				'50': '#FFF9F5',
  				'100': '#FFF0E6',
  				'200': '#FFE0CC',
  				'300': '#FFD1B3',
  				'400': '#FFC299',
  				'500': '#FFB380',
  				'600': '#FF9F66',
  				'700': '#FF8C4D',
  				'800': '#FF7733',
  				'900': '#FF6419'
  			},
  			'text-primary': '#FFFFFF',
  			'text-secondary': '#F0F0F0',
  			'text-muted': '#BBBBBB',
  			'board-light': '#2A2A2A',
  			'board-dark': '#1A1A1A',
  			teal: {
  				'300': '#5EEAD4',
  				'400': '#2DD4BF',
  				'500': '#14B8A6',
  				'600': '#0D9488'
  			},
  			indigo: {
  				'300': '#A5B4FC',
  				'400': '#818CF8',
  				'500': '#6366F1',
  				'600': '#4F46E5'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		backgroundImage: {
  			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  			'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}; 