'use strict';

function makeHook(model, endpoint) {
  model.beforeRemote(endpoint, function (context, user, next) {
    console.log(endpoint)
    console.log('------------------------------------------- context ----------------------------------')
    console.log(context)
    console.log('------------------------------------------- user ----------------------------------')
    console.log(next)
    console.log('------------------------------------------- end ----------------------------------')

    next()
  })
}

module.exports = function(Container) {
  makeHook(Container, 'upload')
  makeHook(Container, '*.upload')
  makeHook(Container, '*upload')
};
