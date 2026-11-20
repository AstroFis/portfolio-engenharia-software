/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pequim: {
          primary: '#992a23',    // --cs-site-primaria
          secondary: '#662215',  // --cs-site-secundaria / destaque
          navy: '#992a23',       // Mapeado para a cor primária institucional da Pequim
          dark: '#662215',       // Mapeado para o tom bordô escuro da Pequim
          deeper: '#47150c',
          charcoal: '#3b3b3b',   // Grafite da tipografia da logo PEQUIM
          soft: '#454545',       // --cs-site-texto-suave
          clara: '#efefef',      // --cs-site-clara
          light: '#fdf3f2',
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
