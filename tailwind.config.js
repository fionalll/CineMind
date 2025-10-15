/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Truman Teması Renkleri
        'truman': {
          'light': '#F4F5FF',
          'sidebar': '#D0CDFF',
          'navbar': '#BDBFFF',
          'accent': '#7C7AFF'
        },
        // Cadılar Bayramı Teması Renkleri
        'halloween': {
          'dark': '#443737',
          'sidebar': '#934D01',
          'navbar': '#D58E2C',
          'accent': '#FF8C42'
        },
        // Peach Teması Renkleri
        'peach': {
          'light': '#FFE7E7',
          'sidebar': '#FFC5C5',
          'navbar': '#F19A9A',
          'accent': '#E85A5A'
        },
        // Marshmallow Teması Renkleri
        'marshmallow': {
          'light': '#FFFDF1',
          'sidebar': '#FDFFD2',
          'navbar': '#D5B3D5',
          'accent': '#B388B3'
        },
        // Broadway Teması Renkleri
        'broadway': {
          'light': '#FFF0C4',
          'sidebar': '#8C1007',
          'navbar': '#660B05',
          'accent': '#B8270B'
        },
        // Sunrise Teması Renkleri
        'sunrise': {
          'light': '#FEFFC4',
          'sidebar': '#FFDE63',
          'navbar': '#799EFF',
          'accent': '#5577FF'
        },
        // Pistachio Teması Renkleri
        'pistachio': {
          'light': '#E9EED9',
          'sidebar': '#CBD2A4',
          'navbar': '#54473F',
          'accent': '#7D8F7D'
        },
        // Watermelon Teması Renkleri
        'watermelon': {
          'light': '#FCFFE0',
          'sidebar': '#F5DAD2',
          'navbar': '#75A47F',
          'accent': '#E8B4B8'
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
