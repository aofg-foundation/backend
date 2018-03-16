'use strict'

const ThumborClient = require('../utils/thumbor-url-builder')
const Boom = require('boom')
const config = require('../config')
const request = require('request')

const THUMBOR_SECRET = process.env.THUMBOR_SECRET || 'SECURIZE_ME'

const templates = {
  'thumb': ({ domain, container, name }) => new ThumborClient(THUMBOR_SECRET, 'http://localhost:8000')
    .setImagePath(`${domain}/api/containers/${container}/download/${name}`)
    .fitIn(300, 300)
    .filter(`quality(80)`)
    .filter(`fill(2f3542)`)
    .build(),
  'content': ({ domain, container, name }) => new ThumborClient(THUMBOR_SECRET, 'http://localhost:8000')
    .setImagePath(`${domain}/api/containers/${container}/download/${name}`)
    .resize(1140, 0)
    .filter(`quality(80)`)
    .build(),
  'content_lazy': ({ domain, container, name }) => new ThumborClient(THUMBOR_SECRET, 'http://localhost:8000')
    .setImagePath(`${domain}/api/containers/${container}/download/${name}`)
    .resize(Math.floor(1140 / 5), 0)
    // .resize(1140, 0)
    .filter(`blur(30)`)
    .filter(`quality(0)`)
    .build(),
  'sidebar': ({ domain, container, name }) => new ThumborClient(THUMBOR_SECRET, 'http://localhost:8000')
    .setImagePath(`${domain}/api/containers/${container}/download/${name}`)
    .resize(350, 1080)
    .filter(`quality(85)`)
    .build()
}

const CropModel = {
  left: {
    type: Number,
    required: true
  },
  top: {
    type: Number,
    required: true
  },
  right: {
    type: Number,
    required: true
  },
  bottom: {
    type: Number,
    required: true
  }
}
const FilterModel = {
  name: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  }
}
const TrimModel = {
  orientation: {
    type: String,
    required: true
  },
  tolerance: {
    type: Number,
    required: true
  }
}
const VariantModel = {
  name: {
    type: String,
    required: true
  },
  container: {
    type: String,
    required: true
  },
  width: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  crop: 'Crop',
  horizontalFlip: Boolean,
  verticalFlip: Boolean,
  halign: String,
  valign: String,
  smart: Boolean,
  fitIn: Boolean,
  filters: ['Filter'],
  trim: 'Trim'
}

// TODO babelrc
const { domain } = { domain: "http://10.0.75.1:3000" } //require('../server/config.json')

function imageRedirect (ctx, { response }, next) {
  ctx.req.pipe(request(response.variant)).pipe(ctx.res)
  // console.log(ctx.req)
  // ctx.res.redirect(302, response.variant)
  // console.log(response.variant)
}

