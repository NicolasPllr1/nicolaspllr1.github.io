const plugin = require('tailwindcss/plugin')

module.exports = {
  content: [
    './*.html',
    './posts/*.html'
  ],
  plugins: [
    plugin(function({ addComponents }) {
      addComponents({
        '.tokyo-night': {
          color: '#9aa5ce',
          backgroundColor: '#1a1b26',

          'h1, .h1': {
            color: '#f7768e',
            fontSize: '1.875rem', /* text-3xl */
            marginBottom: '1rem', /* mb-4 */
          },
          'h2, .h2': {
            color: '#61bdf2',
            fontSize: '1.5rem',    /* text-2xl */
            marginBottom: '0.75rem', /* mb-3 */
          },
          'h3, .h3': {
            color: '#7aa2f7',
            marginBottom: '0.5rem', /* mb-2 */
          },
          'h4, .h4': {
            color: '#6d91de',
            marginBottom: '0.5rem',
          },

          // // Links
          // 'a, .link': {
          //   color: '#73daca',
          //   '&:hover': {
          //     textDecoration: 'underline'
          //   }
          // },
          // Links
          'a, .link': {
            color: '#73daca',
            transition: 'color 0.1s ease',
            '&:hover': {
              color: '#5db9a7', /* Slightly darker version of the link color */
              // textDecoration: 'underline'
            }
          },

          // Borders
          '.border-tokyo': {
            borderColor: '#101014'
          },
          '.border-highlight': {
            borderColor: '#3d59a1'
          },
          '.border-secondary': {
            borderColor: '#29355a'
          },
          '.border-subtle': {
            borderColor: '#232433'
          },

          // Buttons
          '.btn': {
            backgroundColor: '#3d59a1dd',
            color: '#ffffff',
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
            '&:hover': {
              backgroundColor: '#3d59a1AA'
            }
          },

          // Backgrounds
          '.bg-secondary': {
            backgroundColor: '#16161e'
          },
          '.bg-accent': {
            backgroundColor: '#1e202e'
          },

          // Status colors
          '.warning': {
            color: '#e0af68'
          },
          '.success': {
            color: '#9ece6a'
          },
          '.info': {
            color: '#7dcfff'
          },
          '.error': {
            color: '#f7768e'
          }
        }
      })
    })
  ],
}
