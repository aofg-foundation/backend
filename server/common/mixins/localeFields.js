const { locales } = require('../../config')

const localeStringType = locales.reduce((acc, locale) => {
  acc[locale] = String
  return acc
}, {})

module.exports = function (Model, options) {
  if (typeof options !== 'object' || !Array.isArray(options.fields)) {
    throw new Error("Locale Fields mixin requires fields option")
  }

  options.fields.forEach(field => {
    Model.defineProperty(field, { 
      type: localeStringType
    })
  })
}