/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Maison Neue"',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'system-ui',
          'sans-serif',
        ],
        display: [
          '"Maison Neue"',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          '"Maison Neue Mono"',
          '"JetBrains Mono"',
          '"SF Mono"',
          'ui-monospace',
          'monospace',
        ],
      },
      colors: {
        ink: {
          950: '#0A0A0A',
          900: '#111111',
          800: '#1A1A1A',
          700: '#262626',
          600: '#3D3D3D',
          500: '#737373',
          400: '#A3A3A3',
          300: '#D4D4D4',
          200: '#E5E5E5',
          100: '#F5F5F5',
          50: '#FAFAFA',
        },
        accent: {
          DEFAULT: '#80EF80',
          dim: '#5FBF5F',
          glow: '#80EF8033',
        },
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
