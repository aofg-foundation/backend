// 'use strict'
// const path = require('path')
// const Boom = require('boom')
// const { recover } = require('../utils/crypto')

// const { restApiRoot } = require('../config')

// function asyncMiddleware (fn) {
//   return (req, res, next) => {
//     Promise.resolve(fn(req, res, next)).catch(next);
//   }
// }

// module.exports = function(app) {
//   const router = app.loopback.Router()
//   const { Person } = app.models

//   router.get(restApiRoot + '/me', asyncMiddleware(async function (req, res) {
//     console.log(req.accessToken)
//     res.json(await Person.findOne({ where: { id: req.accessToken.userId }}))
//   }))

//   router.post(restApiRoot + '/nonce', asyncMiddleware(async function (req, res) {
//     const { payload } = req.body
//     const { email } = payload

//     const person = await Person.findOne({ where: { email: email }})

//     if (!person) {
//       throw Boom.notFound(`Person not found`)
//     }

//     res.json({
//       nonce: person.latestNonce || 0
//     })
//   }))

//   router.post(restApiRoot + '/login', asyncMiddleware(async function (req, res) {
//     const { payload, signature } = req.body
//     const { email, nonce } = payload
//     const person = await Person.findOne({ where: { email: email }})

//     if (!person) {
//       throw Boom.forbidden(`Incorrect authentication request (person not found)`)
//     }

//     const { address } = person
//     const latestNonce = person.latestNonce || 0

//     if (nonce != latestNonce + 1) {
//       throw Boom.forbidden(`Incorrect authentication request (incorrect nonce)`)
//     }

//     // address in checksum syntax
//     const recoveredAddress = recover(payload, signature)
//     const correctSignature = recoveredAddress.toLowerCase() === address.toLowerCase()

//     if (!correctSignature) {
//       throw Boom.forbidden(`Incorrect authentication request (incorrect signature: ${recoveredAddress} != ${address})`)
//     }

//     person.latestNonce = nonce
//     await person.save()
//     // Create the accesstoken and return the Token
//     const token = await person.createAccessToken(5000)
    
//     res.json({
//       "token": token.id,
//       "ttl": token.ttl
//     })
//   }))

//   router.post(restApiRoot + '/signup', asyncMiddleware(async function (req, res) {
//     const { payload, signature } = req.body

//     const { address, email } = payload

//     // address in checksum syntax
//     const recoveredAddress = recover(payload, signature)
//     const correctSignature = recoveredAddress.toLowerCase() === address.toLowerCase()

//     if (!correctSignature) {
//       throw Boom.forbidden('Incorrect signature providen')
//     }

//     let existedPerson = await Person.findOne({
//       where: { email: email }
//     })

//     console.log(existedPerson)

//     if (!existedPerson) {
//       existedPerson = await Person.create({
//         email,
//         // TODO: remove password 
//         password: signature.substring(0, 20),
//         address
//       })
//     } else if (existedPerson.emailVerified) {
//       throw Boom.forbidden('Verified account')
//     }

//     const options = {
//       type: 'email',
//       to: existedPerson.email,
//       from: 'noreply@loopback.com',
//       subject: 'Thanks for registering.',
//       template: path.resolve(__dirname, '../views/verify.ejs'),
//       redirect: restApiRoot + '/verified',
//       user: existedPerson
//     };

//     existedPerson.verify(options, function(err, response, next) {
//       if (err) {
//         throw Boom.badRequest(err)
//       }

//       console.log('> verification email sent:', response)
//       res.json(true)
//     })
    

//     // 1) get email from payload
//     // 2) recover address from signature
//     // 3) check if email isn't exist or not verified yet
//     // 4) create Person record
//     // 5) send verification email to providen email address
//     // 6) waiting for verification
//   }))
// }