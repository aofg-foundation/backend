'use strict';
const { defaultLocale } = require('../config')
const slug = require('slug')

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1)
  }
  return s4() + s4();
}

module.exports = function (Post) {
  Post.beforeRemote('create', function (context, user, next) {

    if (!context.args.data.title || !context.args.data.title[defaultLocale])
    {
      next(new Error('title is required'))
    }

    context.args.data.authorId = context.req.accessToken.userId
    context.args.data.slug = slug(context.args.data.title[defaultLocale])

    next()
  })
}
