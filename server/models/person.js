'use strict'

module.exports = function(Person) {
  Person.me = async function (req) {
    console.log(req)
    return 'test'
  }

  Person.remoteMethod('me', {
    http: {
      verb: 'GET',
      path: '/me'
    },
    accepts: { arg: 'req', type: 'object', 'http': {source: 'req'} },
    returns: { arg: 'response', type: 'object' }
  })
}
