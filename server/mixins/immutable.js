module.exports = function (Model, options) {
  if (typeof options === 'object' && Array.isArray(options.fields)) {
    Model.observe('before save', function (ctx, next) {
      if (ctx.options && ctx.options.skipImmutable) {
        next()
      }
      
      options.fields.forEach(field => {
        if (ctx.instance) {
          ctx.instance.unsetAttribute(field)
        } else {
          delete ctx.data[field]
        }
      })

      next()
    })
  }
}