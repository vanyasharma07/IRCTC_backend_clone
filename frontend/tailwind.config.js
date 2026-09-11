/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#dbe4fe',
          200: '#bfd1fe',
          300: '#93b4fd',
          400: '#608efa',
          500: '#3b6cf6',
          600: '#2550eb',
          700: '#1d3ed8',
          800: '#0f2461',
          900: '#0a1740',
          950: '#060d26',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        rail: {
          navy: '#0b132b',
          deep: '#1c2541',
          slate: '#3a506b',
          cyan: '#00e5ff',
          teal: '#06b6d4',
          silver: '#e2e8f0',
        },
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(15, 23, 42, 0.08)',
        'glass-hover': '0 12px 40px 0 rgba(15, 23, 42, 0.14)',
        'neon': '0 0 20px -3px rgba(6, 182, 212, 0.35)',
        'neon-amber': '0 0 20px -3px rgba(245, 158, 11, 0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulseSubtle 3s infinite',
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
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        }
      }
    },
  },
  plugins: [],
};
