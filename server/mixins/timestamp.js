module.exports = function (Model, options) {
  Model.defineProperty('createdAt', { type: Date, default: '$now' })
  Model.defineProperty('modifiedAt', { type: Date, default: '$now' })

  Model.observe('before save', function (ctx, next) {
    if (ctx.instance) {
      ctx.instance.unsetAttribute('createdAt')
      ctx.instance.modifiedAt = Date.now() 
      ctx.instance.createdAt = Date.now()
    } else {
      delete ctx.data.createdAt
      ctx.data.modifiedAt = Date.now()
    }

    next()
  })
}