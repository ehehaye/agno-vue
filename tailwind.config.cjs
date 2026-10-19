/**
 * Design tokens mirror src/assets/styles/variables.less.
 * Keep both files in sync when a token changes.
 */
module.exports = {
  mode: 'jit',
  purge: ['./index.html', './src/**/*.{vue,js}'],
  darkMode: false,
  corePlugins: {
    // reset.less owns the global reset
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#3f7ee8',
          hover: '#5a95f5',
          active: '#2f67cc',
        },
        success: '#67c23a',
        warning: '#e6a23c',
        danger: '#f56c6c',
        info: '#909399',
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f6f8fc',
          hover: '#eef5ff',
        },
        ink: {
          DEFAULT: '#1f2937',
          muted: '#667085',
          disabled: '#98a2b3',
        },
        line: {
          DEFAULT: '#d9e2ef',
          light: '#edf2f7',
        },
        code: '#f2f2f2',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '22px',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'sans-serif',
        ],
      },
      boxShadow: {
        focus: '0 0 0 2px rgba(63, 126, 232, 0.14)',
      },
      transitionTimingFunction: {
        base: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      height: {
        header: '52px',
      },
      width: {
        content: '70%',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
