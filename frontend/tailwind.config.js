/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      colors: {
        // Laranja/vermelho vívido — tom de streaming/mídia, no lugar do
        // indigo corporativo original.
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        accent: {
          500: '#e11d48',
          600: '#be123c',
        },
      },
    },
  },
  plugins: [],
};