module.exports = function(Image) {
  console.log('---- Setup Image Dependencies')
  require('loopback').createModel('Crop', CropModel)
  require('loopback').createModel('Trim', TrimModel)
  require('loopback').createModel('Filter', FilterModel)
  require('loopback').createModel('Variant', VariantModel)

  // custom version request
  Image.make = async function (req, variant, next) {
    console.log('make image variant', variant)
    const {
      // Required
      name,
      container,
      width,
      height,

      // Optional
      crop,
      horizontalFlip,
      verticalFlip,
      halign,
      valign,
      smart,
      fitIn,
      filters,
      trim
    } = variant

    // Get dependencies
    console.log(Object.keys(Image.app.models))
    const Container = Image.app.models.container
    const { ImageShortlink } = Image.app.models

    const thumborRequest = new ThumborClient(THUMBOR_SECRET, 'http://localhost:8000')
    thumborRequest.setImagePath(`${domain}/api/containers/${container}/download/${name}`)

    if (filters && filters.length) {
      filters.forEach(filter => thumborRequest.filter(`${filter.name}(${filter.value})`))
    }

    // Crop
    if (crop && (crop.left || crop.top || crop.right || crop.bottom)) {
      thumborRequest.crop(crop.left, crop.top, crop.right, crop.bottom)
    }

    // Flip
    if (horizontalFlip) {
      thumborRequest.flipHorizontally()
    }
    if (verticalFlip) {
      thumborRequest.flipVertically()
    }

    // Fit
    if (fitIn) {
      thumborRequest.fitIn(width, height)
    } else {
      thumborRequest.resize(width, height)
    }

    if (valign) {
      thumborRequest.valign(valign)
    }
    if (halign) {
      thumborRequest.halign(halign)
    }

    const thumborParts = thumborRequest.build() 
    const variantData = {
      original: thumborParts.image,
      variant: thumborParts.full,
      config: variant,
      hmac: thumborParts.key,
      url: `${config.domain}/api/images/variant/${thumborParts.key}`
    }

    // Container.uploadStream(container, req, )
    const Readable = require('stream').Readable
    const sourceResponseStream = new Readable()

    console.log(variantData.variant)

    const uploadRequest = {
      method: 'POST',
      url: `http://localhost:3000/api/containers/${container}/upload`,
      formData: {
        file : request(variantData.variant)
      },
      json: true
    }

    const uploadResponse = await request(uploadRequest)
    return uploadResponse
    //     // mark as no more data to read
    //     sourceResponseStream.push(null)
    //     sourceResponseStream.pipe(request
    //       .post(`http://localhost:3000/containers/${container}/upload`, {
    //          formData: {
    //           file: sourceResponseStream
    //         }
    //       })
    //       .on('end', () => next()))
    //   })
  }

  Image.unsafe = async function(req, container, name, width, height, crop, quality) {
    const thumborRequest = new ThumborClient(THUMBOR_SECRET, 'http://localhost:8000')
    thumborRequest
      .setImagePath(`${domain}/api/containers/${container}/download/${name}`)
      .resize(width, height)
      .filter(`quality(${quality})`)

    const thumborParts = thumborRequest.build()
    return {
      original: thumborParts.image,
      variant: thumborParts.full,
      hmac: thumborParts.key
    }
  }
  Image.variant = async function (req, key) {
    // Get dependencies
    const { ImageShortlink } = Image.app.models
    return ImageShortlink.get(key)
  }

  Image.template = async function (req, template, container, name) {
    if (typeof templates[template] === 'undefined') {
      throw Boom.badRequest(`Target template "${template}" not found`)
    }

    const thumborParts = templates[template]({ domain, container, name })

    console.log('Template image', {
      original: thumborParts.image,
      variant: thumborParts.full,
      hmac: thumborParts.key
    })

    return {
      original: thumborParts.image,
      variant: thumborParts.full,
      hmac: thumborParts.key
    }
  }

  Image.afterRemote('variant', imageRedirect)
  Image.afterRemote('unsafe', imageRedirect)
  Image.afterRemote('template', imageRedirect)
  // Image.afterRemote('make', imageRedirect)

  Image.remoteMethod('template', {
    http: {
      verb: 'GET',
      path: '/:template/:container/:name'
    },
    accepts: [
      { arg: 'req', type: 'object', 'http': {source: 'req'} },
      { arg: 'template', type: 'string' },
      { arg: 'container', type: 'string' },
      { arg: 'name', type: 'string' }
    ],
    returns: { arg: 'response', type: 'object' }
  })
  Image.remoteMethod('variant', {
    http: {
      verb: 'GET',
      path: '/variant/:key'
    },
    accepts: [
      { arg: 'req', type: 'object', 'http': {source: 'req'} },
      { arg: 'key', type: 'string' },
    ],
    returns: { arg: 'response', type: 'object' }
  })

  Image.remoteMethod('make', {
    http: {
      verb: 'POST',
      path: '/make'
    },
    accepts: [
      { arg: 'req', type: 'object', 'http': {source: 'req'} },
      { arg: 'body', type: 'Variant', http: { source: 'body' }, required: true },
    ],
    returns: { arg: 'response', type: 'object' }
  })

  Image.remoteMethod('unsafe', {
    http: {
      verb: 'GET',
      path: '/:container/:name'
    },
    accepts: [
      { arg: 'req', type: 'object', 'http': {source: 'req'} },
      { arg: 'container', type: 'string' },
      { arg: 'name', type: 'string' },
      { arg: 'width', type: 'number' },
      { arg: 'height', type: 'number' },
      { arg: 'crop', type: 'string' },
      { arg: 'quality', type: 'number' }
    ],
    returns: { arg: 'response', type: 'object' }
  })
}