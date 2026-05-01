/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#e2e8f0',
            a: { color: '#60a5fa' },
            strong: { color: '#f1f5f9' },
            code: { color: '#a78bfa', backgroundColor: '#1e293b', padding: '0.2em 0.4em', borderRadius: '0.25rem' },
            'pre code': { backgroundColor: 'transparent', padding: 0 },
          },
        },
      },
    },
  },
  plugins: [],
}
