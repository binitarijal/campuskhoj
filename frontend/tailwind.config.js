/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#26384A',
        teal: '#287A74',
        'teal-light': '#55A9A0',
        cream: '#F7FAF8',
        amber: '#FFF8B0',
        mist: '#AEEED3',
        page: '#F7FAF8',
        muted: '#687B76',
      },
      boxShadow: {
        soft: '0 12px 35px rgba(38, 56, 74, 0.08)',
        lift: '0 18px 44px rgba(38, 56, 74, 0.14)',
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
