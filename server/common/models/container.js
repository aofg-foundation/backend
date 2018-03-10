const { promisify } = require('util');

'use strict';

module.exports = function(Container) {
  Container.beforeRemote('upload', function (context, user, next) {
    // console.log('------------- before context --------------')
    console.log(user)
    next()
  })

  Container.afterRemote('upload', async function (context, result) {
    // console.log('------------- after context --------------')
    const { Image } = Container.app.models
    const { file } = result.result.files
    const createImage = promisify(Image.create.bind(Image))

    const imagesData = file.map(f => ({
      ...f,
      path: `${f.container}/${f.name}`,
      title: f.name
    }))

    const images = await createImage(imagesData)

    console.log('created images', images)
  })
}
