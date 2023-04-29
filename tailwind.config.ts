import type {Config} from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

export default {
  theme: {
    extend: {
      screens: {
        xs: {max: '420px'},
      },
      animation: {
        spinner: 'spin 0.6s linear infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    plugin(({addVariant}) => {
      addVariant('ios', '@supports(-webkit-touch-callout:none)');
    }),
    plugin(({addComponents, theme}) => {
      addComponents({
        '.spinner:before': {
          animation: theme('animation.spinner'),
        },
      });
    }),
  ],
  content: ['./templates/*.html'],
} satisfies Config;
