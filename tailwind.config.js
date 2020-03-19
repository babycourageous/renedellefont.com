const twForms = require('@tailwindcss/custom-forms')

function owl({ addUtilities, config, e }) {
  const newUtilities = {}
  const spacing = config('theme.spacing')

  Object.keys(spacing).forEach(key => {
    const className = `.${e(`o-${key}`)} > * + *`
    const marginTop = spacing[key]

    // Horizontal spacing too!
    const classNameHorizontal = `.${e(`oh-${key}`)} > * + *`
    const marginLeft = spacing[key]

    newUtilities[className] = { marginTop }
    newUtilities[classNameHorizontal] = { marginLeft }
  })

  addUtilities(newUtilities, ['responsive'])
}

module.exports = {
  theme: {
    fontFamily: {
      sans: 'Montserrat, sans-serif',
    },
    extend: {},
  },
  variants: {},
  plugins: [twForms, owl],
}
