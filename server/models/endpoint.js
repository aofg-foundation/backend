// 'use strict';

// module.exports = function(Endpoint) {
//   Endpoint.me = async function (req) {
//     return Endpoint.app.models.Person.findOne({ where: { id: req.accessToken.userId }})
//   }

//   Endpoint.remoteMethod('me', {
//     http: {
//       verb: 'GET',
//       path: '/me'
//     },
//     accepts: { arg: 'req', type: 'object', 'http': { source: 'req' } },
//     returns: { arg: 'response', type: 'object' }
//   })

// };

'use strict'

const path = require('path')
const Boom = require('boom')
const { recover } = require('../utils/crypto')

// function asyncMiddleware (fn) {
//   return (req, res, next) => {
//     Promise.resolve(fn(req, res, next)).catch(next);
//   }
// }

module.exports = function(Endpoint) {
  Endpoint.me = async function (req) {
    if (!req.accessToken)
      throw Boom.forbidden('Authentication is required')

    const { Person } = Endpoint.app.models
    return await Person.findOne({ where: { id: req.accessToken.userId }})
  }

  Endpoint.nonce = async function (req, body) {
    const { email } = body
    const { Person } = Endpoint.app.models
    const person = await Person.findOne({ where: { email: email }})

    if (!person) {
      throw Boom.notFound(`Person not found`)
    }

    return {
      nonce: person.latestNonce || 0
    }
  }
  Endpoint.login = async function (req, body) {
    const { payload, signature } = body
    const { email, nonce } = payload
    const { Person } = Endpoint.app.models
    const person = await Person.findOne({ where: { email: email }})

    if (!person) {
      throw Boom.forbidden(`Incorrect authentication request (person not found)`)
    }

    console.log(person)
    const { address } = person
    const latestNonce = person.latestNonce || 0

    if (nonce != latestNonce + 1) {
      throw Boom.forbidden(`Incorrect authentication request (incorrect nonce)`)
    }

    // address in checksum syntax
    const recoveredAddress = recover(payload, signature)
    const correctSignature = recoveredAddress.toLowerCase() === address.toLowerCase()

    if (!correctSignature) {
      throw Boom.forbidden(`Incorrect authentication request (incorrect signature: ${recoveredAddress} != ${address})`)
    }

    person.latestNonce = nonce
    await person.save()
    // Create the accesstoken and return the Token
    const token = await person.createAccessToken(5000)
    
    return {
      "token": token.id,
      "ttl": token.ttl
    }
  }

  Endpoint.signup = async function (req, body) {
    const { payload, signature } = body
    const { address, email } = payload
    const { Person } = Endpoint.app.models

    // address in checksum syntax
    const recoveredAddress = recover(payload, signature)
    const correctSignature = recoveredAddress.toLowerCase() === address.toLowerCase()

    if (!correctSignature) {
      throw Boom.forbidden('Incorrect signature providen')
    }

    let existedPerson = await Person.findOne({
      where: { email: email }
    })

    console.log(existedPerson)

    if (!existedPerson) {
      existedPerson = await Person.create({
        email,
        // TODO: remove password 
        password: signature.substring(0, 20),
        address
      })
    } else if (existedPerson.emailVerified) {
      throw Boom.forbidden('Verified account')
    }

    const options = {
      type: 'email',
      to: existedPerson.email,
      from: 'noreply@loopback.com',
      subject: 'Thanks for registering.',
      template: path.resolve(__dirname, '../views/verify.ejs'),
      redirect: '/verified',
      user: existedPerson
    };

    return new Promise((resolve, reject) => {
      existedPerson.verify(options, function(err, response, next) {
        if (err) {
          reject(Boom.badRequest(err))
        }

        console.log('> verification email sent:', response)
        resolve(true)
      })
    })
  }


  Endpoint.remoteMethod('me', {
    http: { verb: 'GET' },
    accepts: [
      { arg: 'req', type: 'object', 'http': { source: 'req' } }
    ],
    returns: { arg: 'response', type: 'object' }
  })
  Endpoint.remoteMethod('nonce', {
    http: { verb: 'POST' },
    accepts: [
      { arg: 'req', type: 'object', 'http': { source: 'req' } },
      { arg: 'body', type: 'object', http: { source: 'body' }, required: true }
    ],
    returns: { arg: 'response', type: 'object' }
  })
  Endpoint.remoteMethod('login', {
    http: { verb: 'POST' },
    accepts: [
      { arg: 'req', type: 'object', 'http': { source: 'req' } },
      { arg: 'body', type: 'object', http: { source: 'body' }, required: true }
    ],
    returns: { arg: 'response', type: 'object' }
  })
  Endpoint.remoteMethod('signup', {
    http: { verb: 'POST' },
    accepts: [
      { arg: 'req', type: 'object', 'http': { source: 'req' } },
      { arg: 'body', type: 'object', http: { source: 'body' }, required: true }
    ],
    returns: { arg: 'response', type: 'object' }
  })


  // router.get('/me', asyncMiddleware(async function (req, res) {
  //   console.log(req.accessToken)
  //   res.json(await Person.findOne({ where: { id: req.accessToken.userId }}))
  // }))

  // router.post('/nonce', asyncMiddleware(async function (req, res) {
  //   const { payload } = req.body
  //   const { email } = payload

  //   const person = await Person.findOne({ where: { email: email }})

  //   if (!person) {
  //     throw Boom.notFound(`Person not found`)
  //   }

  //   res.json({
  //     nonce: person.latestNonce || 0
  //   })
  // }))

  // router.post('/login', asyncMiddleware(async function (req, res) {
  //   const { payload, signature } = req.body
  //   const { email, nonce } = payload
  //   const person = await Person.findOne({ where: { email: email }})

  //   if (!person) {
  //     throw Boom.forbidden(`Incorrect authentication request (person not found)`)
  //   }

  //   const { address } = person
  //   const latestNonce = person.latestNonce || 0

  //   if (nonce != latestNonce + 1) {
  //     throw Boom.forbidden(`Incorrect authentication request (incorrect nonce)`)
  //   }

  //   // address in checksum syntax
  //   const recoveredAddress = recover(payload, signature)
  //   const correctSignature = recoveredAddress.toLowerCase() === address.toLowerCase()

  //   if (!correctSignature) {
  //     throw Boom.forbidden(`Incorrect authentication request (incorrect signature: ${recoveredAddress} != ${address})`)
  //   }

  //   person.latestNonce = nonce
  //   await person.save()
  //   // Create the accesstoken and return the Token
  //   const token = await person.createAccessToken(5000)
    
  //   res.json({
  //     "token": token.id,
  //     "ttl": token.ttl
  //   })
  // }))

  // router.post('/signup', asyncMiddleware(async function (req, res) {
  //   const { payload, signature } = req.body

  //   const { address, email } = payload

  //   // address in checksum syntax
  //   const recoveredAddress = recover(payload, signature)
  //   const correctSignature = recoveredAddress.toLowerCase() === address.toLowerCase()

  //   if (!correctSignature) {
  //     throw Boom.forbidden('Incorrect signature providen')
  //   }

  //   let existedPerson = await Person.findOne({
  //     where: { email: email }
  //   })

  //   console.log(existedPerson)

  //   if (!existedPerson) {
  //     existedPerson = await Person.create({
  //       email,
  //       // TODO: remove password 
  //       password: signature.substring(0, 20),
  //       address
  //     })
  //   } else if (existedPerson.emailVerified) {
  //     throw Boom.forbidden('Verified account')
  //   }

  //   const options = {
  //     type: 'email',
  //     to: existedPerson.email,
  //     from: 'noreply@loopback.com',
  //     subject: 'Thanks for registering.',
  //     template: path.resolve(__dirname, '../views/verify.ejs'),
  //     redirect: '/verified',
  //     user: existedPerson
  //   };

  //   existedPerson.verify(options, function(err, response, next) {
  //     if (err) {
  //       throw Boom.badRequest(err)
  //     }

  //     console.log('> verification email sent:', response)
  //     res.json(true)
  //   })
    

  //   // 1) get email from payload
  //   // 2) recover address from signature
  //   // 3) check if email isn't exist or not verified yet
  //   // 4) create Person record
  //   // 5) send verification email to providen email address
  //   // 6) waiting for verification
  // }))
}