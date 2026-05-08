/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#05070d',
          navy: '#0a0e1a',
          orange: '#f97316',
          'orange-dark': '#c2570f',
          'orange-light': '#fb923c',
          cream: '#f5efe3',
          'cream-muted': '#b8b2a7',
          'cream-dim': '#7a7570',
          panel: '#0f1420',
          border: '#1e2535',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Georgia', 'serif'],
      },
      backgroundImage: {
        'stripe-pattern': 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(249,115,22,0.08) 4px, rgba(249,115,22,0.08) 8px)',
      },
    },
  },
  plugins: [],
};
