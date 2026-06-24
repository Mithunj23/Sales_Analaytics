/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          900: '#0a0d14',
          800: '#0f1219',
          700: '#151b26',
          600: '#1c2333',
          500: '#232d40',
          400: '#2d3a52',
        },
        accent: {
          DEFAULT: '#6366f1',
          hover: '#818cf8',
          muted: '#6366f120',
        },
        emerald: { chart: '#10b981' },
        amber: { chart: '#f59e0b' },
        rose: { chart: '#f43f5e' },
        sky: { chart: '#38bdf8' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.4)',
        glow: '0 0 20px rgba(99,102,241,0.3)',
      },
    },
  },
  plugins: [],
}
