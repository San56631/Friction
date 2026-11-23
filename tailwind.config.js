/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0B2559',
          'navy-dark': '#07193D',
          'navy-soft': '#EFF4FB',
          teal: '#009E96',
          'teal-dark': '#007E77',
          'teal-soft': '#E6F7F6',
          amber: '#EAB308',
          'amber-dark': '#CA8A04',
          'amber-soft': '#FEFCE8'
        }
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
};
