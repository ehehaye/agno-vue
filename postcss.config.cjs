module.exports = {
  plugins: [
    require('@tailwindcss/postcss7-compat')({
      config: './tailwind.config.cjs',
    }),
    require('autoprefixer')(),
  ],
}
