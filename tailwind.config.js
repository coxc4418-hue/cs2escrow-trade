/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        cs: ['"CounterStrike"', '"Black Ops One"', '"Chakra Petch"', 'system-ui', 'sans-serif'],
        display: ['"Chakra Petch"', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      colors: {
        market: {
          bg: '#121721',
          nav: '#161c27',
          card: '#19202d',
          border: '#263042',
          elevated: '#1f2837',
        },
        csgold: '#f59e0b',
        ctblue: '#38bdf8',
      },
    },
  },
  plugins: [],
};
