/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sage: {
          deep:    '#3D4A3D',
          DEFAULT: '#5C6B5C',
          soft:    '#8A9A8A',
        },
        espresso: {
          DEFAULT: '#4A3F35',
          soft:    '#6B5D4F',
        },
        taupe: {
          DEFAULT: '#B8A88A',
          light:   '#D4C7AC',
        },
        cream:      '#E8D5B7',
        canvas:     '#F5EDE0',
        terracotta: {
          soft:    '#E5B5A0',
          DEFAULT: '#D08770',
          deep:    '#A8654F',
        },
        season: {
          'spring-1': '#E8A87C', 'spring-2': '#F2C57C', 'spring-3': '#E8D5A0', 'spring-4': '#95B89F',
          'summer-1': '#A8B5B8', 'summer-2': '#C9B5BA', 'summer-3': '#9AA8B5', 'summer-4': '#B5A0B0',
          'autumn-1': '#A0522D', 'autumn-2': '#7A8C3F', 'autumn-3': '#B8860B', 'autumn-4': '#6B4423',
          'winter-1': '#2C3E50', 'winter-2': '#7A2940', 'winter-3': '#355C7D', 'winter-4': '#3D2C3F',
        },
        state: {
          'success-bg':     '#DCE5D2', 'success-accent': '#7A8C5C', 'success-text': '#3D4A2A',
          'warning-bg':     '#F0E0C2', 'warning-accent': '#C9A05C', 'warning-text': '#5C4A1F',
          'error-bg':       '#E8C9BC', 'error-accent':   '#B8654A', 'error-text':   '#5C2A1F',
          'info-bg':        '#D5DCDD', 'info-accent':    '#6B7A82', 'info-text':    '#2A3D45',
        },
        shape: {
          oval:    '#A86B5C',
          round:   '#C9A05C',
          square:  '#7A8C5C',
          heart:   '#A89478',
          oblong:  '#7A6B82',
          diamond: '#5C7A82',
        },
      },
    },
  },
}
