const { locales } = require('../../config')

const bodyPart = {
  component: String,
  props: Object,
  children: [ this ]
}

const bodyConstructorType = locales.reduce((acc, locale) => {
  acc[locale] = [ bodyPart ]
  return acc
}, {})

module.exports = function (Model, options) {
  const fieldName = options.fieldName || 'body'
  
  Model.defineProperty(fieldName, { 
    type: bodyConstructorType
  })
}