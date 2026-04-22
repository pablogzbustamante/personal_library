/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  safelist: [{ pattern: /^dark:/ }],
  theme: {
    extend: {
      colors: {
        primary: '#534AB7',
      },
    },
  },
  plugins: [],
}
