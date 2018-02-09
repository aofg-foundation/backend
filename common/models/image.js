'use strict'

module.exports = function(Image) {
  // create hook

  // custom version request

  // upload image
  Image.upload = function (msg, cb) {
    console.log(msg)
  }

  Image.remoteMethod('upload', {
    accepts: {arg: 'msg', type: 'string'},
    returns: {arg: 'greeting', type: 'string'}
  })
}