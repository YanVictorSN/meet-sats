/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',     // Para Next.js usando app directory
    './pages/**/*.{js,ts,jsx,tsx}',   // Para Next.js usando pages directory
    './components/**/*.{js,ts,jsx,tsx}', // Componentes
    './src/**/*.{js,ts,jsx,tsx}', // Se você tiver um diretório src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
